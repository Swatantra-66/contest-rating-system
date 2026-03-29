"use client";

import React, { useEffect, useState } from "react";
import { Orbitron } from "next/font/google";
import {
  Code2,
  TerminalSquare,
  Zap,
  ShieldAlert,
  Globe2,
  Activity,
  Server,
  Lock,
  ListChecks,
  KeyRound,
  UserCheck,
  CheckCircle2,
  Database,
  Terminal,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useUser, SignUpButton } from "@clerk/nextjs";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });

const INTUITIVE_FEATURES = [
  {
    icon: <Zap size={20} className="text-emerald-400" />,
    title: "Sub-second WebSockets",
    desc: "Experience zero-latency 1v1 duels and 3v3 team battles. Built on Go and highly optimized concurrent pipelines.",
  },
  {
    icon: <TerminalSquare size={20} className="text-indigo-400" />,
    title: "Live Code Execution",
    desc: "Isolated, sandboxed environments powered by Judge0. Compile and execute C++, Rust, Go, Python, and more instantly.",
  },
  {
    icon: <Activity size={20} className="text-rose-400" />,
    title: "Dynamic ELO Scaling",
    desc: "Transparent, percentile-based performance ratings. Climb from Newbie to Grandmaster through rigorous combat.",
  },
  {
    icon: <Code2 size={20} className="text-amber-400" />,
    title: "Native Language Runtimes",
    desc: "High-performance environments for nearly every popular programming language. Zero configuration needed.",
  },
  {
    icon: <Globe2 size={20} className="text-cyan-400" />,
    title: "Global Sync",
    desc: "Real-time leaderboard calibrations and match archives accessible across the globe without caching delays.",
  },
  {
    icon: <Server size={20} className="text-purple-400" />,
    title: "Dedicated Architecture",
    desc: "Backend provisioned on high-performance AWS/Render clusters, ensuring stable matchmaking during high-load spikes.",
  },
];

const SECURITY_FEATURES = [
  {
    icon: <Lock size={20} className="text-indigo-400" />,
    title: "Isolated Sandboxing",
    desc: "Keep user code executions strictly isolated from the main backend using containerized micro-VMs.",
  },
  {
    icon: <ShieldAlert size={20} className="text-emerald-400" />,
    title: "Built-in Anti-Cheat",
    desc: "Protect every match from unfair advantages with rate limiting, payload verification, and execution timeouts.",
  },
  {
    icon: <CheckCircle2 size={20} className="text-cyan-400" />,
    title: "Fair Play Compliance",
    desc: "Meet strict competitive programming standards without overhead. Plagiarism checks run seamlessly.",
  },
  {
    icon: <ListChecks size={20} className="text-purple-400" />,
    title: "Audit Controls",
    desc: "Built-in audit logging and monitoring for all match events, socket connections, and rating adjustments.",
  },
  {
    icon: <KeyRound size={20} className="text-rose-400" />,
    title: "Encrypted Payloads",
    desc: "Minimum AES-128 encryption for sensitive user session tokens, socket channels, and database records.",
  },
  {
    icon: <UserCheck size={20} className="text-amber-400" />,
    title: "Unique Node ID",
    desc: "Control access and match generation via strict Clerk-based user identification and role-based access control.",
  },
];

const LANGUAGES_ROW_1 = [
  "Go",
  "Rust",
  "C",
  "C++",
  "Python",
  "JS",
  "TS",
  "Java",
  "Go",
  "Rust",
  "C",
  "C++",
  "Python",
  "JS",
  "TS",
  "Java",
];

const LANGUAGES_ROW_2 = [
  "PHP",
  "Ruby",
  "SQL",
  "Bash",
  "Swift",
  "Kotlin",
  "Dart",
  "Lua",
  "PHP",
  "Ruby",
  "SQL",
  "Bash",
  "Swift",
  "Kotlin",
  "Dart",
  "Lua",
];

