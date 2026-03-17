"use client";

import { useEffect, useState } from "react";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["700", "900"] });
const API = process.env.NEXT_PUBLIC_API_URL || "";

const TIER_COLOR: Record<string, string> = {
  newbie: "#71717a",
  apprentice: "#34d399",
  specialist: "#22d3ee",
  expert: "#818cf8",
  master: "#fbbf24",
  grandmaster: "#f87171",
};
const DIFF_COLOR: Record<string, string> = {
  Easy: "#4ade80",
  Medium: "#fbbf24",
  Hard: "#f87171",
};
const LANG_COLOR: Record<string, string> = {
  python: "#3b82f6",
  cpp: "#8b5cf6",
  javascript: "#f59e0b",
  rust: "#f97316",
  go: "#22d3ee",
  java: "#ef4444",
  typescript: "#60a5fa",
};
const BADGE_RARITY: Record<string, string> = {
  common: "#71717a",
  rare: "#3b82f6",
  epic: "#8b5cf6",
  legendary: "#f59e0b",
};

interface HeatCell {
  date: string;
  count: number;
}
interface DuelLog {
  id: string;
  opponent: string;
  result: "won" | "lost";
  problem_title: string;
  elo_change: number;
  ended_at: string;
  difficulty: string;
}
interface Badge {
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earned_at: string;
}
interface DiffBreakdown {
  difficulty: string;
  wins: number;
  losses: number;
}

function UplinkHeatmap({ data }: { data: HeatCell[] }) {
  const weeks = 52;
  const today = new Date();
  const cells: (HeatCell | null)[][] = [];

  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  for (let w = 0; w < weeks; w++) {
    const week: (HeatCell | null)[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (weeks - w) * 7 + d);
      if (date > today) {
        week.push(null);
        continue;
      }
      const dateStr = date.toISOString().split("T")[0];
      week.push({ date: dateStr, count: dataMap.get(dateStr) || 0 });
    }
    cells.push(week);
  }

  const getColor = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.04)";
    if (count === 1) return "rgba(34,211,238,0.25)";
    if (count === 2) return "rgba(34,211,238,0.5)";
    if (count >= 3) return "rgba(34,211,238,0.85)";
    return "rgba(34,211,238,1)";
  };

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
      <p className="text-[9px] text-cyan-400/80 font-mono uppercase tracking-[0.3em] mb-4">
        ⚡ Uplink Streak
      </p>
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {cells.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((cell, di) =>
              cell === null ? (
                <div key={di} className="w-2.5 h-2.5 rounded-[2px]" />
              ) : (
                <div
                  key={di}
                  className="w-2.5 h-2.5 rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                  style={{ background: getColor(cell.count) }}
                  title={`${cell.date}: ${cell.count} duel${cell.count !== 1 ? "s" : ""}`}
                />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[8px] text-zinc-600 font-mono">Less</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{ background: getColor(n) }}
          />
        ))}
        <span className="text-[8px] text-zinc-600 font-mono">More</span>
      </div>
    </div>
  );
}

