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
  Loader2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import Editor from "@monaco-editor/react";

const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  "C++": 54,
  Java: 62,
  Python3: 71,
  Python: 71,
  C: 50,
  "C#": 51,
  JavaScript: 63,
  TypeScript: 74,
  PHP: 68,
  Swift: 83,
  Kotlin: 78,
  Dart: 28,
  Go: 60,
  Ruby: 72,
  Scala: 81,
  Rust: 73,
};

export default function CustomArenaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const roomCode = params.roomCode as string;

  const [phase, setPhase] = useState<"waiting" | "countdown" | "dueling">(
    "waiting",
  );
  const [iAmReady, setIAmReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Go");
  const [isOpponentConnected, setIsOpponentConnected] = useState(false);
  const [opponentName, setOpponentName] = useState("Opponent");

  const [timeLeft, setTimeLeft] = useState(2700);
  const [problem, setProblem] = useState<any>(null);
  const [isLoadingProblem, setIsLoadingProblem] = useState(true);

  const [activeTab, setActiveTab] = useState<"console" | "tests">("console");
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState("");

  const [showLeaveModal, setShowLeaveModal] = useState(false);

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (phase !== "dueling" || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, phase]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiUrl}problems/random`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.examples === "string") {
            try {
              data.examples = JSON.parse(data.examples);
            } catch (e) {
              data.examples = [];
            }
          }
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
    if (!problem) return;

    if (problem.snippets && problem.snippets[language]) {
      setCode(problem.snippets[language]);
      return;
    }

    const funcNameRaw = problem.title
      ? problem.title.replace(/[^a-zA-Z0-9]/g, "")
      : "solution";
    const funcName = funcNameRaw.charAt(0).toLowerCase() + funcNameRaw.slice(1);
    const PascalFuncName =
      funcNameRaw.charAt(0).toUpperCase() + funcNameRaw.slice(1);

    switch (language) {
      case "C++":
        setCode(
          `class Solution {\npublic:\n    void ${funcName}() {\n        \n    }\n};`,
        );
        break;
      case "Java":
        setCode(
          `class Solution {\n    public void ${funcName}() {\n        \n    }\n}`,
        );
        break;
      case "Python":
      case "Python3":
        setCode(`class Solution:\n    def ${funcName}(self):\n        pass`);
        break;
      case "C":
        setCode(`void ${funcName}() {\n    \n}`);
        break;
      case "C#":
        setCode(
          `public class Solution {\n    public void ${PascalFuncName}() {\n        \n    }\n}`,
        );
        break;
      case "JavaScript":
        setCode(`var ${funcName} = function() {\n    \n};`);
        break;
      case "TypeScript":
        setCode(`function ${funcName}(): void {\n    \n};`);
        break;
      case "PHP":
        setCode(
          `class Solution {\n    function ${funcName}() {\n        \n    }\n}`,
        );
        break;
      case "Swift":
        setCode(
          `class Solution {\n    func ${funcName}() {\n        \n    }\n}`,
        );
        break;
      case "Kotlin":
        setCode(
          `class Solution {\n    fun ${funcName}() {\n        \n    }\n}`,
        );
        break;
      case "Dart":
        setCode(`class Solution {\n  void ${funcName}() {\n    \n  }\n}`);
        break;
      case "Go":
        setCode(`func ${funcName}() {\n    \n}`);
        break;
      case "Ruby":
        setCode(`def ${funcName}()\n    \nend`);
        break;
      case "Scala":
        setCode(
          `object Solution {\n    def ${funcName}(): Unit = {\n        \n    }\n}`,
        );
        break;
      case "Rust":
        setCode(
          `impl Solution {\n    pub fn ${funcName}() {\n        \n    }\n}`,
        );
        break;
      default:
        setCode("");
    }
  }, [language, problem]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/";

    if (!baseUrl.endsWith("/")) {
      baseUrl += "/";
    }

    let wsBase = baseUrl;
    if (wsBase.startsWith("https://")) {
      wsBase = wsBase.replace("https://", "wss://");
    } else if (wsBase.startsWith("http://")) {
      wsBase = wsBase.replace("http://", "ws://");
    }

    const wsParams = `user_id=${user.id}&user_name=${encodeURIComponent(
      user.username || user.firstName || "User",
    )}&image_url=${encodeURIComponent(user.imageUrl)}&team_id=none`;

    const wsUrl = `${wsBase}lobby/${roomCode}/ws?${wsParams}`;

    console.log("Connecting to custom lobby WS:", wsUrl);

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log("Connected to Custom Lobby WS");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received Lobby WS Event:", data);

      switch (data.event) {
        case "LOBBY_UPDATE":
          if (data.players && Array.isArray(data.players)) {
            const opponent = data.players.find(
              (p: any) => p.user_id !== user.id,
            );
            if (opponent) {
              setIsOpponentConnected(true);
              setOpponentName(opponent.user_name || "Opponent");
              setOpponentReady(opponent.is_ready);
            } else {
              setIsOpponentConnected(false);
              setOpponentName("Opponent");
              setOpponentReady(false);
            }
          }
          break;

        case "MATCH_START":
          startCountdown();
          break;
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [isLoaded, user, roomCode]);

  const startCountdown = () => {
    setPhase("countdown");
    let c = 3;
    setCountdown(c);
    const iv = setInterval(() => {
      c--;
      setCountdown(c);
      if (c === 0) {
        clearInterval(iv);
        setPhase("dueling");
      }
    }, 1000);
  };

  const handleReady = () => {
    if (iAmReady || !problem) return;
    setIAmReady(true);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          event: "PLAYER_READY",
        }),
      );
    }
  };

  const handleExecuteCode = async (actionType: "run" | "submit") => {
    if (actionType === "run") setIsRunning(true);
    else setIsSubmitting(true);

    setActiveTab("console");
    setConsoleOutput(`Compiling and executing code...\n`);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/";

      const payload = {
        action: actionType,
        room_code: roomCode,
        problem_slug:
          problem?.slug ||
          problem?.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
          "",
        language_id: JUDGE0_LANGUAGE_IDS[language] || 60,
        code: code,
      };

      const res = await fetch(`${apiUrl}submit-judge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        let out = `Status: ${data.status || "Completed"}\n`;
        out += `Verdict: ${data.verdict || "N/A"}\n\n`;

        if (data.message) out += `Message: ${data.message}\n\n`;

        if (data.status === "Failed") {
          out += `Failed on Case: ${data.failed_case_index || "N/A"}\n`;
          if (data.input) out += `Input: ${data.input}\n`;
          if (data.expected_output)
            out += `Expected: ${data.expected_output}\n`;
          if (data.actual_output) out += `Actual: ${data.actual_output}\n`;
          if (data.error) out += `\nError Logs:\n${data.error}\n`;
        } else {
          if (data.summary) {
            out += `Summary:\n${JSON.stringify(data.summary, null, 2)}\n`;
          }
        }
        setConsoleOutput(out);
      } else {
        setConsoleOutput(
          `Error: Execution failed (Status ${res.status}).\n${data?.error || ""}`,
        );
      }
    } catch (error) {
      setConsoleOutput("Error: Failed to connect to the execution engine.");
    } finally {
      if (actionType === "run") setIsRunning(false);
      else setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleLeaveLobby = () => {
    setShowLeaveModal(true);
  };

  const confirmLeave = () => {
    router.push("/");
  };

  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case "C++":
      case "C":
        return "cpp";
      case "C#":
        return "csharp";
      case "Python3":
      case "Python":
        return "python";
      case "JavaScript":
        return "javascript";
      case "TypeScript":
        return "typescript";
      case "Java":
        return "java";
      case "PHP":
        return "php";
      case "Swift":
        return "swift";
      case "Kotlin":
        return "kotlin";
      case "Dart":
        return "dart";
      case "Go":
        return "go";
      case "Ruby":
        return "ruby";
      case "Scala":
        return "scala";
      case "Rust":
        return "rust";
      default:
        return "plaintext";
    }
  };

  if (!isLoaded)
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-white font-mono">
        Loading Arena...
      </div>
    );

  if (phase === "waiting") {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center font-mono selection:bg-indigo-500/30 relative">
        <div className="absolute top-8 left-8">
          <button
            onClick={handleLeaveLobby}
            className="text-zinc-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors font-bold"
          >
            <ArrowLeft size={14} /> Leave Lobby
          </button>
        </div>

        <h1 className="text-3xl text-white font-black uppercase tracking-widest mb-16">
          Lobby <span className="text-indigo-500">{roomCode}</span>
        </h1>

        <div className="flex gap-16 mb-16">
          <div className="text-center flex flex-col items-center">
            <p className="text-zinc-500 mb-4 tracking-widest text-xs font-bold uppercase">
              You
            </p>
            <div
              className={`w-48 py-6 border rounded-xl font-bold tracking-widest uppercase transition-all ${iAmReady ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "border-white/10 text-zinc-500 bg-white/5"}`}
            >
              {iAmReady ? "Ready" : "Waiting"}
            </div>
          </div>

          <div className="text-center flex flex-col items-center">
            <p className="text-zinc-500 mb-4 tracking-widest text-xs font-bold uppercase">
              {opponentName}
            </p>
            <div
              className={`w-48 py-6 border rounded-xl font-bold tracking-widest uppercase transition-all ${opponentReady ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : "border-white/10 text-zinc-500 bg-white/5"}`}
            >
              {opponentReady ? "Ready" : "Waiting"}
            </div>
          </div>
        </div>

        <button
          onClick={handleReady}
          disabled={iAmReady || !problem}
          className="px-14 py-4 rounded-xl text-xs text-white font-bold uppercase tracking-widest cursor-pointer transition-all disabled:opacity-50"
          style={{
            background: iAmReady
              ? "rgba(74,222,128,0.1)"
              : "linear-gradient(135deg,#6366f1,#4f46e5)",
            border: iAmReady ? "1px solid rgba(74,222,128,0.3)" : "none",
            color: iAmReady ? "#4ade80" : "white",
            boxShadow: iAmReady ? "none" : "0 8px 25px rgba(99,102,241,0.3)",
          }}
        >
          {!problem
            ? "Loading Problem..."
            : iAmReady
              ? "Waiting for Opponent..."
              : "Lock In & Ready"}
        </button>

        {showLeaveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative text-center">
              <div className="p-6 space-y-4">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                  EXIT
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Are you sure you want to leave this lobby?
                </p>
              </div>
              <div className="flex border-t border-white/5 bg-black/20">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLeave}
                  className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500/20 transition-colors border-l border-white/5 cursor-pointer"
                >
                  Confirm Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center font-mono selection:bg-indigo-500/30">
        <style>{`@keyframes countPop{0%{transform:scale(0.8);opacity:0}50%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
        <div className="text-center">
          <p className="text-xs tracking-[0.3em] text-zinc-500 uppercase mb-8 font-bold">
            Match begins in
          </p>
          <div
            key={countdown}
            className="text-[10rem] font-black leading-none"
            style={{
              color:
                countdown === 1
                  ? "#f87171"
                  : countdown === 2
                    ? "#fbbf24"
                    : "#4ade80",
              textShadow: `0 0 80px ${countdown === 1 ? "rgba(248,113,113,0.5)" : countdown === 2 ? "rgba(251,191,36,0.5)" : "rgba(74,222,128,0.5)"}`,
              animation: "countPop 0.5s ease-out forwards",
            }}
          >
            {countdown === 0 ? "GO" : countdown}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-hidden bg-[#050505] text-zinc-300 font-mono flex flex-col selection:bg-indigo-500/30 relative">
      <header className="h-14 border-b border-white/5 bg-[#0a0a0f] flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
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
                ? `${opponentName} Connected`
                : "Opponent Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border ${timeLeft < 300 ? "text-red-400 bg-red-400/5 border-red-400/20 animate-pulse" : "text-amber-400 bg-amber-400/5 border-amber-400/20"}`}
          >
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
                dangerouslySetInnerHTML={{
                  __html:
                    problem.description ||
                    problem.content ||
                    problem.question ||
                    "<p></p>",
                }}
              />

              {Array.isArray(problem.examples) &&
                problem.examples.length > 0 && (
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
                              {ex.explanation}
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
              Failed to load problem.
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col bg-[#050505] overflow-hidden">
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#0a0a0f] shrink-0">
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black/50 border border-white/10 text-zinc-300 text-xs rounded px-3 py-1.5 outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                <option value="C++">C++</option>
                <option value="Java">Java</option>
                <option value="Python">Python</option>
                <option value="Python3">Python3</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="JavaScript">JavaScript</option>
                <option value="TypeScript">TypeScript</option>
                <option value="PHP">PHP</option>
                <option value="Swift">Swift</option>
                <option value="Kotlin">Kotlin</option>
                <option value="Dart">Dart</option>
                <option value="Go">Go</option>
                <option value="Ruby">Ruby</option>
                <option value="Scala">Scala</option>
                <option value="Rust">Rust</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleExecuteCode("run")}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-1.5 rounded transition-all cursor-pointer disabled:opacity-50"
              >
                {isRunning ? (
                  <Loader2
                    size={12}
                    className="animate-spin text-emerald-400"
                  />
                ) : (
                  <Play size={12} className="text-emerald-400" />
                )}
                {isRunning ? "Running" : "Run"}
              </button>
              <button
                onClick={() => handleExecuteCode("submit")}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white px-4 py-1.5 rounded transition-all cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={12} className="animate-spin text-white" />
                ) : (
                  <Send size={12} />
                )}
                {isSubmitting ? "Submitting" : "Submit"}
              </button>
            </div>
          </div>

          <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                padding: { top: 24, bottom: 24 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "all",
              }}
            />
            {isOpponentConnected && (
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 flex items-center gap-3 max-w-xs shadow-2xl transition-all z-50">
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
              <button
                onClick={() => setActiveTab("console")}
                className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer border-b-2 h-full ${activeTab === "console" ? "text-emerald-400 border-emerald-400" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
              >
                <Terminal size={12} /> Console
              </button>
              <button
                onClick={() => setActiveTab("tests")}
                className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-colors cursor-pointer border-b-2 h-full ${activeTab === "tests" ? "text-emerald-400 border-emerald-400" : "text-zinc-500 border-transparent hover:text-zinc-300"}`}
              >
                <CheckCircle2 size={12} /> Test Results
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] whitespace-pre-wrap">
              {activeTab === "console" ? (
                <span
                  className={
                    consoleOutput.includes("Error") ||
                    consoleOutput.includes("Failed")
                      ? "text-red-400"
                      : "text-zinc-400"
                  }
                >
                  {consoleOutput}
                </span>
              ) : (
                <span className="text-zinc-500">
                  Submit your code to see detailed test cases results here.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm font-mono p-4">
          <div
            className="w-full max-w-sm bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative"
            style={{ animation: "modalIn 0.2s ease-out" }}
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h2 className="text-lg font-bold text-white uppercase tracking-widest">
                EXIT
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Are you sure you want to leave this lobby? If the match is
                ongoing, your progress will be lost.
              </p>
            </div>
            <div className="flex border-t border-white/5 bg-black/20">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-white hover:bg-red-500/20 transition-colors border-l border-white/5 cursor-pointer"
              >
                Confirm Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        @keyframes modalIn { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
