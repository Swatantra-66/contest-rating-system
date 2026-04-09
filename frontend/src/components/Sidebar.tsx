"use client";

import Link from "next/link";
import {
  Menu,
  X,
  Database,
  Zap,
  Trophy,
  Lock,
  Users,
  Copy,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Orbitron } from "next/font/google";
import {
  UserButton,
  SignOutButton,
  SignInButton,
  useAuth,
} from "@clerk/nextjs";
import UnicornScene from "unicornstudio-react";

const futuristicFont = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const { userId, isLoaded } = useAuth();
  const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  const isAdmin = isLoaded && userId === ADMIN_USER_ID;
  const isAuthenticated = isLoaded && !!userId;

  const [stats, setStats] = useState({
    total_nodes: 0,
    active_contests: 0,
    average_elo: 0,
    live_nodes: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  const [showLobbyModal, setShowLobbyModal] = useState(false);
  const [lobbyMode, setLobbyMode] = useState<"create" | "join">("create");
  const [joinCode, setJoinCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}stats`);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            total_nodes: data.total_nodes,
            active_contests: data.active_contests,
            average_elo: data.average_elo,
            live_nodes: data.live_nodes || 0,
          });
        }
        const healthRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}health`,
        );
        setIsOnline(healthRes.ok);
      } catch {
        setIsOnline(false);
      }
    };
    fetchSystemData();
    const interval = setInterval(fetchSystemData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateLobby = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}lobby/create`,
        {
          method: "POST",
        },
      );
      if (res.ok) {
        const data = await res.json();
        setGeneratedCode(data.room_code);
      } else {
        alert("Server returned an error while creating room.");
      }
    } catch (error) {
      console.error("Error creating lobby:", error);
      alert("Failed to connect to backend to create room.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJoinLobby = () => {
    setIsJoining(true);
    if (joinCode.length === 5) {
      setShowLobbyModal(false);
      router.push(`/arena/custom/${joinCode}`);
    }
    setTimeout(() => setIsJoining(false), 2000);
  };

  const navLink = (href: string, label: string, icon?: React.ReactNode) => (
    <Link
      href={href}
      className={`uppercase tracking-widest text-[11px] font-bold transition-all border-l-2 pl-4 py-0.5 flex items-center gap-3 ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "border-emerald-400 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
    >
      <span>{label}</span>
      {icon}
    </Link>
  );

  return (
    <>
      <style>{`
        a[href*="unicorn.studio"]{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;}
        @keyframes modalIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>

      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-900 rounded-md border border-zinc-800 text-zinc-400"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black border-r border-zinc-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 overflow-hidden ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          style={{ width: "150%", height: "150%", top: "-25%", left: "-25%" }}
        >
          <UnicornScene
            projectId="jQFuPrfohqDwL6UqkSt8"
            width="100%"
            height="100%"
            scale={1}
            dpi={1.5}
            sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@2.1.4/dist/unicornStudio.umd.js"
          />
        </div>

        <div className="absolute inset-0 z-10 bg-zinc-950/80 backdrop-blur-[2px]" />

        <div className="relative z-20 flex flex-col h-full p-8 overflow-y-auto">
          <Link
            href="/"
            className="inline-block transition-opacity hover:opacity-75 cursor-pointer"
          >
            <h2
              className={`text-2xl text-white tracking-wider uppercase whitespace-nowrap ${futuristicFont.className}`}
            >
              Elo<span className="text-zinc-600">Node</span>
            </h2>
          </Link>

          <div className="w-full h-[1px] bg-zinc-800/80 mt-6 mb-8" />

          <nav className="flex flex-col gap-8 flex-1">
            <div className="space-y-3">
              <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-[0.3em] mb-4">
                Core Interface
              </p>
              <Link
                href={isAdmin ? "/admin" : "#"}
                className={`uppercase tracking-widest text-[11px] font-bold transition-all border-l-2 pl-4 py-0.5 flex items-center gap-3 ${pathname === "/admin" ? "border-emerald-400 text-white" : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"}`}
              >
                <span>Admin Panel</span>
                {!isAdmin && (
                  <Lock size={12} className="text-zinc-600 mb-0.5" />
                )}
              </Link>
              {navLink("/arena", "Join Contest")}
              {navLink("/leaderboard", "Leaderboard")}
              {navLink("/contests", "Contest Log")}
              {navLink("/history", "Rating History")}

              <Link
                href="/team-contests/new"
                className="relative group/icpc block"
              >
                <div
                  className={`uppercase tracking-widest text-[11px] font-bold transition-all border-l-2 pl-4 py-0.5 flex items-center gap-3 cursor-pointer ${pathname.startsWith("/team-contests") ? "border-emerald-400 text-white" : "border-transparent text-zinc-400 group-hover/icpc:text-zinc-100 hover:border-zinc-700"}`}
                >
                  <span>3v3 ICPC Battle</span>
                  <span className="text-[9px] text-amber-500/90 border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">
                    BETA
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setShowLobbyModal(true)}
                className="w-full text-left uppercase tracking-widest text-[11px] font-bold transition-all border-l-2 pl-4 py-0.5 flex items-center gap-3 cursor-pointer border-transparent text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"
              >
                <span>Custom Lobbies</span>
                <span className="text-[9px] text-amber-500/90 border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 rounded uppercase tracking-widest font-bold">
                  BETA
                </span>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-[0.3em] mb-4">
                System Metrics
              </p>
              <div className="flex flex-col gap-3 pl-4">
                <div className="flex items-center gap-2 group">
                  <Database
                    size={14}
                    className="text-zinc-600 group-hover:text-emerald-400 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                    Total Nodes:
                  </span>
                  <span className="text-xs text-zinc-200 font-mono">
                    {stats.total_nodes}
                  </span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Zap
                    size={14}
                    className={`transition-colors ${stats.live_nodes > 0 ? "text-emerald-400" : "text-zinc-600 group-hover:text-emerald-400"}`}
                  />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                    Live Nodes:
                  </span>
                  <span className="text-xs text-zinc-200 font-mono">
                    {stats.live_nodes}
                  </span>
                </div>
                <div className="flex items-center gap-2 group">
                  <Trophy
                    size={14}
                    className="text-zinc-600 group-hover:text-emerald-400 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">
                    System Avg:
                  </span>
                  <span className="text-xs text-zinc-200 font-mono">
                    {stats.average_elo}
                  </span>
                </div>
              </div>
            </div>
          </nav>

          <div className="mt-auto pt-6">
            <div className="flex items-center gap-3 px-2 mb-4 border-t border-zinc-800/80 pt-6">
              <div className="relative">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                />
                {isOnline && (
                  <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                )}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-zinc-200 uppercase tracking-tighter">
                  {isOnline ? "Engine Healthy" : "Engine Offline"}
                </p>
                <p className="text-[9px] text-zinc-500 font-mono tracking-tighter">
                  {isOnline
                    ? "RENDER :: DB_CONNECTED"
                    : "CONNECTION_ERROR :: 500"}
                </p>
                <p className="text-[9px] text-zinc-600 font-mono tracking-widest mt-0.5 flex items-center gap-1">
                  Sync:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              <div className="border-t border-zinc-800/80 pt-4 px-2 space-y-4">
                <SignOutButton>
                  <button className="flex items-center gap-3 w-full p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all rounded-md group cursor-pointer">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-hover:-translate-x-1 transition-transform"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    <span className="font-bold tracking-widest uppercase text-[10px]">
                      System Logout
                    </span>
                  </button>
                </SignOutButton>

                <div className="flex items-center gap-3 p-2">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox:
                          "w-8 h-8 border border-zinc-700 hover:border-emerald-500 transition-colors",
                        userButtonPopoverCard:
                          "bg-zinc-900 border border-zinc-800 shadow-2xl",
                      },
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                      System Access
                    </span>
                    <span className="text-[10px] text-zinc-200 font-bold tracking-wider uppercase">
                      Authenticated
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-zinc-800/80 pt-4 px-2 space-y-4">
                <SignInButton mode="modal">
                  <button className="flex items-center gap-3 w-full p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all rounded-md group cursor-pointer">
                    <Zap
                      size={16}
                      className="group-hover:scale-110 transition-transform"
                    />
                    <span className="font-bold tracking-widest uppercase text-[10px]">
                      System Login
                    </span>
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLobbyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono p-4">
          <div
            className="w-full max-w-md bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
            style={{ animation: "modalIn 0.2s ease-out" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Users size={16} className="text-indigo-400" /> Custom Lobby
              </h2>
              <button
                onClick={() => {
                  setShowLobbyModal(false);
                  setJoinCode("");
                  setGeneratedCode("");
                  setLobbyMode("create");
                }}
                className="text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-white/5 bg-black/10">
              <button
                onClick={() => setLobbyMode("create")}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                  lobbyMode === "create"
                    ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Create Room
              </button>
              <button
                onClick={() => setLobbyMode("join")}
                className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${
                  lobbyMode === "join"
                    ? "text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Join Room
              </button>
            </div>

            <div className="p-6">
              {lobbyMode === "create" && (
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Generate a unique room code and share it with a friend to
                    invite them to a private 1v1 algorithmic duel.
                  </p>

                  {!generatedCode ? (
                    <button
                      onClick={handleCreateLobby}
                      disabled={isGenerating}
                      className="w-full py-4 rounded-xl text-white font-mono text-[11px] font-bold uppercase tracking-widest border border-indigo-500/30 transition-all hover:bg-indigo-500/10 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-wait"
                    >
                      {isGenerating ? (
                        "Generating..."
                      ) : (
                        <>
                          <Plus size={14} /> Generate Room Code
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-center relative group">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest absolute top-2 left-1/2 -translate-x-1/2">
                          Room Code
                        </span>
                        <p className="text-3xl font-black text-white tracking-[0.2em] mt-3">
                          {generatedCode}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(generatedCode)
                          }
                          className="flex-1 py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest border border-white/10 text-zinc-300 hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Copy size={12} /> Copy
                        </button>
                        <button
                          onClick={() => {
                            setShowLobbyModal(false);
                            router.push(`/arena/custom/${generatedCode}`);
                          }}
                          className="flex-[2] py-3 rounded-xl font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center cursor-pointer"
                          style={{
                            background:
                              "linear-gradient(135deg,#6366f1,#4f46e5)",
                          }}
                        >
                          Enter Lobby →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {lobbyMode === "join" && (
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Enter a 5-character room code shared by your friend to join
                    their private lobby.
                  </p>
                  <div className="space-y-2">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                      Enter Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase().slice(0, 5))
                      }
                      placeholder="E.g. A7X9K"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-xl font-bold tracking-[0.3em] outline-none focus:border-indigo-500/50 transition-colors placeholder:text-zinc-700"
                    />
                  </div>
                  <button
                    onClick={handleJoinLobby}
                    disabled={joinCode.length !== 5 || isJoining}
                    className="w-full py-4 rounded-xl text-white font-mono text-[11px] font-bold uppercase tracking-widest border-0 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    style={{
                      background:
                        joinCode.length === 5
                          ? "linear-gradient(135deg,#6366f1,#4f46e5)"
                          : "#18181b",
                      boxShadow:
                        joinCode.length === 5
                          ? "0 4px 20px rgba(99,102,241,0.25)"
                          : "none",
                    }}
                  >
                    {isJoining ? "Connecting..." : "Join Lobby"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