function NodeMasteryRing({
  wins,
  losses,
  breakdown,
}: {
  wins: number;
  losses: number;
  breakdown: DiffBreakdown[];
}) {
  const total = wins + losses || 1;
  const winPct = (wins / total) * 100;
  const r = 54;
  const circ = 2 * Math.PI * r;
  const winArc = (winPct / 100) * circ;

  const easyWins = breakdown.find((b) => b.difficulty === "Easy")?.wins || 0;
  const medWins = breakdown.find((b) => b.difficulty === "Medium")?.wins || 0;
  const hardWins = breakdown.find((b) => b.difficulty === "Hard")?.wins || 0;

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
      <p className="text-[9px] text-indigo-400/80 font-mono uppercase tracking-[0.3em] mb-4">
        ◎ Node Mastery
      </p>
      <div className="flex items-center gap-8">
        <div className="relative">
          <svg width={128} height={128} viewBox="0 0 128 128">
            <circle
              cx={64}
              cy={64}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={10}
            />
            <circle
              cx={64}
              cy={64}
              r={r}
              fill="none"
              stroke="#4ade80"
              strokeWidth={10}
              strokeDasharray={`${winArc} ${circ}`}
              strokeLinecap="round"
              transform="rotate(-90 64 64)"
              style={{ filter: "drop-shadow(0 0 6px rgba(74,222,128,0.6))" }}
            />
            <text
              x={64}
              y={60}
              textAnchor="middle"
              fill="#fff"
              fontSize={22}
              fontWeight={900}
              fontFamily="monospace"
            >
              {Math.round(winPct)}%
            </text>
            <text
              x={64}
              y={78}
              textAnchor="middle"
              fill="#52525b"
              fontSize={10}
              fontFamily="monospace"
            >
              WIN RATE
            </text>
          </svg>
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mb-1">
            Difficulty breakdown
          </div>
          {[
            { label: "Easy", wins: easyWins, color: "#4ade80" },
            { label: "Medium", wins: medWins, color: "#fbbf24" },
            { label: "Hard", wins: hardWins, color: "#f87171" },
          ].map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <span
                className="text-[9px] font-mono"
                style={{ color: d.color, minWidth: 44 }}
              >
                {d.label}
              </span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (d.wins / (wins || 1)) * 100)}%`,
                    background: d.color,
                    boxShadow: `0 0 6px ${d.color}80`,
                  }}
                />
              </div>
              <span className="text-[9px] text-zinc-500 font-mono min-w-[24px] text-right">
                {d.wins}W
              </span>
            </div>
          ))}
          <div className="flex gap-4 mt-1">
            <div className="text-center">
              <p className="text-[9px] text-zinc-500 font-mono uppercase">
                Wins
              </p>
              <p className="text-lg font-black text-emerald-400 font-mono">
                {wins}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-zinc-500 font-mono uppercase">
                Losses
              </p>
              <p className="text-lg font-black text-rose-400 font-mono">
                {losses}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentSkirmishes({ duels }: { duels: DuelLog[] }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
      <p className="text-[9px] text-rose-400/80 font-mono uppercase tracking-[0.3em] mb-4">
        ⚔ Recent Skirmishes
      </p>
      <div className="flex flex-col gap-2">
        {duels.slice(0, 8).map((d) => (
          <div
            key={d.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{
              background:
                d.result === "won"
                  ? "rgba(74,222,128,0.04)"
                  : "rgba(248,113,113,0.04)",
              border: `1px solid ${d.result === "won" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)"}`,
            }}
          >
            <span
              className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded"
              style={{
                background:
                  d.result === "won"
                    ? "rgba(74,222,128,0.15)"
                    : "rgba(248,113,113,0.15)",
                color: d.result === "won" ? "#4ade80" : "#f87171",
              }}
            >
              {d.result === "won" ? "WIN" : "LOSS"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white font-mono font-bold truncate">
                vs {d.opponent}
              </p>
              <p className="text-[9px] text-zinc-500 font-mono truncate">
                {d.problem_title}
              </p>
            </div>
            <span
              className="text-[8px] px-1.5 py-0.5 rounded font-mono"
              style={{
                background: `${DIFF_COLOR[d.difficulty]}15`,
                color: DIFF_COLOR[d.difficulty],
              }}
            >
              {d.difficulty}
            </span>
            <span
              className="text-[10px] font-bold font-mono min-w-[36px] text-right"
              style={{ color: d.elo_change > 0 ? "#4ade80" : "#f87171" }}
            >
              {d.elo_change > 0 ? "+" : ""}
              {d.elo_change}
            </span>
            <span className="text-[8px] text-zinc-600 font-mono min-w-[52px] text-right">
              {new Date(d.ended_at).toLocaleDateString()}
            </span>
          </div>
        ))}
        {duels.length === 0 && (
          <p className="text-[10px] text-zinc-600 font-mono text-center py-4">
            No skirmishes recorded yet
          </p>
        )}
      </div>
    </div>
  );
}

