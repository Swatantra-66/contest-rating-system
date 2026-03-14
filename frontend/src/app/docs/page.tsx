"use client";

import React from "react";
import {
  BookOpen,
  Calculator,
  Database,
  Activity,
  Terminal,
  Network,
  Shield,
  Swords,
  Trophy,
  Code2,
  GitBranch,
} from "lucide-react";
import { Orbitron } from "next/font/google";

const futuristicFont = Orbitron({ subsets: ["latin"], weight: ["700"] });

function SectionHeader({
  num,
  icon,
  title,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-mono text-[10px] text-zinc-600 tracking-widest">
        {num}
      </span>
      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
        {icon}
      </div>
      <h2
        className={`${futuristicFont.className} text-sm text-white uppercase tracking-widest`}
      >
        {title}
      </h2>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-900">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-bold"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`border-t border-zinc-800/60 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"} hover:bg-indigo-500/5 transition-colors`}
            >
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3.5 font-mono text-xs">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    POST: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    DELETE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    WS: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${colors[method] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {method}
    </span>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-700 pb-20">
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-3">
          <BookOpen className="text-indigo-500 w-5 h-5" />
          <h1
            className={`${futuristicFont.className} text-lg text-white tracking-widest uppercase`}
          >
            System <span className="text-zinc-600">Documentation</span>
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        <section>
          <SectionHeader
            num="01"
            icon={<Calculator size={13} />}
            title="Rating Algorithm"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-3">
                Step-by-Step Logic
              </p>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {[
                  ["1", "Beaten", "= Total Participants − Rank"],
                  ["2", "Percentile", "= Beaten / Total Participants"],
                  ["3", "Bracket", "Identify percentile range"],
                  ["4", "Performance", "Assign standard rating for bracket"],
                  ["5", "Change", "= (Performance − Current) / 2"],
                  ["6", "New Rating", "= Old Rating + Change"],
                  ["7", "Tier", "Resolve new tier from updated rating"],
                ].map(([num, label, value], i) => (
                  <div
                    key={num}
                    className={`flex items-center gap-4 px-5 py-3 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"} border-b border-zinc-800/50 last:border-0`}
                  >
                    <span className="text-zinc-700 font-mono text-[10px] w-4">
                      {num}
                    </span>
                    <span className="text-indigo-400 font-mono text-xs font-bold w-28">
                      {label}
                    </span>
                    <span className="text-zinc-400 font-mono text-xs">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-3">
                Live Example
              </p>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {[
                  {
                    label: "Total Participants",
                    value: "100",
                    color: "text-zinc-300",
                  },
                  { label: "Rank", value: "10", color: "text-zinc-300" },
                  { label: "Beaten", value: "90", color: "text-zinc-300" },
                  {
                    label: "Percentile",
                    value: "0.90 → Top 10%",
                    color: "text-cyan-400",
                  },
                  {
                    label: "Performance",
                    value: "1200",
                    color: "text-amber-400",
                  },
                  {
                    label: "Current Rating",
                    value: "1000",
                    color: "text-zinc-300",
                  },
                  {
                    label: "Rating Change",
                    value: "+100",
                    color: "text-emerald-400",
                  },
                  {
                    label: "New Rating",
                    value: "1100",
                    color: "text-emerald-400 font-bold",
                  },
                ].map(({ label, value, color }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-5 py-3 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"} border-b border-zinc-800/50 last:border-0`}
                  >
                    <span className="text-zinc-500 font-mono text-xs">
                      {label}
                    </span>
                    <span className={`font-mono text-xs ${color}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            num="02"
            icon={<Activity size={13} />}
            title="Performance Bracket Matrix"
          />
          <Table
            headers={[
              "Percentile",
              "Standard Performance Rating",
              "Typical Tier",
            ]}
            rows={[
              [
                <span className="text-zinc-500">Below 50%</span>,
                <span className="text-zinc-400">900</span>,
                <span className="text-zinc-500">Newbie</span>,
              ],
              [
                <span className="text-zinc-400">Top 50%</span>,
                <span className="text-zinc-300">1000</span>,
                <span className="text-zinc-400">Newbie</span>,
              ],
              [
                <span className="text-zinc-300">Top 30%</span>,
                <span className="text-zinc-300">1100</span>,
                <span className="text-emerald-400">Apprentice</span>,
              ],
              [
                <span className="text-zinc-200">Top 20%</span>,
                <span className="text-zinc-200">1150</span>,
                <span className="text-cyan-400">Specialist</span>,
              ],
              [
                <span className="text-cyan-400">Top 10%</span>,
                <span className="text-cyan-400">1200</span>,
                <span className="text-blue-400">Expert</span>,
              ],
              [
                <span className="text-purple-400">Top 5%</span>,
                <span className="text-purple-400">1400</span>,
                <span className="text-purple-400">Master</span>,
              ],
              [
                <span className="text-rose-400 font-bold">Top 1%</span>,
                <span className="text-rose-400 font-bold">1800</span>,
                <span className="text-rose-400 font-bold">Grandmaster</span>,
              ],
            ]}
          />
        </section>

        <section>
          <SectionHeader
            num="03"
            icon={<Trophy size={13} />}
            title="Tier Hierarchy"
          />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { name: "Newbie", range: "1000–1099", color: "#71717a" },
              { name: "Apprentice", range: "1100–1149", color: "#34d399" },
              { name: "Specialist", range: "1150–1199", color: "#22d3ee" },
              { name: "Expert", range: "1200–1399", color: "#60a5fa" },
              { name: "Master", range: "1400–1799", color: "#c084fc" },
              { name: "Grandmaster", range: "1800+", color: "#fb7185" },
            ].map(({ name, range, color }) => (
              <div
                key={name}
                className="rounded-xl p-4 flex flex-col items-center gap-2 border"
                style={{ background: `${color}10`, borderColor: `${color}30` }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                />
                <span
                  className="font-mono text-[9px] font-bold uppercase tracking-widest"
                  style={{ color }}
                >
                  {name}
                </span>
                <span className="font-mono text-[9px] text-zinc-600 tracking-widest">
                  {range}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            num="04"
            icon={<Swords size={13} />}
            title="Duel System"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-3">
                How a Duel Works
              </p>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {[
                  "Challenger picks difficulty (Easy / Medium / Hard)",
                  "Challenger picks problem mode (Same / Random)",
                  "Challenge sent via WebSocket — 30s to accept",
                  "Both players click Ready before countdown",
                  "LeetCode problem fetched based on mode",
                  "First to pass all test cases wins",
                  "Contest auto-finalizes — ratings update immediately",
                ].map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-4 px-5 py-3.5 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"} border-b border-zinc-800/50 last:border-0`}
                  >
                    <span className="text-indigo-500 font-mono text-[10px] font-bold mt-0.5 w-4 flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-zinc-400 font-mono text-xs leading-relaxed">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-3">
                Timers & Edge Cases
              </p>
              <div className="rounded-xl border border-zinc-800 overflow-hidden">
                {[
                  {
                    label: "Easy",
                    value: "15 minutes",
                    color: "text-emerald-400",
                  },
                  {
                    label: "Medium",
                    value: "25 minutes",
                    color: "text-amber-400",
                  },
                  {
                    label: "Hard",
                    value: "45 minutes",
                    color: "text-rose-400",
                  },
                  {
                    label: "Opponent Leaves",
                    value: "Auto win + finalize",
                    color: "text-indigo-400",
                  },
                  {
                    label: "Time Runs Out",
                    value: "Loser gets rank 2",
                    color: "text-zinc-400",
                  },
                  {
                    label: "Same Mode",
                    value: "Both get identical problem via cache",
                    color: "text-zinc-400",
                  },
                ].map(({ label, value, color }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"} border-b border-zinc-800/50 last:border-0`}
                  >
                    <span className="text-zinc-500 font-mono text-xs">
                      {label}
                    </span>
                    <span className={`font-mono text-xs ${color}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            num="05"
            icon={<Code2 size={13} />}
            title="Supported Languages"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { lang: "Python 3", id: 71, color: "#fbbf24" },
              { lang: "C++", id: 54, color: "#60a5fa" },
              { lang: "Java", id: 62, color: "#f87171" },
              { lang: "JavaScript", id: 63, color: "#34d399" },
              { lang: "TypeScript", id: 74, color: "#818cf8" },
              { lang: "Go", id: 60, color: "#22d3ee" },
              { lang: "Rust", id: 73, color: "#fb923c" },
              { lang: "C", id: 50, color: "#a8a29e" },
            ].map(({ lang, id, color }) => (
              <div
                key={lang}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color }}
                  >
                    {lang}
                  </span>
                </div>
                <span className="font-mono text-[9px] text-zinc-600">
                  #{id}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader
            num="06"
            icon={<Network size={13} />}
            title="WebSocket Protocol"
          />
          <Table
            headers={["Message Type", "Direction", "Description"]}
            rows={[
              ["join", "Client → Server", "Register presence on connect"].map(
                (v, i) => (
                  <span
                    key={i}
                    className={
                      i === 0
                        ? "text-indigo-400 font-bold"
                        : i === 1
                          ? "text-zinc-500"
                          : "text-zinc-400"
                    }
                  >
                    {v}
                  </span>
                ),
              ),
              [
                "online_users",
                "Server → All",
                "Broadcast connected user list",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "challenge",
                "Client → Server",
                "Send duel challenge with difficulty + mode",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "challenge_received",
                "Server → Client",
                "Notify target of incoming challenge",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "challenge_response",
                "Client → Server",
                "Accept or decline a challenge",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "ready",
                "Client → Server",
                "Signal ready state in duel room",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "ready_update",
                "Server → All",
                "Broadcast ready count for contest",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              [
                "duel_start",
                "Server → All",
                "Both ready — start countdown",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-indigo-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              ["won", "Client → Server", "Notify opponent of win"].map(
                (v, i) => (
                  <span
                    key={i}
                    className={
                      i === 0
                        ? "text-emerald-400 font-bold"
                        : i === 1
                          ? "text-zinc-500"
                          : "text-zinc-400"
                    }
                  >
                    {v}
                  </span>
                ),
              ),
              [
                "opponent_won",
                "Server → Client",
                "Tell loser opponent has won",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-emerald-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
              ["leave", "Client → Server", "Player leaves mid-duel"].map(
                (v, i) => (
                  <span
                    key={i}
                    className={
                      i === 0
                        ? "text-rose-400 font-bold"
                        : i === 1
                          ? "text-zinc-500"
                          : "text-zinc-400"
                    }
                  >
                    {v}
                  </span>
                ),
              ),
              [
                "opponent_left",
                "Server → Client",
                "Notify remaining player of forfeit",
              ].map((v, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? "text-rose-400 font-bold"
                      : i === 1
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }
                >
                  {v}
                </span>
              )),
            ]}
          />
        </section>

        <section>
          <SectionHeader
            num="07"
            icon={<GitBranch size={13} />}
            title="API Endpoints"
          />
          <Table
            headers={["Method", "Endpoint", "Description"]}
            rows={[
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/users</span>,
                <span className="text-zinc-500">
                  All users sorted by rating
                </span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/users/:id</span>,
                <span className="text-zinc-500">Single user profile</span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/users/:id/history</span>,
                <span className="text-zinc-500">User rating history</span>,
              ],
              [
                <MethodBadge method="POST" />,
                <span className="text-zinc-300">/api/users</span>,
                <span className="text-zinc-500">Create new user node</span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/contests</span>,
                <span className="text-zinc-500">All contest logs</span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/contests/:id</span>,
                <span className="text-zinc-500">Single contest detail</span>,
              ],
              [
                <MethodBadge method="POST" />,
                <span className="text-zinc-300">/api/contests</span>,
                <span className="text-zinc-500">Create new contest</span>,
              ],
              [
                <MethodBadge method="POST" />,
                <span className="text-zinc-300">
                  /api/contests/:id/finalize
                </span>,
                <span className="text-zinc-500">
                  Finalize and update ratings
                </span>,
              ],
              [
                <MethodBadge method="DELETE" />,
                <span className="text-zinc-300">/api/contests/:id</span>,
                <span className="text-zinc-500">
                  Delete contest (admin only)
                </span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">
                  /api/problems/random?difficulty=
                </span>,
                <span className="text-zinc-500">Random LeetCode problem</span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/stats</span>,
                <span className="text-zinc-500">
                  System stats + live node count
                </span>,
              ],
              [
                <MethodBadge method="GET" />,
                <span className="text-zinc-300">/api/health</span>,
                <span className="text-zinc-500">Backend health check</span>,
              ],
              [
                <MethodBadge method="WS" />,
                <span className="text-zinc-300">/api/ws</span>,
                <span className="text-zinc-500">
                  WebSocket connection endpoint
                </span>,
              ],
            ]}
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <SectionHeader
              num="08"
              icon={<Terminal size={13} />}
              title="Technology Stack"
            />
            <div className="rounded-xl border border-zinc-800 overflow-hidden">
              {[
                {
                  dot: "bg-zinc-500",
                  label: "Frontend",
                  value: "Next.js 15 · TypeScript · Tailwind",
                },
                {
                  dot: "bg-cyan-500",
                  label: "Backend",
                  value: "Go (Golang) · Gin Framework",
                },
                {
                  dot: "bg-emerald-500",
                  label: "Database",
                  value: "PostgreSQL via Supabase",
                },
                {
                  dot: "bg-indigo-500",
                  label: "Auth",
                  value: "Clerk (JWT-based)",
                },
                {
                  dot: "bg-amber-500",
                  label: "Code Execution",
                  value: "Judge0",
                },
                {
                  dot: "bg-rose-500",
                  label: "Problems",
                  value: "LeetCode GraphQL API",
                },
                {
                  dot: "bg-purple-500",
                  label: "Realtime",
                  value: "WebSocket (gorilla/websocket)",
                },
                {
                  dot: "bg-teal-500",
                  label: "Deployment",
                  value: "Vercel + Render",
                },
              ].map(({ dot, label, value }, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/40"} border-b border-zinc-800/50 last:border-0`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`}
                  />
                  <span className="text-zinc-300 font-mono text-xs font-bold w-28">
                    {label}
                  </span>
                  <span className="text-zinc-500 font-mono text-xs">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              num="09"
              icon={<Database size={13} />}
              title="Database Schemas"
            />
            <div className="space-y-3">
              {[
                {
                  name: "Users",
                  fields: [
                    "id",
                    "name",
                    "image_url",
                    "current_rating",
                    "max_rating",
                    "contests_played",
                    "tier",
                  ],
                },
                {
                  name: "Contests",
                  fields: [
                    "id",
                    "name",
                    "total_participants",
                    "finalized",
                    "created_at",
                  ],
                },
                {
                  name: "RatingHistory",
                  fields: [
                    "user_id",
                    "contest_id",
                    "old_rating",
                    "new_rating",
                    "performance_rating",
                    "rank",
                    "percentile",
                    "rating_change",
                  ],
                },
              ].map(({ name, fields }) => (
                <div
                  key={name}
                  className="rounded-xl border border-zinc-800 overflow-hidden"
                >
                  <div className="px-5 py-2.5 bg-zinc-900 border-b border-zinc-800">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      {name}
                    </span>
                  </div>
                  <div className="px-5 py-3 bg-zinc-950 flex flex-wrap gap-1.5">
                    {fields.map((f) => (
                      <span
                        key={f}
                        className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            num="10"
            icon={<Shield size={13} />}
            title="Security"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: "Authentication",
                body: "All users authenticated via Clerk. JWT tokens verified server-side on protected routes.",
                color: "#818cf8",
              },
              {
                title: "Admin Routes",
                body: "DELETE endpoints require both a valid Clerk JWT and a public metadata role of 'admin'.",
                color: "#f87171",
              },
              {
                title: "Immutable Logs",
                body: "Rating history is append-only. Once finalized, contest results cannot be altered via the API.",
                color: "#34d399",
              },
            ].map(({ title, body, color }) => (
              <div
                key={title}
                className="rounded-xl border border-zinc-800 overflow-hidden"
                style={{ borderColor: `${color}20` }}
              >
                <div
                  className="px-5 py-2.5 border-b"
                  style={{
                    background: `${color}08`,
                    borderColor: `${color}20`,
                  }}
                >
                  <span
                    className="font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{ color }}
                  >
                    {title}
                  </span>
                </div>
                <div className="px-5 py-4 bg-zinc-950">
                  <p className="text-zinc-500 font-mono text-xs leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
