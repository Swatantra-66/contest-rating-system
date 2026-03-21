"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  Search,
  Swords,
  Loader2,
  ArrowLeft,
  Target,
  ShieldAlert,
  Zap,
  Trophy,
  Star,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Orbitron } from "next/font/google";
import Link from "next/link";
import { useGlobalWS } from "@/components/WebSocketProvider";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });
const API = process.env.NEXT_PUBLIC_API_URL || "";

interface NodeUser {
  id: string;
  name: string;
  image_url?: string;
  current_rating: number;
  contests_played: number;
  tier: string;
}

const TIER_CONFIG: Record<string, { color: string; glow: string; bg: string }> =
  {
    newbie: {
      color: "#71717a",
      glow: "rgba(113,113,122,0.2)",
      bg: "rgba(113,113,122,0.08)",
    },
    apprentice: {
      color: "#34d399",
      glow: "rgba(52,211,153,0.2)",
      bg: "rgba(52,211,153,0.08)",
    },
    specialist: {
      color: "#22d3ee",
      glow: "rgba(34,211,238,0.2)",
      bg: "rgba(34,211,238,0.08)",
    },
    expert: {
      color: "#818cf8",
      glow: "rgba(129,140,248,0.25)",
      bg: "rgba(129,140,248,0.08)",
    },
    master: {
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.25)",
      bg: "rgba(251,191,36,0.08)",
    },
    grandmaster: {
      color: "#f87171",
      glow: "rgba(248,113,113,0.35)",
      bg: "rgba(248,113,113,0.08)",
    },
  };
const getTier = (tier: string) =>
  TIER_CONFIG[tier.toLowerCase()] || TIER_CONFIG["newbie"];

const DIFF_COLORS: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#fbbf24",
  Hard: "#f87171",
};

function RatingBar({ rating }: { rating: number }) {
  const pct = Math.min(100, (rating / 1800) * 100);
  const color =
    rating >= 1800
      ? "#f87171"
      : rating >= 1400
        ? "#fbbf24"
        : rating >= 1200
          ? "#818cf8"
          : rating >= 1100
            ? "#22d3ee"
            : "#71717a";
  return (
    <div
      style={{
        height: 2,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 1,
        marginTop: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 1,
          transition: "width 0.8s ease",
        }}
      />
    </div>
  );
}