function Cybernetics({ badges }: { badges: Badge[] }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5">
      <p className="text-[9px] text-amber-400/80 font-mono uppercase tracking-[0.3em] mb-4">
        ◈ Cybernetics
      </p>
      <div className="flex flex-wrap gap-3">
        {badges.map((b) => (
          <div
            key={b.name}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl w-20"
            style={{
              background: `${BADGE_RARITY[b.rarity] || "#71717a"}10`,
              border: `1px solid ${BADGE_RARITY[b.rarity] || "#71717a"}30`,
            }}
          >
            <span className="text-2xl">{b.icon}</span>
            <span className="text-[8px] text-white font-mono font-bold text-center leading-tight">
              {b.name}
            </span>
            <span
              className="text-[7px] font-mono uppercase tracking-wide"
              style={{ color: BADGE_RARITY[b.rarity] || "#71717a" }}
            >
              {b.rarity}
            </span>
          </div>
        ))}
        {badges.length === 0 && (
          <p className="text-[10px] text-zinc-600 font-mono">
            No cybernetics installed yet
          </p>
        )}
      </div>
    </div>
  );
}

export default function HackerDashboard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}users/${userId}/profile`)
      .then((r) => r.json())
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return (
      <div className="min-h-screen bg-[#05060b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!profile) return null;

  const user = profile.user || {};
  const tier = user.tier || "newbie";
  const tierColor = TIER_COLOR[tier] || "#71717a";
  const langs: string[] = user.preferred_languages || [];

  return (
    <div className="min-h-screen bg-[#05060b] font-mono py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-6 flex items-start gap-6">
          <div className="relative">
            <img
              src={
                user.image_url ||
                `https://ui-avatars.com/api/?name=${user.username}&background=09090b&color=fff&size=96&bold=true`
              }
              alt={user.username}
              className="w-20 h-20 rounded-2xl object-cover border-2"
              style={{ borderColor: `${tierColor}40` }}
            />
            <div
              className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider"
              style={{
                background: `${tierColor}20`,
                border: `1px solid ${tierColor}40`,
                color: tierColor,
              }}
            >
              {tier}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1
                className={`${orbitron.className} text-2xl font-black text-white uppercase`}
              >
                {user.username}
              </h1>
              <span
                className="text-[9px] px-2 py-0.5 rounded border font-mono"
                style={{
                  borderColor: "rgba(255,255,255,0.1)",
                  color: "#52525b",
                }}
              >
                #{user.global_rank || "?"}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 mb-3">
              {user.bio || "No bio uploaded."}
            </p>
            <div className="flex flex-wrap gap-2">
              {langs.map((lang) => (
                <span
                  key={lang}
                  className="text-[8px] px-2 py-1 rounded font-bold uppercase tracking-widest font-mono"
                  style={{
                    background: `${LANG_COLOR[lang] || "#71717a"}15`,
                    border: `1px solid ${LANG_COLOR[lang] || "#71717a"}40`,
                    color: LANG_COLOR[lang] || "#71717a",
                    boxShadow: `0 0 8px ${LANG_COLOR[lang] || "#71717a"}20`,
                  }}
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p
              className={`${orbitron.className} text-4xl font-black text-white`}
            >
              {user.current_rating}
            </p>
            <p className="text-[8px] text-zinc-600 font-mono uppercase tracking-widest mt-1">
              ELO Rating
            </p>
            <p
              className="text-[9px] font-mono mt-2"
              style={{ color: tierColor }}
            >
              {tier.toUpperCase()}
            </p>
          </div>
        </div>

        <UplinkHeatmap data={profile.heatmap_data || []} />

        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-1">
            <NodeMasteryRing
              wins={user.wins || 0}
              losses={user.losses || 0}
              breakdown={profile.difficulty_breakdown || []}
            />
          </div>
          <div className="col-span-2">
            <RecentSkirmishes duels={profile.recent_duels || []} />
          </div>
        </div>

        <Cybernetics badges={profile.badges || []} />
      </div>
    </div>
  );
}