const FLOATING_ICONS = [
  {
    id: "js",
    name: "javascript",
    bg: "#064e3b",
    color: "4ade80",
    x: -440,
    y: -200,
    size: 70,
    rotate: -12,
  },
  {
    id: "ts",
    name: "typescript",
    bg: "#1e3a8a",
    color: "60a5fa",
    x: -240,
    y: -240,
    size: 75,
    rotate: 8,
  },
  {
    id: "make",
    name: "make",
    bg: "#4c1d95",
    color: "d8b4fe",
    x: 20,
    y: -270,
    size: 65,
    rotate: -4,
  },
  {
    id: "postgres",
    name: "postgresql",
    bg: "#172554",
    color: "93c5fd",
    x: 280,
    y: -250,
    size: 80,
    rotate: -6,
  },
  {
    id: "go",
    name: "go",
    bg: "#0f172a",
    color: "38bdf8",
    x: 460,
    y: -180,
    size: 70,
    rotate: 14,
  },
  {
    id: "docker",
    name: "docker",
    bg: "#082f49",
    color: "38bdf8",
    x: -500,
    y: -50,
    size: 80,
    rotate: -15,
  },
  {
    id: "unicorn",
    text: "Unicorn",
    bg: "#831843",
    color: "f9a8d4",
    x: -350,
    y: -10,
    size: 75,
    rotate: 10,
  },
  {
    id: "vercel",
    name: "vercel",
    bg: "#000000",
    color: "ffffff",
    border: "1px solid #27272a",
    x: -460,
    y: 120,
    size: 75,
    rotate: -5,
  },
  {
    id: "github",
    name: "github",
    bg: "#18181b",
    color: "e4e4e7",
    x: 460,
    y: -50,
    size: 75,
    rotate: -8,
  },
  {
    id: "render",
    name: "render",
    bg: "#4c0519",
    color: "fda4af",
    x: 500,
    y: 100,
    size: 85,
    rotate: 15,
  },
  {
    id: "discord",
    name: "discord",
    bg: "#3730a3",
    color: "818cf8",
    x: -400,
    y: 250,
    size: 75,
    rotate: 6,
  },
  {
    id: "supabase",
    name: "supabase",
    bg: "#064e3b",
    color: "34d399",
    x: -180,
    y: 270,
    size: 80,
    rotate: -10,
  },
  {
    id: "sql",
    text: "SQL",
    bg: "#0c4a6e",
    color: "7dd3fc",
    x: 60,
    y: 260,
    size: 68,
    rotate: 12,
  },
  {
    id: "clerk",
    name: "clerk",
    bg: "#312e81",
    color: "a5b4fc",
    x: 260,
    y: 260,
    size: 75,
    rotate: -14,
  },
  {
    id: "git",
    name: "git",
    bg: "#7c2d12",
    color: "fb923c",
    x: 440,
    y: 230,
    size: 65,
    rotate: 8,
  },
];

const FOOTER_TECH_ICONS = [
  "Typescript",
  "Go",
  "PostgreSQL",
  "Docker",
  "Git",
  "JavaScript",
  "Supabase",
  "Vercel",
  "Unicorn Studio",
  "SQL",
  "Make.com",
  "Clerk",
  "Render",
  "Discord",
  "GitHub",
];

const TESTIMONIALS = [
  {
    quote:
      "When scaling my global ranking became a priority, I didn't have to shift focus away from solving problems. Elonode handled the execution, ELO math, and matchmaking so I could keep moving fast without taking on infrastructure overhead.",
    author: "TARUN",
    role: "NEWBIE",
  },
  {
    quote:
      "The speed and reliability of Judge0-powered code execution on Elonode are a game-changer. I don't have to worry about spinning up sandboxes; I can focus entirely on solving algorithmic challenges.",
    author: "SARTHAK",
    role: "MASTER",
  },
  {
    quote:
      "The sub-second WebSockets make 1v1 duels feel incredibly responsive. It's the most intense and fair competitive programming arena I've ever experienced.",
    author: "PIXER",
    role: "Apprentice",
  },
  {
    quote:
      "Zero ops, zero surprises. I just write my logic and Elonode takes care of the compilation and real-time test cases. Pure algorithmic combat.",
    author: "VIBHU",
    role: "Expert",
  },
  {
    quote:
      "The Dynamic ELO scaling perfectly tracks actual growth. You get rewarded for rigorous combat and facing tougher opponents.",
    author: "SWATANTRA",
    role: "Grandmaster",
  },
];

const MinimalDiscordIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.33-.35-.76-.53-1.09a.09.09 0 0 0-.07-.03c-1.5.26-2.93.71-4.27 1.33a.08.08 0 0 0-.05.05C2.79 11.53 1.99 17.53 2.8 23.36c.01.03.03.05.06.06a16.94 16.94 0 0 0 5.09 2.59.09.09 0 0 0 .1-.03c.41-.56.78-1.16 1.11-1.78a.09.09 0 0 0-.04-.12 11.29 11.29 0 0 1-1.62-.77.09.09 0 0 1-.01-.15c.1-.08.2-.16.3-.25a.09.09 0 0 1 .09-.01c3.18 1.45 6.6 1.45 9.75 0a.09.09 0 0 1 .09.01c.1.09.2.17.3.25a.09.09 0 0 1-.02.15 11.28 11.28 0 0 1-1.62.77.09.09 0 0 0-.04.12c.33.62.7 1.22 1.11 1.78a.09.09 0 0 0 .1.03 16.94 16.94 0 0 0 5.09-2.59.09.09 0 0 0 .06-.06c.89-6.38-.25-12.22-2.18-17.98a.08.08 0 0 0-.05-.05zM8.5 16.29c-1.08 0-1.98-1.02-1.98-2.27 0-1.25.88-2.27 1.98-2.27s1.99 1.02 1.98 2.27c0 1.25-.89 2.27-1.98 2.27zm7 0c-1.08 0-1.98-1.02-1.98-2.27 0-1.25.88-2.27 1.98-2.27s1.99 1.02 1.98 2.27c0 1.25-.89 2.27-1.98 2.27z" />
  </svg>
);

const MinimalGithubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.165c-3.338.726-4.042-1.61-4.042-1.61-.546-1.386-1.332-1.755-1.332-1.755-1.087-.744.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .32.21.695.825.575C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