export default function ArenaPage() {
  const { isLoaded, user } = useUser();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<NodeUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [myNodeId, setMyNodeId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(
    "Easy",
  );
  const [mode, setMode] = useState<"same" | "random">("same");

  const {
    send,
    connected,
    onlineUsers,
    challenging,
    setChallenging,
    waitingFor,
    setWaitingFor,
  } = useGlobalWS();

  useEffect(() => {
    const uid = localStorage.getItem("elonode_db_id");
    setMyNodeId(uid);
    fetch(`${API}users`)
      .then((r) => r.json())
      .then((data) =>
        setAllUsers(
          data.sort(
            (a: NodeUser, b: NodeUser) => b.current_rating - a.current_rating,
          ),
        ),
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChallenge = async (opponent: NodeUser) => {
    const isOnline = onlineUsers.some((u) => u.user_id === opponent.id);
    if (!isOnline) {
      alert(`${opponent.name} is currently offline.`);
      return;
    }
    setChallenging(opponent.id);
    try {
      const myNode = allUsers.find((u) => u.id === myNodeId);
      const myName = myNode?.name || user?.username || "Unknown";
      const res = await fetch(`${API}contests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `1v1: ${myName} vs ${opponent.name}`,
          total_participants: 2,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const contestId = data.id || data.ID;
      const timerSecs =
        difficulty === "Hard"
          ? 45 * 60
          : difficulty === "Medium"
            ? 25 * 60
            : 15 * 60;
      const configRes = await fetch(`${API}contests/${contestId}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty,
          mode,
          timer_secs: timerSecs,
        }),
      });
      if (!configRes.ok) {
        throw new Error("failed to lock contest config");
      }

      send("challenge", {
        to_id: opponent.id,
        contest_id: contestId,
        difficulty,
        mode,
        timer_secs: timerSecs,
      });
      setWaitingFor(contestId);
    } catch {
      alert("Failed to create challenge.");
      setChallenging(null);
    }
  };

  const onlineIds = new Set(onlineUsers.map((u) => u.user_id));
  const opponents = allUsers
    .filter(
      (u) =>
        u.id !== myNodeId &&
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const aOnline = onlineIds.has(a.id) ? 1 : 0;
      const bOnline = onlineIds.has(b.id) ? 1 : 0;
      return bOnline - aOnline || b.current_rating - a.current_rating;
    });

  if (!isLoaded || loading)
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center gap-4 relative"
        style={{ fontFamily: "ui-monospace,monospace" }}
      >
        <Loader2
          style={{
            width: 28,
            height: 28,
            color: "#6366f1",
            animation: "spin 1s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.3em",
            color: "#818cf8",
            textTransform: "uppercase",
          }}
        >
          Scanning grid...
        </span>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  return (
    <div
      className="min-h-screen relative w-full flex justify-center items-start pt-8 pb-24 px-6"
      style={{
        fontFamily: "ui-monospace,monospace",
        color: "#e4e4e7",
      }}
    >
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cardIn{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .node-card{transition:all 0.25s ease}
        .challenge-btn{transition:all 0.2s ease}
      `}</style>

      {waitingFor && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            background: "#0f1015",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 12,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          }}
        >
          <Loader2
            size={14}
            style={{ color: "#6366f1", animation: "spin 1s linear infinite" }}
          />
          <span
            style={{
              fontSize: 10,
              color: "#818cf8",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Waiting for opponent to accept...
          </span>
          <button
            onClick={() => {
              setWaitingFor(null);
              setChallenging(null);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#52525b",
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {(() => {
        const raw =
          typeof window !== "undefined"
            ? localStorage.getItem("elonode_active_contest")
            : null;
        if (!raw) return null;
        try {
          const data = JSON.parse(raw);
          if (Date.now() - data.timestamp > 10 * 60 * 1000) {
            localStorage.removeItem("elonode_active_contest");
            return null;
          }
          const opponentDisplay =
            data.opponent?.length > 20
              ? data.opponent.slice(0, 8) + "..."
              : data.opponent;
          return (
            <div
              style={{
                position: "fixed",
                top: 16,
                right: 24,
                zIndex: 999,
                background: "#0f1015",
                border: "1px solid rgba(245,158,11,0.4)",
                borderRadius: 12,
                padding: "12px 20px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#f59e0b",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                ⚡ Active Duel vs {opponentDisplay}
              </span>
              <button
                onClick={() => router.push(data.url)}
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  border: "none",
                  cursor: "pointer",
                  color: "#000",
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Rejoin →
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("elonode_active_contest");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#52525b",
                  padding: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      <div
        style={{
          maxWidth: 1240,
          width: "100%",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ marginBottom: -8 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "#52525b",
              textDecoration: "none",
              fontSize: 10,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#818cf8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#52525b")}
          >
            <ArrowLeft size={12} /> Return to Hub
          </Link>
        </div>

        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(9,12,24,0.84) 0%, rgba(5,7,16,0.82) 100%)",
            border: "1px solid rgba(99,102,241,0.22)",
            borderRadius: 24,
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            overflow: "hidden",
            boxShadow:
              "0 20px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              padding: "24px 28px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(99,102,241,0.15)",
                      border: "1px solid rgba(99,102,241,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Swords size={18} style={{ color: "#818cf8" }} />
                  </div>
                  <h1
                    className={orbitron.className}
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: "#fff",
                      textTransform: "uppercase",
                      margin: 0,
                    }}
                  >
                    MATCH<span style={{ color: "#3f3f46" }}>MAKING</span>
                  </h1>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "3px 10px",
                      borderRadius: 20,
                      background: connected
                        ? "rgba(74,222,128,0.08)"
                        : "rgba(248,113,113,0.08)",
                      border: `1px solid ${connected ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
                    }}
                  >
                    {connected ? (
                      <Wifi size={10} style={{ color: "#4ade80" }} />
                    ) : (
                      <WifiOff size={10} style={{ color: "#f87171" }} />
                    )}
                    <span
                      style={{
                        fontSize: 8,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: connected ? "#4ade80" : "#f87171",
                      }}
                    >
                      {connected ? "Live" : "Offline"}
                    </span>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 10.5,
                    color: "#71717a",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    marginLeft: 48,
                  }}
                >
                  Clean 1v1 duels with synced rules and real-time accept flow
                </p>
              </div>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#52525b",
                  }}
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Target specific node..."
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(99,102,241,0.22)",
                    borderRadius: 10,
                    padding: "11px 14px 11px 36px",
                    color: "#e4e4e7",
                    fontFamily: "ui-monospace,monospace",
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    width: 300,
                    outline: "none",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(129,140,248,0.55)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.18)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.22)";
                    e.currentTarget.style.boxShadow =
                      "inset 0 1px 0 rgba(255,255,255,0.03)";
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "14px 28px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 4px",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "#52525b",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Difficulty:
              </span>
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    border: `1px solid ${difficulty === d ? DIFF_COLORS[d] + "60" : "rgba(255,255,255,0.07)"}`,
                    background:
                      difficulty === d ? DIFF_COLORS[d] + "15" : "transparent",
                    color: difficulty === d ? DIFF_COLORS[d] : "#52525b",
                    fontFamily: "ui-monospace,monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
            <div
              style={{
                width: 1,
                background: "rgba(255,255,255,0.05)",
                margin: "0 4px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 4px",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "#52525b",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Problem:
              </span>
              {(["same", "random"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 8,
                    border: `1px solid ${mode === m ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
                    background:
                      mode === m ? "rgba(99,102,241,0.15)" : "transparent",
                    color: mode === m ? "#818cf8" : "#52525b",
                    fontFamily: "ui-monospace,monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "same" ? "⚔ Same" : "🎲 Random"}
                </button>
              ))}
              <Link
                href="/team-contests/new"
                style={{
                  marginLeft: 8,
                  padding: "5px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(251,191,36,0.5)",
                  background: "rgba(251,191,36,0.12)",
                  color: "#fbbf24",
                  fontFamily: "ui-monospace,monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                3v3 ICPC
              </Link>
            </div>
          </div>

          <div
            style={{
              padding: "12px 28px 14px",
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                icon: <Target size={12} />,
                label: "Online Now",
                value: onlineUsers.length,
                color: "#4ade80",
              },
              {
                icon: <Trophy size={12} />,
                label: "Total Nodes",
                value: allUsers.length,
                color: "#fbbf24",
              },
              {
                icon: <Star size={12} />,
                label: "Top Rating",
                value: allUsers[0]?.current_rating || 0,
                color: "#818cf8",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  fontSize: 10,
                }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <span
                  style={{
                    color: "#3f3f46",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}:
                </span>
                <span style={{ color: "#e4e4e7", fontWeight: 700 }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: "100%" }}>
          {opponents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                borderRadius: 24,
                border: "1px dashed rgba(255,255,255,0.08)",
              }}
            >
              <ShieldAlert size={32} style={{ color: "#27272a" }} />
              <p
                style={{
                  fontSize: 11,
                  color: "#52525b",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                No active nodes found on this sector
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 24,
                justifyItems: "center",
              }}
            >
              {opponents.map((opponent, i) => {
                const tier = getTier(opponent.tier);
                const isOnline = onlineIds.has(opponent.id);
                const isChallenging = challenging === opponent.id;

                return (
                  <div
                    key={opponent.id}
                    className="node-card"
                    style={{
                      background: "#09090b",
                      backgroundImage:
                        "linear-gradient(180deg, #18181b 0%, #09090b 100%)",
                      border: `1px solid ${isOnline ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 16,
                      width: "100%",
                      maxWidth: 300,
                      display: "flex",
                      flexDirection: "column",
                      animation: `cardIn 0.4s ease-out ${i * 0.06}s both`,
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: isOnline
                        ? "0 8px 30px rgba(74,222,128,0.05)"
                        : "0 8px 30px rgba(0,0,0,0.5)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        isOnline ? "rgba(74,222,128,0.5)" : `${tier.color}60`;
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(-6px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        `0 20px 40px ${tier.glow}`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor =
                        isOnline
                          ? "rgba(74,222,128,0.25)"
                          : "rgba(255,255,255,0.08)";
                      (e.currentTarget as HTMLDivElement).style.transform =
                        "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow =
                        isOnline
                          ? "0 8px 30px rgba(74,222,128,0.05)"
                          : "0 8px 30px rgba(0,0,0,0.5)";
                    }}
                  >
                    <div
                      style={{
                        height: 160,
                        width: "100%",
                        position: "relative",
                        background: tier.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderBottom: `1px solid ${tier.color}30`,
                      }}
                    >
                      {opponent.image_url ? (
                        <Image
                          src={opponent.image_url}
                          alt={opponent.name}
                          fill
                          unoptimized
                          style={{
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: 54,
                            fontWeight: 900,
                            color: tier.color,
                            opacity: 0.8,
                          }}
                        >
                          {opponent.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to bottom, transparent 50%, #18181b 100%)",
                        }}
                      />

                      {isOnline && (
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "rgba(0,0,0,0.6)",
                            backdropFilter: "blur(4px)",
                            border: "1px solid rgba(74,222,128,0.3)",
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: "#4ade80",
                              animation: "pulse 2s ease infinite",
                            }}
                          />
                          <span
                            style={{
                              fontSize: 9,
                              color: "#4ade80",
                              letterSpacing: "0.15em",
                              textTransform: "uppercase",
                              fontWeight: 700,
                            }}
                          >
                            Online
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          position: "absolute",
                          bottom: 12,
                          left: 16,
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "rgba(0,0,0,0.7)",
                          backdropFilter: "blur(8px)",
                          border: `1px solid ${tier.color}50`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 900,
                            letterSpacing: "0.15em",
                            color: tier.color,
                            textTransform: "uppercase",
                          }}
                        >
                          {opponent.tier}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "20px 20px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-end",
                        }}
                      >
                        <div style={{ maxWidth: "60%" }}>
                          <h3
                            style={{
                              fontSize: 16,
                              fontWeight: 900,
                              letterSpacing: "0.05em",
                              color: "#fff",
                              textTransform: "uppercase",
                              margin: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {opponent.name}
                          </h3>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#71717a",
                              letterSpacing: "0.1em",
                              marginTop: 4,
                            }}
                          >
                            {opponent.contests_played} MATCHES
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            className={orbitron.className}
                            style={{
                              fontSize: 28,
                              fontWeight: 900,
                              color: tier.color,
                              lineHeight: 1,
                              textShadow: `0 0 20px ${tier.glow}`,
                            }}
                          >
                            {opponent.current_rating}
                          </div>
                        </div>
                      </div>

                      <RatingBar rating={opponent.current_rating} />

                      <div style={{ marginTop: "auto", paddingTop: 8 }}>
                        <button
                          className="challenge-btn"
                          onClick={() => handleChallenge(opponent)}
                          disabled={!!challenging || !isOnline}
                          style={{
                            width: "100%",
                            padding: "14px 12px",
                            borderRadius: 10,
                            border: "none",
                            cursor:
                              isOnline && !challenging
                                ? "pointer"
                                : "not-allowed",
                            background: !isOnline
                              ? "rgba(255,255,255,0.04)"
                              : isChallenging
                                ? "rgba(99,102,241,0.3)"
                                : "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))",
                            color: !isOnline
                              ? "#52525b"
                              : isChallenging
                                ? "#818cf8"
                                : "#a5b4fc",
                            fontFamily: "ui-monospace,monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            borderTop: `1px solid ${isOnline ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.02)"}`,
                            opacity: challenging && !isChallenging ? 0.4 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (isOnline && !challenging) {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background =
                                "linear-gradient(135deg,#6366f1,#4f46e5)";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.color = "#fff";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.boxShadow =
                                "0 4px 20px rgba(99,102,241,0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (isOnline && !challenging) {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background =
                                "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1))";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.color = "#a5b4fc";
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.boxShadow = "none";
                            }
                          }}
                        >
                          {isChallenging ? (
                            <>
                              <Loader2
                                size={14}
                                style={{ animation: "spin 1s linear infinite" }}
                              />{" "}
                              Connecting...
                            </>
                          ) : !isOnline ? (
                            "Offline"
                          ) : (
                            <>
                              <Zap size={14} /> Challenge Node
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
