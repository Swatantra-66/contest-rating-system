"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Trophy, Activity, Hash, ArrowLeft } from "lucide-react";
import { Orbitron } from "next/font/google";

const futuristicFont = Orbitron({ subsets: ["latin"], weight: ["700"] });

interface User {
  id: string;
  name: string;
  current_rating: number;
  max_rating: number;
  contests_played: number;
  tier: string;
}

interface RatingHistory {
  contest_id: string;
  contest_name: string;
  rank: number;
  rating_change: number;
  performance_rating: number;
  new_rating: number;
  old_rating: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: RatingHistory & { rating: number; index: number } }[];
}

const getTierColor = (tier: string) => {
  const t = tier?.toLowerCase() || "";
  if (t.includes("grandmaster"))
    return "text-rose-500 border-rose-900/50 bg-rose-950/30";
  if (t.includes("master"))
    return "text-purple-400 border-purple-900/50 bg-purple-950/30";
  if (t.includes("expert"))
    return "text-blue-400 border-blue-900/50 bg-blue-950/30";
  if (t.includes("specialist"))
    return "text-cyan-400 border-cyan-900/50 bg-cyan-950/30";
  if (t.includes("apprentice"))
    return "text-emerald-400 border-emerald-900/50 bg-emerald-950/30";
  return "text-zinc-400 border-zinc-700 bg-zinc-900";
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.rating_change >= 0;
    return (
      <div className="bg-zinc-950 p-3 border border-zinc-800 rounded-md shadow-lg text-zinc-100 font-mono text-sm">
        <p className="font-semibold text-zinc-300 mb-2 border-b border-zinc-800 pb-2">
          {data.contest_name
            ? data.contest_name.replace(/^1v1:\s*/i, "")
            : "Match"}
        </p>
        <div className="space-y-1">
          <p className="text-zinc-500">
            Rank: <span className="text-zinc-100">#{data.rank}</span>
          </p>
          <p className="text-zinc-500">
            Rating: <span className="text-zinc-100">{data.rating}</span>
          </p>
          <p className="text-zinc-500">
            Change:{" "}
            <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
              {isPositive ? "+" : ""}
              {data.rating_change}
            </span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<RatingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const userRes = await fetch(`${API_URL}users/${userId}`);
        if (!userRes.ok)
          throw new Error(
            userRes.status === 404
              ? "User not found"
              : "Backend connection failed",
          );
        const userData = await userRes.json();

        const histRes = await fetch(`${API_URL}users/${userId}/history`);
        if (!histRes.ok) throw new Error("History fetch failed");
        const histData = await histRes.json();

        setUser(userData);
        setHistory(Array.isArray(histData) ? histData : []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Critical system failure",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, API_URL]);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-500 font-mono text-sm">
        Fetching encrypted profile data...
      </div>
    );

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-mono border border-red-900/50 px-4 py-2 rounded-md bg-red-950/20">
            ERR: {error}
          </p>
          <Link
            href="/"
            className="text-zinc-500 text-xs hover:text-zinc-300 underline underline-offset-4"
          >
            Return to Terminal
          </Link>
        </div>
      </div>
    );

  if (!user) return null;

  const sortedHistory = [...history].reverse();

  const chartData = sortedHistory.map((h, i) => ({
    ...h,
    rating: h.new_rating,
    index: i + 1,
    label: `#${i + 1}`,
  }));

  if (chartData.length > 0) {
    chartData.unshift({
      ...chartData[0],
      contest_id: "start",
      contest_name: "Starting Rating",
      rank: 0,
      rating_change: 0,
      performance_rating: 0,
      new_rating: sortedHistory[0]?.old_rating || 1000,
      old_rating: sortedHistory[0]?.old_rating || 1000,
      rating: sortedHistory[0]?.old_rating || 1000,
      index: 0,
      label: "Start",
    });
  }

  const allRatings = chartData.map((d) => d.rating);
  const minRating = Math.max(0, Math.min(...allRatings) - 100);
  const maxRating = Math.max(...allRatings) + 100;

  const dotColor = (entry: { rating_change?: number }) =>
    !entry.rating_change
      ? "#52525b"
      : entry.rating_change > 0
        ? "#4ade80"
        : "#f87171";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-700">
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 w-fit text-zinc-500 hover:text-indigo-400 transition-all text-xs font-mono font-bold uppercase tracking-[0.2em] my-8 group"
          >
            <ArrowLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Return to Directory
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-mono font-bold border rounded-sm ${getTierColor(user.tier)}`}
            >
              {user.tier || "Unranked"}
            </div>
            <span className="font-medium text-sm tracking-tight text-zinc-300">
              {user.name}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="border-b border-zinc-800/60 pb-8">
          <h1
            className={`${futuristicFont.className} text-3xl text-white tracking-widest uppercase`}
          >
            Node<span className="text-zinc-600"> Profile</span>
          </h1>
          <p className="text-zinc-500 text-[10px] mt-3 font-mono uppercase tracking-[0.3em]">
            Internal ID <span className="text-zinc-400 ml-2">{user.id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: "Rating",
              value: user.current_rating,
              icon: <Activity className="text-zinc-700 w-4 h-4" />,
            },
            {
              label: "Peak",
              value: user.max_rating,
              icon: <Trophy className="text-amber-500/50 w-4 h-4" />,
            },
            {
              label: "Played",
              value: user.contests_played,
              icon: <Hash className="text-zinc-700 w-4 h-4" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-md hover:border-zinc-700 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                  {stat.label}
                </span>
                {stat.icon}
              </div>
              <span className="mt-3 block text-3xl font-mono text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-md">
          <h3 className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-8">
            Performance Trajectory
          </h3>
          {chartData.length <= 1 ? (
            <div className="h-[320px] flex items-center justify-center text-zinc-700 font-mono text-xs uppercase tracking-widest">
              Play more matches to see your trajectory
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#18181b"
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fill: "#3f3f46",
                      fontSize: 9,
                      fontFamily: "ui-monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[minRating, maxRating]}
                    tick={{
                      fill: "#3f3f46",
                      fontSize: 9,
                      fontFamily: "ui-monospace",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <ReferenceLine
                    y={1000}
                    stroke="#27272a"
                    strokeDasharray="4 4"
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#27272a", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color = dotColor(payload);
                      return (
                        <circle
                          key={`dot-${props.index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={color}
                          stroke="#09090b"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 5, fill: "#ffffff", strokeWidth: 0 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-md overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/40 flex items-center gap-2">
            <Activity size={14} className="text-indigo-500" />
            <h3 className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-zinc-400">
              Recent Terminal Bouts
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[9px] uppercase tracking-widest text-zinc-600 border-b border-zinc-900 bg-zinc-900/20">
                  <th className="p-4">Bout Designation</th>
                  <th className="p-4 text-center">Rank</th>
                  <th className="p-4 text-center">Rating Change</th>
                  <th className="p-4 text-right">Final Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {history.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-zinc-700 font-mono text-[10px] uppercase tracking-widest"
                    >
                      No Match Data Synchronized
                    </td>
                  </tr>
                ) : (
                  history.map((bout, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-zinc-800/10 transition-colors"
                    >
                      <td className="p-4 font-bold text-zinc-100 uppercase tracking-tight text-[11px]">
                        {bout.contest_name
                          ? bout.contest_name.replace(/^1v1:\s*/i, "")
                          : "UNREGISTERED_BOUT"}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bout.rank === 1 ? "bg-emerald-950/30 text-emerald-500 border-emerald-900/50" : "bg-zinc-900 text-zinc-600 border-zinc-800"}`}
                        >
                          #{bout.rank}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-center font-mono text-[11px] font-bold ${bout.rating_change >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                      >
                        {bout.rating_change >= 0 ? "+" : ""}
                        {bout.rating_change}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-zinc-100">
                        {bout.new_rating}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