export default function InfoSection() {
  const { isSignedIn } = useUser();
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
        setFade(true);
      }, 500);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-[#05060b] relative z-20 border-t border-zinc-900 mt-20 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes scrollLeft {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes scrollRight {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-scroll-left {
            animation: scrollLeft 15s linear infinite;
          }
          .animate-scroll-right {
            animation: scrollRight 15s linear infinite;
          }
          .animate-scroll-left:hover, .animate-scroll-right:hover {
            animation-play-state: paused;
          }
          .animate-footer-tech {
            animation: scrollLeft 35s linear infinite;
          }
          .text-gradient {
            background: linear-gradient(90deg, #a855f7, #6366f1, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `,
        }}
      />

      <section className="relative w-full max-w-[1400px] mx-auto mb-12 md:mb-24 mt-0 flex flex-col lg:flex-row overflow-hidden rounded-2xl bg-[#0a0014] border border-zinc-900 min-h-[350px]">
        <div className="relative z-20 w-full lg:w-[45%] px-8 py-16 md:py-24 md:px-16 bg-[#0a0014] flex flex-col justify-center">
          <div className="absolute inset-y-0 -right-12 w-12 bg-gradient-to-l from-transparent to-[#0a0014] pointer-events-none hidden lg:block" />

          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-6 leading-tight">
            Whatever your weapon, <br />
            <span className="text-zinc-300">it compiles on Elonode.</span>
          </h2>
          <Link
            href="/docs"
            className="group relative overflow-hidden inline-flex items-center justify-center px-5 py-3 bg-white text-black text-sm font-bold rounded mt-2 w-max transition-all duration-300 hover:shadow-[0_2px_12px_rgba(124,58,237,0.4)]"
          >
            <span className="absolute left-0 top-0 h-full w-0 bg-[#7c3aed] transition-all duration-300 ease-out group-hover:w-full"></span>
            <span className="relative z-10 flex items-center transition-colors duration-300 group-hover:text-white">
              View Runtimes <span className="ml-2">→</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 w-full lg:w-[55%] flex flex-col justify-center gap-6 overflow-hidden py-12 lg:py-0 [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-scroll-left gap-4">
            {LANGUAGES_ROW_1.map((lang, i) => (
              <div
                key={`row1-${i}`}
                className="w-16 h-16 md:w-20 md:h-20 bg-[#581c87] rounded-xl flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-lg"
              >
                {lang}
              </div>
            ))}
          </div>

          <div className="flex w-max animate-scroll-right gap-4 ml-[-80px]">
            {LANGUAGES_ROW_2.map((lang, i) => (
              <div
                key={`row2-${i}`}
                className="w-16 h-16 md:w-20 md:h-20 bg-[#581c87] rounded-xl flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-lg"
              >
                {lang}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-2 pb-16 border-b border-zinc-900/50 flex flex-col items-center justify-center gap-10">
        <p className="text-xs text-zinc-500 font-mono uppercase tracking-[0.2em] font-bold">
          Trusted by Elite Competitive Programmers
        </p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale">
          {["LeetCode", "Codeforces", "AtCoder", "HackerRank", "CodeChef"].map(
            (name) => (
              <span
                key={name}
                className="text-xl font-black tracking-tighter text-white uppercase"
              >
                {name}
              </span>
            ),
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 border-b border-zinc-900">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-8 items-center">
          <div className="w-full lg:w-1/2">
            <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-white mb-6 leading-[1.1]">
              Your fastest path to <br />
              the top of the <br />
              <span className="text-gradient font-bold tracking-tighter">
                Leaderboards
              </span>
            </h2>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">
              Intuitive infrastructure to scale your problem-solving skills from
              your first duel to your Grandmaster title.
            </p>
            <div className="flex flex-wrap gap-4 mt-12">
              <Link
                href="/arena"
                className="group relative overflow-hidden inline-flex items-center justify-center px-6 py-3 bg-white text-black text-sm font-bold rounded transition-all duration-300 hover:shadow-[0_2px_12px_rgba(124,58,237,0.4)]"
              >
                <span className="absolute left-0 top-0 h-full w-0 bg-[#7c3aed] transition-all duration-300 ease-out group-hover:w-full"></span>
                <span className="relative z-10 flex items-center transition-colors duration-300 group-hover:text-white">
                  Start for free <span className="ml-1">→</span>
                </span>
              </Link>
              <Link
                href="/docs"
                className="px-6 py-3 bg-transparent text-white border border-zinc-700 text-sm font-bold rounded hover:bg-zinc-900 transition-colors"
              >
                Read the Docs
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2 flex justify-end">
            <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg p-6 shadow-2xl">
              <div className="absolute -top-3 -left-3 bg-zinc-800 text-zinc-300 text-xs font-mono px-3 py-1 rounded">
                $ elonode challenge --target=random
              </div>
              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-mono text-zinc-500">
                    Status
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />{" "}
                    Match Found
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-mono text-zinc-500">
                    Opponent
                  </span>
                  <span className="text-xs font-mono text-zinc-300">
                    NightmareNode (1842 ELO)
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                  <span className="text-xs font-mono text-zinc-500">
                    Problem
                  </span>
                  <span className="text-xs font-mono text-rose-400">
                    HARD (Dynamic Programming)
                  </span>
                </div>
                <div className="mt-4 bg-indigo-500/10 border border-indigo-500/30 rounded p-3 text-center">
                  <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">
                    Compiling Workspace...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-b border-zinc-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              step: "1",
              title: "Select your mode",
              desc: "Choose between pure 1v1 algorithmic duels or tactical 3v3 ICPC-style team battles.",
              ui: (
                <div className="mt-6 border border-zinc-800 rounded-md bg-zinc-950 overflow-hidden">
                  <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <span className="text-xs text-zinc-400 font-mono">
                      + New Battle
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex justify-between items-center text-xs p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                      <span>1v1 Duel</span> <CheckCircle2 size={14} />
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 text-zinc-500 hover:bg-zinc-900 rounded">
                      <span>3v3 ICPC Team</span>{" "}
                      <CheckCircle2 size={14} className="opacity-0" />
                    </div>
                  </div>
                </div>
              ),
            },
            {
              step: "2",
              title: "Write your code",
              desc: "Deploy your logic instantly. Elonode handles the compilation and runs test cases in real-time.",
              ui: (
                <div className="mt-6 border border-zinc-800 rounded-md bg-zinc-950 overflow-hidden">
                  <div className="p-3 space-y-3 font-mono text-[10px] text-zinc-400">
                    <div className="flex justify-between">
                      <span>Lang</span>
                      <span className="bg-zinc-800 px-2 py-0.5 rounded text-white">
                        Go 1.20
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="text-emerald-400">Accepted</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="text-white">42ms</span>
                    </div>
                    <div className="w-full bg-zinc-800 text-zinc-300 p-2 rounded flex justify-between">
                      Submit Solution{" "}
                      <span className="opacity-50">Ctrl+Enter</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              step: "3",
              title: "Elonode does the rest",
              desc: "Get instant percentile scaling, ELO rating updates, and global leaderboard placements.",
              ui: (
                <div className="mt-6 border border-zinc-800 rounded-md bg-zinc-950 overflow-hidden font-mono text-[10px]">
                  <div className="p-3 text-zinc-500 border-b border-zinc-800">
                    ~ $ system update --rating
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex gap-2">
                      <CheckCircle2 size={12} className="text-emerald-500" />{" "}
                      <span className="text-zinc-300">Match concluded</span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 size={12} className="text-emerald-500" />{" "}
                      <span className="text-zinc-300">
                        Performance: Top 10%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <CheckCircle2 size={12} className="text-emerald-500" />{" "}
                      <span className="text-indigo-400">
                        Rating: +42 (Expert)
                      </span>
                    </div>
                  </div>
                </div>
              ),
            },
          ].map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center text-white font-bold mb-6 rounded-sm">
                {item.step}
              </div>
              <h3 className="text-2xl font-medium text-white mb-4">
                {item.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {item.desc}
              </p>
              {item.ui}
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-8 md:p-16 border-b md:border-b-0 md:border-r border-zinc-900">
            <h3 className="text-3xl text-white font-medium mb-4">
              Durable, highly parallel execution engine
            </h3>
            <p className="text-zinc-400 mb-8">
              Compile complex algorithmic logic and async workloads across 40+
              language environments. No managing workers.
            </p>
            <Link
              href="#"
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2 mb-8"
            >
              Execution docs →
            </Link>

            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-xs text-zinc-300">
              <div className="flex gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <span className="text-indigo-400">func</span>{" "}
              <span className="text-blue-300">EvaluateSubmission</span>(code{" "}
              <span className="text-emerald-400">string</span>) {"{"}
              <br />
              &nbsp;&nbsp;runner := judge0.NewClient()
              <br />
              &nbsp;&nbsp;result :={" "}
              <span className="text-indigo-400">await</span>{" "}
              runner.Execute(code)
              <br />
              &nbsp;&nbsp;<span className="text-indigo-400">return</span>{" "}
              result.Status
              <br />
              {"}"}
            </div>
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-16">
            <h3 className="text-3xl text-white font-medium mb-4">
              Enterprise-grade PostgreSQL data
            </h3>
            <p className="text-zinc-400 mb-8">
              Securely store match histories, user credentials, and ELO
              calculations with point-in-time recovery and high availability.
            </p>
            <Link
              href="#"
              className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-2 mb-8"
            >
              Database docs →
            </Link>

            <div className="bg-zinc-950 border border-zinc-800 rounded-md p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Database size={16} /> elonode-db
                </div>
                <div className="text-emerald-400 text-[10px] font-mono uppercase px-2 py-1 bg-emerald-500/10 rounded flex items-center gap-1">
                  <CheckCircle2 size={10} /> Available
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-zinc-800 rounded p-2 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                    Connections
                  </div>
                  <div className="text-lg text-white font-mono">1,042</div>
                </div>
                <div className="border border-zinc-800 rounded p-2 text-center">
                  <div className="text-[10px] text-zinc-500 uppercase font-mono mb-1">
                    Storage
                  </div>
                  <div className="text-lg text-white font-mono">14.2 GB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 border-b border-zinc-900">
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-white mb-4">
            Stay secure and <br />
            resilient by default
          </h2>
          <p className="text-zinc-400 text-lg">Build rating, not compliance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {SECURITY_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex flex-col gap-4 group">
              <div className="w-12 h-12 bg-zinc-900 rounded-md flex items-center justify-center">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-zinc-900 bg-zinc-950/30">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/3 p-8 md:p-16 border-b lg:border-b-0 lg:border-r border-zinc-900 flex flex-col justify-center">
            <h2 className="text-3xl md:text-4xl font-medium tracking-tight text-white mb-6">
              Skill-based matchmaking <br />
              <span className="text-zinc-500">that tracks actual growth.</span>
            </h2>
            <p className="text-zinc-400 text-sm font-mono mb-8 leading-relaxed">
              Keep your competitive integrity intact. Our advanced
              percentile-based rating system evaluates your performance against
              standard benchmarks after every duel.
            </p>
            <Link
              href="/leaderboard"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-mono hover:underline underline-offset-4 flex items-center gap-2"
            >
              Explore ranking tiers →
            </Link>
          </div>

          <div className="w-full lg:w-2/3 p-8 md:p-16 relative min-h-[400px] flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            <svg
              viewBox="0 0 800 300"
              className="w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10"
              preserveAspectRatio="none"
            >
              <path
                d="M0,250 L100,220 L150,260 L250,150 L350,180 L400,90 L500,120 L650,40 L750,130 L800,100"
                fill="none"
                stroke="#818cf8"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0,250 L100,220 L150,260 L250,150 L350,180 L400,90 L500,120 L650,40 L750,130 L800,100 L800,300 L0,300 Z"
                fill="url(#gradient)"
                opacity="0.1"
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute top-[25%] right-[20%] bg-zinc-950 border border-zinc-800 p-4 rounded shadow-2xl z-20 animate-pulse hidden md:block">
              <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">
                Match Recorded
              </p>
              <div className="flex justify-between items-center gap-6">
                <span className="text-xs font-bold text-white">
                  RATING CHANGE
                </span>
                <span className="text-emerald-400 font-mono text-sm">
                  +24 ELO
                </span>
              </div>
              <div className="flex justify-between items-center gap-6 mt-1">
                <span className="text-xs font-bold text-zinc-400">
                  NEW TIER
                </span>
                <span className="text-indigo-400 font-mono text-xs uppercase tracking-widest">
                  Expert
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 md:py-32 border-b border-zinc-900">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-medium tracking-tight text-white mb-4">
            Intuitive matchmaking,
            <br />
            <span className="text-zinc-500">
              designed for competitive builders.
            </span>
          </h2>
          <p className="text-zinc-400 font-mono text-sm">
            Enter the arena faster with integrated systems that just work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
          {INTUITIVE_FEATURES.map((feature, idx) => (
            <div key={idx} className="flex flex-col gap-4 group">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-white font-bold text-lg">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-24 border-b border-zinc-900 flex justify-center items-center min-h-[380px]">
        <div
          className={`max-w-3xl text-center transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}
        >
          <p className="text-xl md:text-3xl text-zinc-300 font-medium leading-relaxed mb-8 md:min-h-[120px] flex items-center justify-center">
            "{TESTIMONIALS[testimonialIdx].quote}"
          </p>
          <p className="text-[10px] font-mono text-indigo-400 font-bold tracking-[0.2em] uppercase">
            {TESTIMONIALS[testimonialIdx].author},{" "}
            {TESTIMONIALS[testimonialIdx].role}
          </p>
        </div>
      </section>

      <section className="py-32 md:py-56 relative overflow-hidden flex items-center justify-center border-b border-zinc-900 bg-[#05060b] min-h-[80vh]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {FLOATING_ICONS.map((item) => (
            <div
              key={item.id}
              className="absolute flex items-center justify-center drop-shadow-2xl"
              style={{
                width: item.size,
                height: item.size,
                backgroundColor: item.bg,
                border: item.border || "none",
                borderRadius: "16px",
                opacity: 0.8,
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) rotate(${item.rotate}deg)`,
                zIndex: 0,
              }}
            >
              {item.name ? (
                <img
                  src={`https://cdn.simpleicons.org/${item.name}/${item.color}`}
                  alt={item.id}
                  style={{ width: item.size * 0.5, height: item.size * 0.5 }}
                />
              ) : (
                <span
                  className="font-bold"
                  style={{
                    color: `#${item.color}`,
                    fontSize: item.size * 0.25,
                  }}
                >
                  {item.text}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="relative z-10 bg-[#0d0d0f] py-20 px-8 md:py-24 md:px-12 text-center max-w-[760px] w-full mx-4 border border-zinc-800/80 rounded shadow-2xl">
          <h2 className="text-3xl md:text-[44px] font-medium tracking-tight text-white mb-4 leading-tight">
            Build rating, not integration.
          </h2>
          <p className="text-zinc-300 text-sm md:text-[17px] mb-8 leading-relaxed">
            ZERO OPS. PURE Algorithmic duels.
          </p>
          {isSignedIn ? (
            <Link
              href="/arena"
              className="group relative overflow-hidden px-6 py-3 bg-white text-black text-sm font-semibold rounded-md transition-all duration-300 hover:shadow-[0_2px_12px_rgba(124,58,237,0.4)] cursor-pointer flex items-center justify-center mx-auto w-max"
            >
              <span className="absolute left-0 top-0 h-full w-0 bg-[#7c3aed] transition-all duration-300 ease-out group-hover:w-full"></span>
              <span className="relative z-10 flex items-center gap-1.5 transition-colors duration-300 group-hover:text-white">
                Join Contest
                <ChevronRight size={18} strokeWidth={2.5} />
              </span>
            </Link>
          ) : (
            <SignUpButton mode="modal" forceRedirectUrl="/">
              <button className="group relative overflow-hidden px-6 py-3 bg-white text-black text-sm font-semibold rounded-md transition-all duration-300 hover:shadow-[0_2px_12px_rgba(124,58,237,0.4)] cursor-pointer flex items-center justify-center mx-auto w-max">
                <span className="absolute left-0 top-0 h-full w-0 bg-[#7c3aed] transition-all duration-300 ease-out group-hover:w-full"></span>
                <span className="relative z-10 flex items-center gap-1.5 transition-colors duration-300 group-hover:text-white">
                  Initialize your node
                  <ChevronRight size={18} strokeWidth={2.5} />
                </span>
              </button>
            </SignUpButton>
          )}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="text-white text-[11px] font-bold tracking-widest mb-6">
            FEATURES
          </h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-medium">
            <li>
              <Link
                href="/arena"
                className="hover:text-white transition-colors"
              >
                Matchmaking
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-white transition-colors">
                ELO Rating System
              </Link>
            </li>
            <li>
              <Link
                href="https://ce.judge0.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Code Execution
              </Link>
            </li>
            <li>
              <Link
                href="/leaderboard"
                className="hover:text-white transition-colors"
              >
                Live Leaderboards
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Anti-Cheat
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-[11px] font-bold tracking-widest mb-6">
            MODES
          </h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-medium">
            <li>
              <Link
                href="/arena"
                className="hover:text-white transition-colors"
              >
                1v1 Duels
              </Link>
            </li>
            <li>
              <Link
                href="/team-contests/new"
                className="hover:text-white transition-colors"
              >
                3v3 ICPC Battles
              </Link>
            </li>
            <li>
              <span className="flex items-center text-zinc-600 cursor-not-allowed">
                Practice Arena{" "}
                <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  COMING SOON
                </span>
              </span>
            </li>
            <li>
              <span className="flex items-center text-zinc-600 cursor-not-allowed">
                Custom Lobbies{" "}
                <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-sm bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  COMING SOON
                </span>
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-[11px] font-bold tracking-widest mb-6">
            RESOURCES
          </h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-medium">
            <li>
              <Link href="/docs" className="hover:text-white transition-colors">
                System Docs
              </Link>
            </li>
            <li>
              <Link
                href="/leaderboard"
                className="hover:text-white transition-colors"
              >
                Global Rankings
              </Link>
            </li>
            <li>
              <Link
                href="/api-reference"
                className="hover:text-white transition-colors"
              >
                API Reference
              </Link>
            </li>
            <li>
              <Link
                href="https://discord.com/channels/1308083728035217429/1478339574592835634"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Community Discord
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-[11px] font-bold tracking-widest mb-6">
            SYSTEM
          </h4>
          <ul className="space-y-4 text-zinc-500 text-sm font-medium">
            <li>
              <div className="flex items-center gap-2 text-zinc-500 cursor-default select-none">
                <div className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span>Status: All Systems Operational</span>
              </div>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/support"
                className="hover:text-white transition-colors"
              >
                Contact Support
              </Link>
            </li>
          </ul>
        </div>
      </footer>

      <section className="w-full h-10 border-t border-zinc-900 bg-zinc-950 flex items-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)] opacity-40">
        <div className="flex w-max animate-footer-tech gap-12 text-zinc-600 font-mono text-[10px] uppercase font-semibold">
          {FOOTER_TECH_ICONS.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
          {FOOTER_TECH_ICONS.map((tech) => (
            <span key={`${tech}-loop`}>{tech}</span>
          ))}
        </div>
      </section>

      <footer className="w-full py-8 px-16 flex items-center justify-between text-zinc-500 text-xs bg-[#05060b]">
        <div className="flex items-center gap-1.5 font-medium">
          <span>© 2026 ELONODE. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <Link
            href="https://discord.com/channels/1308083728035217429/1478339574592835634"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MinimalDiscordIcon /> Discord
          </Link>
          <Link
            href="https://github.com/Swatantra-66/elonode"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <MinimalGithubIcon /> GitHub
          </Link>
        </div>
      </footer>
    </div>
  );
}
