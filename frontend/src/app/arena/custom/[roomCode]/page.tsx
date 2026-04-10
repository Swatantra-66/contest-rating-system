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
  Loader2,
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

  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

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

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/";
    let wsBase = baseUrl;

    if (wsBase.startsWith("https://")) {
      wsBase = wsBase.replace("https://", "wss://");
    } else if (wsBase.startsWith("http://")) {
      wsBase = wsBase.replace("http://", "ws://");
    }

    const wsParams = `user_id=${user.id}&user_name=${encodeURIComponent(
      user.username || user.firstName || "User",
    )}&image_url=${encodeURIComponent(user.imageUrl)}&tier=Bronze`;

    const wsUrl = `${wsBase}ws?${wsParams}`;

    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
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
    if (confirm("Are you sure you want to leave this duel?")) {
      router.push("/");
    }
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

        <div className="w-1/2 flex flex-col bg-[#050505]">
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
              <button className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1">
                <Settings size={14} />
              </button>
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

          <div className="flex-1 relative bg-[#1e1e1e]">
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

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
}
