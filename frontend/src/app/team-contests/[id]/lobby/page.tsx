"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Orbitron } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Clock, Wifi, Play } from "lucide-react";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });
const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/?$/, "/");

type MyTeamData = {
  team: { id: string; team_name: string; team_number: number };
  member: { user_id: string; is_captain: boolean };
  problems: { id: number; problem_slug: string; position: number }[];
  contest: {
    id: string;
    name: string;
    duration_sec: number;
    finalized: boolean;
  };
  is_captain: boolean;
};

type OnlineMember = {
  user_id: string;
  user_name: string;
  team_id: string;
  image_url: string;
  is_ready: boolean;
};

const fmt = (s: number) =>
  `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function TeamLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const contestID = params?.id as string;

  const isAdmin = user?.publicMetadata?.role === "admin";

  const myNodeId =
    typeof window !== "undefined"
      ? localStorage.getItem("elonode_db_id") || ""
      : "";

  const [myTeam, setMyTeam] = useState<MyTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [iAmReady, setIAmReady] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<OnlineMember[]>([]);
  const [readyCount, setReadyCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [starting, setStarting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!myNodeId) return;

    fetch(`${API}team-contests/${contestID}/my-team?user_id=${myNodeId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error && !isAdmin) {
          setError(data.error);
          return;
        }
        setMyTeam(data);
      })
      .catch(() => {
        if (!isAdmin) setError("Failed to load team info");
      })
      .finally(() => setLoading(false));
  }, [contestID, myNodeId, isAdmin]);

  const connectWS = useCallback(() => {
    if (!myNodeId || !user) return;

    const wsBase = API.replace(/^http/, "ws");
    const userName = encodeURIComponent(
      user.username ||
        user.firstName ||
        (isAdmin ? "Host (Spectator)" : "Player"),
    );
    const imageUrl = encodeURIComponent(user.imageUrl || "");
    const teamIDParam = myTeam
      ? `&team_id=${myTeam.team.id}`
      : "&team_id=admin-spectator";

    const wsUrl = `${wsBase}team-contests/${contestID}/lobby-socket?user_id=${myNodeId}${teamIDParam}&user_name=${userName}&image_url=${imageUrl}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        switch (msg.event) {
          case "LOBBY_UPDATE":
            const playersOnly = (msg.players || []).filter(
              (p: any) => p.team_id !== "admin-spectator",
            );
            setOnlineMembers(playersOnly);
            setReadyCount(msg.ready_count || 0);
            setTotalCount(playersOnly.length);

            const me = (msg.players || []).find(
              (p: any) => p.user_id === myNodeId,
            );
            if (me && me.is_ready) setIAmReady(true);
            break;

          case "MATCH_START":
            setStarting(true);
            let c = 10;
            setCountdown(c);
            const iv = setInterval(() => {
              c--;
              setCountdown(c);
              if (c === 0) {
                clearInterval(iv);
                if (isAdmin) {
                  router.push(`/team-contests/${contestID}`);
                } else {
                  router.push(`/team-contests/${contestID}/duel`);
                }
              }
            }, 1000);
            break;
        }
      } catch (err) {
        console.error("WS Parse Error", err);
      }
    };

    ws.onclose = () => {
      if (!starting) {
        reconnectRef.current = setTimeout(() => connectWS(), 3000);
      }
    };
  }, [myNodeId, myTeam, contestID, user, router, starting, isAdmin]);

  useEffect(() => {
    if ((!myTeam && !isAdmin) || !myNodeId) return;
    connectWS();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [myTeam, connectWS, myNodeId, isAdmin]);

  const handleReady = () => {
    if (iAmReady || !wsRef.current || !myTeam) return;
    setIAmReady(true);
    wsRef.current.send(
      JSON.stringify({
        event: "PLAYER_READY",
      }),
    );
  };

  const handleHostStart = () => {
    if (!wsRef.current || readyCount < 6) return;
    wsRef.current.send(
      JSON.stringify({
        event: "HOST_START_MATCH",
      }),
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b] font-mono">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">
            Loading lobby...
          </span>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b] font-mono">
        <div className="text-center">
          <p className="text-rose-400 text-sm mb-4">{error}</p>
          <Link
            href="/new"
            className="text-zinc-500 text-xs hover:text-white transition-colors"
          >
            ← Back to ICPC Hub
          </Link>
        </div>
      </div>
    );

  if (starting && countdown !== null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060b]">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] text-zinc-600 uppercase mb-6">
            Match starting in
          </p>
          <div
            className={`${orbitron.className} font-black`}
            style={{
              fontSize: 180,
              color:
                countdown <= 3
                  ? "#f87171"
                  : countdown <= 6
                    ? "#fbbf24"
                    : "#4ade80",
            }}
          >
            {countdown === 0 ? "GO" : countdown}
          </div>
        </div>
      </div>
    );

  const teamColor = myTeam?.team.team_number === 1 ? "#818cf8" : "#f87171";

  const emptySlots = Array.from({
    length: Math.max(0, 6 - onlineMembers.length),
  });

  return (
    <div className="min-h-screen bg-[#05060b] font-mono text-white">
      <style>{`@keyframes pulseGlow{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      <div className="h-12 border-b border-white/5 flex items-center justify-between px-6 bg-black/40">
        <Link
          href={isAdmin ? `/team-contests/${contestID}` : "/arena"}
          className="flex items-center gap-2 text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] tracking-widest uppercase"
        >
          <ArrowLeft size={12} /> {isAdmin ? "Spectator View" : "Arena"}
        </Link>
        <h1
          className={`${orbitron.className} text-lg font-black text-white uppercase tracking-tighter`}
        >
          TEAM <span className="text-indigo-500">LOBBY</span>
        </h1>
        <div
          className="flex items-center gap-2 text-[10px] text-emerald-400 tracking-widest"
          style={{ animation: "pulseGlow 2s ease infinite" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
            <p className="text-[9px] text-zinc-600 tracking-widest uppercase mb-3">
              Match
            </p>
            <p
              className={`${orbitron.className} text-lg font-black text-white uppercase mb-1`}
            >
              {myTeam?.contest.name || "ICPC 3v3 BATTLE"}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
              <Clock size={10} />
              <span>{fmt(myTeam?.contest.duration_sec || 7200)} duration</span>
            </div>
          </div>

          {!isAdmin && myTeam && (
            <>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                <p className="text-[9px] text-zinc-600 tracking-widest uppercase mb-3">
                  Your Team
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: teamColor }}
                  />
                  <span
                    className={`${orbitron.className} text-sm font-black uppercase`}
                    style={{ color: teamColor }}
                  >
                    {myTeam.team.team_name}
                  </span>
                  {myTeam.is_captain && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 ml-auto">
                      ★ CAPTAIN
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-500">
                  Faction {myTeam.team.team_number === 1 ? "Alpha" : "Beta"}
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
                <p className="text-[9px] text-zinc-600 tracking-widest uppercase mb-3">
                  Problems
                </p>
                <div className="space-y-2">
                  {myTeam.problems.map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-[9px] font-black text-cyan-400 w-4">
                        {String.fromCharCode(64 + p.position)}
                      </span>
                      <span className="text-[10px] text-zinc-300 font-mono truncate">
                        {p.problem_slug}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {isAdmin && (
            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-5 text-center">
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-2">
                Host Mode Active
              </p>
              <p className="text-[10px] text-zinc-500">
                You are spectating the lobby. Wait for all 6 players to ready up
                before initiating the battle.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
                Ready Status
              </p>
              <span
                className="text-[10px] font-mono"
                style={{ color: readyCount >= 6 ? "#4ade80" : "#fbbf24" }}
              >
                {readyCount}/6 Ready
              </span>
            </div>
            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(readyCount / 6) * 100}%`,
                  background: readyCount >= 6 ? "#4ade80" : "#6366f1",
                }}
              />
            </div>
            {readyCount < 6 && (
              <p className="text-[9px] text-zinc-600 mt-2 animate-pulse">
                Waiting for all 6 players to ready up...
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={12} className="text-zinc-500" />
              <p className="text-[9px] text-zinc-600 tracking-widest uppercase">
                Online Players ({onlineMembers.length}/6)
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {onlineMembers.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                  style={{
                    background: m.is_ready
                      ? "rgba(74,222,128,0.05)"
                      : "rgba(255,255,255,0.02)",
                    borderColor: m.is_ready
                      ? "rgba(74,222,128,0.25)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="relative flex-shrink-0">
                    {m.image_url ? (
                      <Image
                        src={m.image_url}
                        alt={m.user_name || "User"}
                        width={32}
                        height={32}
                        unoptimized
                        className="rounded-lg"
                        style={{ width: 32, height: 32, objectFit: "cover" }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-black text-indigo-400">
                        {m.user_name
                          ? m.user_name.slice(0, 2).toUpperCase()
                          : "??"}
                      </div>
                    )}
                    {m.is_ready && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border border-[#05060b]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-white truncate">
                      {m.user_name}
                    </p>
                    <p
                      className="text-[8px] tracking-widest"
                      style={{ color: m.is_ready ? "#4ade80" : "#52525b" }}
                    >
                      {m.is_ready ? "READY" : "WAITING"}
                    </p>
                  </div>
                </div>
              ))}

              {emptySlots.map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-zinc-800"
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-zinc-700 animate-pulse" />
                  </div>
                  <p className="text-[9px] text-zinc-700 uppercase tracking-widest">
                    Waiting...
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-5">
            <p className="text-[9px] text-zinc-600 tracking-widest uppercase mb-3">
              Share Lobby
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-zinc-800 rounded-lg px-3 py-2 text-[10px] text-zinc-400 font-mono truncate">
                {typeof window !== "undefined" ? window.location.href : ""}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all cursor-pointer"
                style={{
                  borderColor: copied
                    ? "rgba(74,222,128,0.4)"
                    : "rgba(99,102,241,0.3)",
                  color: copied ? "#4ade80" : "#818cf8",
                  background: copied
                    ? "rgba(74,222,128,0.08)"
                    : "rgba(99,102,241,0.08)",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={handleHostStart}
              disabled={readyCount < 6}
              className="w-full py-4 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest border-0 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background:
                  readyCount >= 6
                    ? "linear-gradient(135deg,#f59e0b,#fbbf24)"
                    : "rgba(255,255,255,0.05)",
                boxShadow:
                  readyCount >= 6
                    ? "0 12px 40px rgba(245,158,11,0.35)"
                    : "none",
                color: readyCount >= 6 ? "#000" : "#52525b",
              }}
            >
              <Play size={14} fill="currentColor" />
              {readyCount >= 6 ? "START BATTLE" : "WAITING FOR ALL PLAYERS"}
            </button>
          ) : (
            <button
              onClick={handleReady}
              disabled={iAmReady}
              className="w-full py-4 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest border-0 cursor-pointer transition-all disabled:opacity-60"
              style={{
                background: iAmReady
                  ? "rgba(74,222,128,0.15)"
                  : "linear-gradient(135deg,#6366f1,#4f46e5)",
                boxShadow: iAmReady
                  ? "0 0 0 1px rgba(74,222,128,0.4)"
                  : "0 12px 40px rgba(99,102,241,0.35)",
                color: "#fff",
              }}
            >
              {iAmReady
                ? "✓ READY — Waiting for Host to start..."
                : "⚔ I'M READY"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
