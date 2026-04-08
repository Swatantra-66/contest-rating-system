"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Play,
  Send,
  LogOut,
  Terminal,
  CheckCircle2,
  Users,
  Clock,
  Settings,
} from "lucide-react";

export default function CustomArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const roomCode = params.roomCode as string;

  const [code, setCode] = useState("// Write your code here\n");
  const [language, setLanguage] = useState("Go");
  const [isOpponentConnected, setIsOpponentConnected] = useState(false);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [timeLeft] = useState(2700);

  const [problem, setProblem] = useState<any>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}problems/random`,
        );
        if (res.ok) {
          const data = await res.json();
          setProblem(data);
        }
      } catch (err) {
        console.error("Failed to fetch problem", err);
      } finally {
        setIsLoadingProblem(false);
      }
    };
    fetchProblem();
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/";
    const wsUrl =
      baseUrl.replace(/^http/, "ws") +
      `ws?user_id=${user.id}&user_name=${encodeURIComponent(user.username || user.firstName || "User")}&image_url=${encodeURIComponent(user.imageUrl)}&tier=Bronze`;

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log("WebSocket Connected!");
      socket.send(
        JSON.stringify({
          type: "lobby_join",
          payload: {
            room_code: roomCode,
            user_id: user.id,
            user_name: user.username || user.firstName || "User",
            image_url: user.imageUrl,
          },
        }),
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received WS Message:", data);

      switch (data.type) {
        case "lobby_opponent_joined":
          setIsOpponentConnected(true);
          setOpponentName(data.payload.user_name);
          break;
        case "lobby_opponent_left":
          setIsOpponentConnected(false);
          setOpponentName("Opponent");
          break;
      }
    };

    socket.onclose = () => {
      console.log("WebSocket Disconnected");
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "lobby_leave",
            payload: { room_code: roomCode, user_id: user.id },
          }),
        );
      }
      socket.close();
    };
  }, [isLoaded, user, roomCode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLeaveLobby = () => {
    if (confirm("Are you sure you want to leave this duel?")) {
      router.push("/");
    }
  };

  if (!isLoaded)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">
        Loading Arena...
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono flex flex-col selection:bg-indigo-500/30">
      <header className="h-14 border-b border-white/5 bg-[#0a0a0f] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <h1 className="text-white font-bold tracking-widest uppercase text-xs">
              Lobby: <span className="text-indigo-400">{roomCode}</span>
            </h1>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <Users
              size={14}
              className={
                isOpponentConnected ? "text-emerald-400" : "text-zinc-500"
              }
            />
            <span
              className={`text-[10px] uppercase tracking-widest font-bold ${isOpponentConnected ? "text-zinc-300" : "text-zinc-500"}`}
            >
              {isOpponentConnected
                ? `${opponentName} Ready`
                : "Waiting for Opponent..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-amber-400 bg-amber-400/5 border border-amber-400/20 px-3 py-1 rounded-md">
            <Clock size={14} />
            <span className="text-xs font-bold tracking-widest">
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={handleLeaveLobby}
            className="text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest cursor-pointer"
          >
            <LogOut size={14} /> Leave
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-white/5 bg-[#0a0a0f] flex flex-col overflow-y-auto custom-scrollbar">
          {isLoadingProblem ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm animate-pulse">
              Loading Problem Data...
            </div>
          ) : problem ? (
            <div className="p-8 max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 rounded">
                  {problem.difficulty || "Medium"}
                </span>
                {problem.tags && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {problem.tags.join(", ")}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-6">
                {problem.title}
              </h2>

              <div
                className="prose prose-invert prose-sm text-zinc-400 leading-relaxed mb-8"
                dangerouslySetInnerHTML={{ __html: problem.description }}
              />

              {problem.examples && problem.examples.length > 0 && (
                <div className="space-y-6">
                  {problem.examples.map((ex: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3">
                        Example {idx + 1}
                      </h3>
                      <div className="bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-sm space-y-2">
                        <div>
                          <span className="text-zinc-500">Input:</span>{" "}
                          <span className="text-emerald-300">{ex.input}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500">Output:</span>{" "}
                          <span className="text-indigo-300">{ex.output}</span>
                        </div>
                        {ex.explanation && (
                          <div className="text-zinc-500 text-xs mt-2">
                            {"// " + ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-red-400 text-sm">
              Failed to load problem. Please check connection.
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col bg-[#050505]">
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#0a0a0f] shrink-0">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black/50 border border-white/10 text-zinc-300 text-xs rounded px-3 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="Go">Go (1.22)</option>
                <option value="C++">C++ (GCC 11)</option>
                <option value="Python">Python (3.10)</option>
                <option value="JavaScript">JavaScript (Node)</option>
              </select>
              <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
                <Settings size={14} />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-1.5 rounded transition-all cursor-pointer">
                <Play size={12} className="text-emerald-400" /> Run
              </button>
              <button
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white px-4 py-1.5 rounded transition-all cursor-pointer"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                }}
              >
                <Send size={12} /> Submit
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck="false"
              className="w-full h-full bg-transparent text-zinc-300 p-6 font-mono text-[13px] leading-relaxed resize-none outline-none focus:ring-0 custom-scrollbar"
            />

            {isOpponentConnected && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center gap-3 max-w-xs shadow-2xl transition-all">
                <div className="relative">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponentName}`}
                    alt="Opponent"
                    className="w-8 h-8 rounded-full border border-indigo-500/50 bg-zinc-900"
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                    {opponentName}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500">
                    Connected
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="h-48 border-t border-white/5 bg-[#0a0a0f] flex flex-col shrink-0">
            <div className="h-8 border-b border-white/5 flex items-center px-4 gap-4">
              <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer border-b-2 border-transparent hover:border-zinc-500 h-full">
                <Terminal size={12} /> Console
              </button>
              <button className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-emerald-400 border-b-2 border-emerald-400 h-full">
                <CheckCircle2 size={12} /> Test Results
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto text-xs text-zinc-500">
              Run your code to see outputs here.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
