"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/?$/, "/");

type TeamContest = {
  id: string;
  name: string;
  mode: string;
  team_size: number;
  duration_sec: number;
  started_at: string;
  finalized: boolean;
};

type Team = {
  id: string;
  contest_id: string;
  team_name: string;
  team_number: number;
};

type Member = {
  id: number;
  team_id: string;
  user_id: string;
  is_captain: boolean;
};

type Problem = {
  id: number;
  contest_id: string;
  problem_slug: string;
  position: number;
};

type ScoreRow = {
  rank: number;
  team_id: string;
  team_name: string;
  team_number: number;
  solved: number;
  penalty: number;
};

export default function TeamContestPage() {
  const params = useParams();
  const contestID = params?.id as string;

  const [contest, setContest] = useState<TeamContest | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [teamID, setTeamID] = useState("");
  const [problemSlug, setProblemSlug] = useState("");
  const [verdict, setVerdict] = useState("WA");
  const [submitting, setSubmitting] = useState(false);

  const membersByTeam = useMemo(() => {
    const m = new Map<string, Member[]>();
    for (const row of members) {
      const prev = m.get(row.team_id) || [];
      prev.push(row);
      m.set(row.team_id, prev);
    }
    return m;
  }, [members]);

  const loadContest = async () => {
    setError("");
    try {
      const [a, b] = await Promise.all([
        fetch(`${API}team-contests/${contestID}`),
        fetch(`${API}team-contests/${contestID}/scoreboard`),
      ]);
      const contestData = await a.json();
      const scoreData = await b.json();
      if (!a.ok) throw new Error(contestData?.error || "Failed to load contest");
      if (!b.ok) throw new Error(scoreData?.error || "Failed to load scoreboard");

      setContest(contestData.contest);
      setTeams(contestData.teams || []);
      setMembers(contestData.members || []);
      setProblems(contestData.problems || []);
      setScoreboard(scoreData.scoreboard || []);

      if (!teamID && contestData.teams?.[0]?.id) setTeamID(contestData.teams[0].id);
      if (!problemSlug && contestData.problems?.[0]?.problem_slug) {
        setProblemSlug(contestData.problems[0].problem_slug);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContest();
    const timer = setInterval(loadContest, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestID]);

  const submitVerdict = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}team-contests/${contestID}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_id: teamID,
          problem_slug: problemSlug,
          verdict,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed");
      await loadContest();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const finalizeContest = async () => {
    setError("");
    try {
      const res = await fetch(`${API}team-contests/${contestID}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Finalize failed");
      await loadContest();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Finalize failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        Loading team contest...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{contest?.name || "Team Contest"}</h1>
            <p className="text-zinc-400 text-sm">
              Mode: {contest?.mode} | Finalized: {contest?.finalized ? "Yes" : "No"}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/team-contests/new" className="text-sm text-indigo-400 hover:text-indigo-300">
              New 3v3
            </Link>
            <Link href="/arena" className="text-sm text-indigo-400 hover:text-indigo-300">
              Arena
            </Link>
          </div>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold mb-3">Teams</h2>
            <div className="space-y-3">
              {teams.map((t) => (
                <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="font-medium">
                    Team {t.team_number}: {t.team_name}
                  </div>
                  <ul className="mt-2 text-sm text-zinc-300 space-y-1">
                    {(membersByTeam.get(t.id) || []).map((m) => (
                      <li key={m.id}>
                        {m.user_id} {m.is_captain ? "(Captain)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <h2 className="font-semibold mb-3">Problems</h2>
            <div className="space-y-2">
              {problems.map((p) => (
                <div key={p.id} className="rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm">
                  #{p.position} - {p.problem_slug}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <h2 className="font-semibold mb-3">ICPC Scoreboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-zinc-400">
                <tr>
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-left py-2">Solved</th>
                  <th className="text-left py-2">Penalty</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((r) => (
                  <tr key={r.team_id} className="border-t border-zinc-800">
                    <td className="py-2">{r.rank}</td>
                    <td className="py-2">{r.team_name}</td>
                    <td className="py-2">{r.solved}</td>
                    <td className="py-2">{r.penalty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <h2 className="font-semibold">Submit Verdict</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <select
              value={teamID}
              onChange={(e) => setTeamID(e.target.value)}
              className="rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  Team {t.team_number} - {t.team_name}
                </option>
              ))}
            </select>
            <select
              value={problemSlug}
              onChange={(e) => setProblemSlug(e.target.value)}
              className="rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.problem_slug}>
                  {p.problem_slug}
                </option>
              ))}
            </select>
            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              className="rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
            >
              {["WA", "TLE", "RE", "CE", "AC"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitVerdict}
              disabled={submitting || !teamID || !problemSlug}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm font-semibold"
            >
              {submitting ? "Submitting..." : "Submit Verdict"}
            </button>
            <button
              onClick={finalizeContest}
              className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-sm font-semibold"
            >
              Finalize Contest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
