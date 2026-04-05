"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_SNIPPETS,
  fetchJudge0Languages,
  getFallbackJudge0LanguageId,
  getLanguageExtension,
  getLanguageLabel,
  getMonacoLanguage,
  isWrapperSupported,
  resolveJudge0LanguageId,
  toWrapperLanguage,
  type Judge0Language,
  DIFF_COLOR,
  type Difficulty,
} from "@/lib/languages";
import { Orbitron } from "next/font/google";
import { ArrowLeft, Zap, RefreshCw, Play } from "lucide-react";
import Editor from "@monaco-editor/react";
import Link from "next/link";
import { wrapCode } from "@/hooks/codeWrapper";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/?$/, "/");
const practiceDraftKey = (lang: string) => `practice_draft_${lang}`;

type TestStatus = "pending" | "running" | "passed" | "failed";
type Phase = "idle" | "running" | "submitting" | "accepted";

interface Problem {
  slug: string;
  title: string;
  difficulty: Difficulty;
  content: string;
  starterCode: string;
  examples: string;
  tags: string[];
  leetcodeUrl: string;
  metaData: string;
}

interface BackendCaseResult {
  case_index: number;
  passed: boolean;
  hidden: boolean;
}

interface BackendJudgeResponse {
  status: string;
  message?: string;
  error?: string;
  details?: string;
  verdict?: string;
  results?: BackendCaseResult[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<pre>/gi, "\n")
    .replace(/<\/pre>/gi, "\n")
    .replace(/<strong>/gi, "")
    .replace(/<\/strong>/gi, "")
    .replace(/<em>/gi, "")
    .replace(/<\/em>/gi, "")
    .replace(/<code>/gi, "`")
    .replace(/<\/code>/gi, "`")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const fmtStopwatch = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function PracticeArena() {
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [fetchingProblem, setFetchingProblem] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [phase, setPhase] = useState<Phase>("idle");

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([
    "cpp",
    "python3",
  ]);
  const [judgeLanguages, setJudgeLanguages] = useState<Judge0Language[]>([]);

  const [tab, setTab] = useState<"problem" | "constraints">("problem");
  const [testResults, setTestResults] = useState<TestStatus[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [stopwatch, setStopwatch] = useState(0);
  const stopwatchRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snippetsRef = useRef<Record<string, string>>({});

  const getStarterCode = useCallback((langSlug: string): string => {
    return snippetsRef.current[langSlug] || DEFAULT_SNIPPETS[langSlug] || "";
  }, []);

  useEffect(() => {
    let active = true;
    fetchJudge0Languages()
      .then((langs) => {
        if (active) setJudgeLanguages(langs);
      })
      .catch(() => {
        if (active) setJudgeLanguages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!fetchingProblem && problem && phase !== "accepted") {
      stopwatchRef.current = setInterval(() => {
        setStopwatch((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [fetchingProblem, problem, phase]);

  const fetchProblem = useCallback(
    async (diff: Difficulty) => {
      setFetchingProblem(true);
      setErrorMsg("");
      setSuccessMsg("");
      setPhase("idle");
      setStopwatch(0);

      try {
        const res = await fetch(
          `${API_BASE}problems/random?difficulty=${diff.toLowerCase()}&mode=random`,
        );
        if (!res.ok) throw new Error("Failed to fetch practice problem");
        const data = await res.json();

        const snippetMap: Record<string, string> = {};
        if (data.code_snippets) {
          data.code_snippets.forEach(
            (s: { lang_slug: string; code: string }) => {
              snippetMap[s.lang_slug] = s.code;
            },
          );
        }

        const fallbackSupported = Object.keys(DEFAULT_SNIPPETS).filter((slug) =>
          isWrapperSupported(toWrapperLanguage(slug)),
        );
        if (!snippetMap["java"] && data.starter_code)
          snippetMap["java"] = data.starter_code;

        fallbackSupported.forEach((slug) => {
          if (!snippetMap[slug]) snippetMap[slug] = DEFAULT_SNIPPETS[slug];
        });

        if (
          snippetMap["python3"] &&
          snippetMap["python3"].includes("class Solution") &&
          snippetMap["python3"].includes("public")
        ) {
          snippetMap["python3"] = DEFAULT_SNIPPETS["python3"];
        }
        snippetsRef.current = snippetMap;

        const preferredLanguageOrder = [
          "java",
          "cpp",
          "python3",
          "javascript",
          "typescript",
          "golang",
          "rust",
        ];
        const languageOptions = preferredLanguageOrder.filter(
          (slug) =>
            !!snippetMap[slug] && isWrapperSupported(toWrapperLanguage(slug)),
        );
        if (languageOptions.length > 0) setAvailableLanguages(languageOptions);

        const p: Problem = {
          slug: data.slug,
          title: data.title,
          difficulty: data.difficulty as Difficulty,
          content: stripHtml(data.content),
          starterCode: data.starter_code,
          examples: data.examples,
          tags: data.tags || [],
          leetcodeUrl: data.leetcode_url,
          metaData: data.meta_data || "",
        };
        setProblem(p);

        const preferredLang = localStorage.getItem("elonode_preferred_lang");
        const initialLang =
          languageOptions.find((slug) => slug === preferredLang) ||
          languageOptions[0] ||
          "java";
        setLanguage(initialLang);

        const savedCode = localStorage.getItem(practiceDraftKey(initialLang));
        if (savedCode) {
          setCode(savedCode);
        } else {
          const starter = getStarterCode(initialLang);
          setCode(starter);
          localStorage.setItem(practiceDraftKey(initialLang), starter);
        }

        const exLines = data.examples
          .split("\n")
          .filter((l: string) => l.trim());
        setTestResults(Array(Math.min(exLines.length, 3)).fill("pending"));
      } catch (err) {
        setErrorMsg("Could not load problem. Check backend connection.");
      } finally {
        setFetchingProblem(false);
      }
    },
    [getStarterCode],
  );

  useEffect(() => {
    fetchProblem("Easy");
  }, [fetchProblem]);

  const executeCode = async (action: "run" | "submit") => {
    if (!problem) return;
    setPhase(action === "run" ? "running" : "submitting");
    setErrorMsg("");
    setSuccessMsg("");

    setTestResults(testResults.map(() => "running"));

    const wrappedCode = wrapCode(
      code,
      toWrapperLanguage(language),
      problem.metaData,
      problem.examples,
    );
    const resolvedLanguageID =
      resolveJudge0LanguageId(language, judgeLanguages) ??
      getFallbackJudge0LanguageId(language);

    if (!resolvedLanguageID) {
      setErrorMsg(`Language not supported by judge.`);
      setPhase("idle");
      setTestResults(testResults.map(() => "failed"));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}submit-judge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: wrappedCode,
          language_id: resolvedLanguageID,
          problem_slug: problem.slug,
          action: action,
          fallback_input: problem.examples.trim(),
        }),
      });

      const data: BackendJudgeResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || data.verdict || "Execution Failed",
        );
      }

      const publicResults = data.results?.filter((r) => !r.hidden) || [];
      if (publicResults.length > 0) {
        setTestResults(
          publicResults.map((r) => (r.passed ? "passed" : "failed")),
        );
      } else {
        setTestResults([data.status === "Accepted" ? "passed" : "failed"]);
      }

      if (data.status === "Accepted") {
        if (action === "submit") {
          setPhase("accepted");
          setSuccessMsg(
            "Accepted! You solved it in " + fmtStopwatch(stopwatch),
          );
        } else {
          setSuccessMsg("Run Successful! All sample cases passed.");
          setPhase("idle");
        }
      } else {
        setErrorMsg(data.message || data.verdict || "Wrong Answer");
        setPhase("idle");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Judge service error");
      setPhase("idle");
      setTestResults(testResults.map(() => "failed"));
    }
  };

  const diffColor = problem ? DIFF_COLOR[problem.difficulty] : "#4ade80";

  if (fetchingProblem && !problem) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase animate-pulse">
            Fetching Practice Problem...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#05060b] flex flex-col overflow-hidden font-mono text-white">
      <style>{`
        @keyframes slideBar{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        textarea{resize:none;outline:none;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#09090b}
        ::-webkit-scrollbar-thumb{background:#27272a;border-radius:2px}
      `}</style>

      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-6">
          <Link
            href="/arena"
            className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2 text-[10px] uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Arena
          </Link>
          <div className="w-px h-4 bg-zinc-800" />
          <h1
            className={`${orbitron.className} text-lg font-black tracking-tighter`}
          >
            SOLO <span className="text-indigo-500">PRACTICE</span>
          </h1>
        </div>

        <div className="flex gap-2">
          {(["Easy", "Medium", "Hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDifficulty(d);
                fetchProblem(d);
              }}
              disabled={fetchingProblem}
              className="px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest cursor-pointer border transition-all disabled:opacity-40"
              style={{
                background:
                  difficulty === d ? `${DIFF_COLOR[d]}15` : "transparent",
                borderColor:
                  difficulty === d
                    ? `${DIFF_COLOR[d]}50`
                    : "rgba(255,255,255,0.08)",
                color: difficulty === d ? DIFF_COLOR[d] : "#52525b",
              }}
            >
              {d}
            </button>
          ))}

          <button
            onClick={() => fetchProblem(difficulty)}
            className="ml-2 px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors"
            title="Skip Problem"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div
          className={`${orbitron.className} text-xl font-bold tracking-widest ${phase === "accepted" ? "text-emerald-400" : "text-zinc-400"}`}
        >
          {fmtStopwatch(stopwatch)}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[40%] border-r border-white/5 flex flex-col overflow-hidden bg-[#0a0a0f]">
          <div className="flex border-b border-white/5 px-4 flex-shrink-0">
            {(["problem", "constraints"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-3 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer border-0 bg-transparent transition-colors"
                style={{
                  color: tab === t ? "#e4e4e7" : "#3f3f46",
                  borderBottom:
                    tab === t ? "2px solid #6366f1" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === "problem" && problem && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <h2
                    className={`${orbitron.className} text-xl font-bold text-white`}
                  >
                    {problem.title}
                  </h2>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded font-bold uppercase"
                    style={{
                      background: `${diffColor}15`,
                      border: `1px solid ${diffColor}30`,
                      color: diffColor,
                    }}
                  >
                    {problem.difficulty}
                  </span>
                </div>

                <div className="text-[13px] text-zinc-300 leading-relaxed tracking-wide whitespace-pre-line font-sans">
                  {problem.content.split("\n").map((line, i) => {
                    if (
                      line.startsWith("Example") ||
                      line.startsWith("Input:") ||
                      line.startsWith("Output:") ||
                      line.startsWith("Explanation:")
                    ) {
                      return (
                        <p
                          key={i}
                          className="text-zinc-400 font-mono text-[11px] my-1"
                        >
                          {line}
                        </p>
                      );
                    }
                    if (
                      line.startsWith("Constraints:") ||
                      line.startsWith("Note:")
                    ) {
                      return (
                        <p
                          key={i}
                          className="text-indigo-400 font-mono text-[10px] uppercase tracking-widest mt-6 mb-2"
                        >
                          {line}
                        </p>
                      );
                    }
                    return (
                      <p key={i} className="text-zinc-300 mb-3">
                        {line}
                      </p>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2 mt-8">
                  {problem.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-400 tracking-widest border border-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tab === "constraints" && problem && (
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 tracking-widest uppercase mb-4 font-mono">
                  Example Test Cases
                </p>
                {problem.examples
                  .split("\n")
                  .filter((l) => l.trim())
                  .map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.05]"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                      <span className="text-[12px] text-zinc-300 font-mono">
                        {line}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0 bg-[#0c0c0e]">
            <div className="flex items-center gap-4">
              <span className="text-[10px] text-zinc-500 tracking-widest font-mono uppercase">
                solution.{getLanguageExtension(language)}
              </span>
              <select
                value={language}
                onChange={(e) => {
                  const lang = e.target.value;
                  localStorage.setItem(practiceDraftKey(language), code);
                  setLanguage(lang);
                  localStorage.setItem("elonode_preferred_lang", lang);
                  const savedForLang = localStorage.getItem(
                    practiceDraftKey(lang),
                  );
                  setCode(savedForLang || getStarterCode(lang));
                }}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-[10px] tracking-widest rounded px-2 py-1 cursor-pointer font-mono outline-none"
              >
                {availableLanguages.map((slug) => (
                  <option key={slug} value={slug}>
                    {getLanguageLabel(slug)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => executeCode("run")}
                disabled={phase === "running" || phase === "submitting"}
                className="flex items-center gap-2 px-4 py-1.5 rounded text-zinc-300 font-mono text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all disabled:opacity-50"
              >
                <Play size={12} /> Run
              </button>
              <button
                onClick={() => executeCode("submit")}
                disabled={phase === "running" || phase === "submitting"}
                className="flex items-center gap-2 px-5 py-1.5 rounded text-white font-mono text-[10px] font-bold uppercase tracking-widest border-0 transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#4f46e5)",
                }}
              >
                <Zap size={12} /> Submit
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            {(successMsg || errorMsg) && (
              <div
                className="absolute inset-x-0 top-0 z-20 px-4 py-2 flex justify-between items-center"
                style={{
                  background: successMsg
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(248,113,113,0.1)",
                  borderBottom: `1px solid ${successMsg ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
                }}
              >
                <span
                  className="text-[11px] font-mono tracking-widest uppercase"
                  style={{ color: successMsg ? "#4ade80" : "#f87171" }}
                >
                  {successMsg || errorMsg}
                </span>
                {phase === "accepted" && (
                  <button
                    onClick={() => fetchProblem(difficulty)}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded uppercase tracking-widest hover:bg-emerald-500/30 font-bold transition"
                  >
                    Next Problem →
                  </button>
                )}
              </div>
            )}

            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              value={code}
              onChange={(val) => {
                const newCode = val || "";
                setCode(newCode);
                localStorage.setItem(practiceDraftKey(language), newCode);
              }}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
                minimap: { enabled: false },
                padding: { top: successMsg || errorMsg ? 48 : 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
              }}
            />
          </div>

          <div className="h-48 border-t border-white/5 bg-[#0a0a0f] flex flex-col flex-shrink-0">
            <div className="px-4 py-2 border-b border-white/5 flex items-center gap-3">
              <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                Console
              </span>
              {(phase === "running" || phase === "submitting") && (
                <span className="text-[9px] text-amber-400 animate-pulse tracking-widest uppercase">
                  Executing...
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex gap-4">
              {testResults.map((status, i) => {
                const colors: Record<TestStatus, string> = {
                  pending: "#27272a",
                  running: "#fbbf24",
                  passed: "#4ade80",
                  failed: "#f87171",
                };
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col justify-center items-center gap-2 p-3 rounded-lg border"
                    style={{
                      background: `${colors[status]}05`,
                      borderColor: `${colors[status]}20`,
                    }}
                  >
                    <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-mono">
                      Case {i + 1}
                    </span>
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                      {status === "running" && (
                        <div
                          className="h-full w-1/2 bg-amber-400 rounded-full"
                          style={{ animation: "slideBar 0.9s ease infinite" }}
                        />
                      )}
                      {status === "passed" && (
                        <div className="h-full w-full bg-emerald-400 rounded-full" />
                      )}
                      {status === "failed" && (
                        <div className="h-full w-2/5 bg-rose-400 rounded-full" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
