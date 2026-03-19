"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/?$/, "/");

type TeamInput = {
  team_name: string;
  member_ids: string[];
  captain_id: string;
};

export default function NewTeamContestPage() {
  const router = useRouter();
  const [name, setName] = useState("ICPC 3v3 Room");
  const [durationSec, setDurationSec] = useState(7200);
  const [problemSlugs, setProblemSlugs] = useState("two-sum,valid-parentheses");
  const [teamA, setTeamA] = useState<TeamInput>({
    team_name: "Team Alpha",
    member_ids: ["", "", ""],
    captain_id: "",
  });
  const [teamB, setTeamB] = useState<TeamInput>({
    team_name: "Team Beta",
    member_ids: ["", "", ""],
    captain_id: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setMember = (
    which: "a" | "b",
    idx: number,
    value: string,
  ) => {
    const updater = which === "a" ? setTeamA : setTeamB;
    updater((prev) => {
      const next = [...prev.member_ids];
      next[idx] = value.trim();
      return { ...prev, member_ids: next };
    });
  };

  const onCreate = async () => {
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        mode: "icpc_3v3",
        duration_sec: durationSec,
        team_a: {
          team_name: teamA.team_name.trim(),
          member_ids: teamA.member_ids.map((x) => x.trim()),
          captain_id: teamA.captain_id.trim(),
        },
        team_b: {
          team_name: teamB.team_name.trim(),
          member_ids: teamB.member_ids.map((x) => x.trim()),
          captain_id: teamB.captain_id.trim(),
        },
        problem_slugs: problemSlugs
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
      };

      const res = await fetch(`${API}team-contests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to create contest");
        return;
      }
      router.push(`/team-contests/${data.id}`);
    } catch {
      setError("Network error while creating contest");
    } finally {
      setSubmitting(false);
    }
  };

  const teamForm = (
    title: string,
    team: TeamInput,
    which: "a" | "b",
    setTeam: React.Dispatch<React.SetStateAction<TeamInput>>,
  ) => (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
      <input
        value={team.team_name}
        onChange={(e) => setTeam((prev) => ({ ...prev, team_name: e.target.value }))}
        placeholder="Team name"
        className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
      />
      {[0, 1, 2].map((idx) => (
        <input
          key={idx}
          value={team.member_ids[idx]}
          onChange={(e) => setMember(which, idx, e.target.value)}
          placeholder={`Member ${idx + 1} user_id (UUID)`}
          className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
        />
      ))}
      <input
        value={team.captain_id}
        onChange={(e) => setTeam((prev) => ({ ...prev, captain_id: e.target.value }))}
        placeholder="Captain user_id (must be one of above)"
        className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Create 3v3 ICPC Contest</h1>
          <Link href="/arena" className="text-sm text-indigo-400 hover:text-indigo-300">
            Back to Arena
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contest name"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
          />
          <input
            type="number"
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            placeholder="Duration (seconds)"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
          />
          <input
            value={problemSlugs}
            onChange={(e) => setProblemSlugs(e.target.value)}
            placeholder="Problem slugs comma-separated"
            className="w-full rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {teamForm("Team A", teamA, "a", setTeamA)}
          {teamForm("Team B", teamB, "b", setTeamB)}
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          onClick={onCreate}
          disabled={submitting}
          className="px-5 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-sm font-semibold"
        >
          {submitting ? "Creating..." : "Create Contest"}
        </button>
      </div>
    </div>
  );
}
