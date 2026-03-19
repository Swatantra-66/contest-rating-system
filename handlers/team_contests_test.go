package handlers

import (
	"testing"
	"time"
)

func TestComputeICPCScoreboard(t *testing.T) {
	start := time.Date(2026, 3, 19, 10, 0, 0, 0, time.UTC)

	teams := []TeamContestTeam{
		{ID: "team-a", TeamName: "Alpha", TeamNumber: 1},
		{ID: "team-b", TeamName: "Beta", TeamNumber: 2},
	}
	problems := []TeamContestProblem{
		{ProblemSlug: "two-sum", Position: 1},
		{ProblemSlug: "valid-parentheses", Position: 2},
	}
	subs := []TeamContestSubmission{
		{
			TeamID:      "team-a",
			ProblemSlug: "two-sum",
			Verdict:     "WA",
			SubmittedAt: start.Add(10 * time.Minute),
		},
		{
			TeamID:      "team-a",
			ProblemSlug: "two-sum",
			Verdict:     "AC",
			SubmittedAt: start.Add(15 * time.Minute),
		},
		{
			TeamID:      "team-b",
			ProblemSlug: "two-sum",
			Verdict:     "AC",
			SubmittedAt: start.Add(20 * time.Minute),
		},
		{
			TeamID:      "team-b",
			ProblemSlug: "valid-parentheses",
			Verdict:     "AC",
			SubmittedAt: start.Add(25 * time.Minute),
		},
	}

	board := computeICPCScoreboard(start, teams, problems, subs)
	if len(board) != 2 {
		t.Fatalf("expected 2 teams in scoreboard, got %d", len(board))
	}

	// team-b should rank first: solved=2 beats team-a solved=1.
	if board[0].TeamID != "team-b" || board[0].Rank != 1 {
		t.Fatalf("unexpected first team: %+v", board[0])
	}
	if board[0].Solved != 2 {
		t.Fatalf("expected team-b solved=2, got %d", board[0].Solved)
	}

	if board[1].TeamID != "team-a" || board[1].Rank != 2 {
		t.Fatalf("unexpected second team: %+v", board[1])
	}
	if board[1].Penalty != 35 {
		t.Fatalf("expected team-a penalty=35 (15 + 1*20), got %d", board[1].Penalty)
	}
}

func TestComputeICPCScoreboardTieBreakByPenalty(t *testing.T) {
	start := time.Date(2026, 3, 19, 10, 0, 0, 0, time.UTC)
	teams := []TeamContestTeam{
		{ID: "x", TeamName: "X", TeamNumber: 1},
		{ID: "y", TeamName: "Y", TeamNumber: 2},
	}
	problems := []TeamContestProblem{
		{ProblemSlug: "p1", Position: 1},
	}
	subs := []TeamContestSubmission{
		{TeamID: "x", ProblemSlug: "p1", Verdict: "AC", SubmittedAt: start.Add(30 * time.Minute)},
		{TeamID: "y", ProblemSlug: "p1", Verdict: "WA", SubmittedAt: start.Add(5 * time.Minute)},
		{TeamID: "y", ProblemSlug: "p1", Verdict: "AC", SubmittedAt: start.Add(20 * time.Minute)},
	}

	board := computeICPCScoreboard(start, teams, problems, subs)
	if len(board) != 2 {
		t.Fatalf("expected 2 teams in scoreboard, got %d", len(board))
	}

	// both solved 1; x should win by lower penalty (30 vs y=40).
	if board[0].TeamID != "x" {
		t.Fatalf("expected team x first by lower penalty, got %s", board[0].TeamID)
	}
	if board[1].TeamID != "y" {
		t.Fatalf("expected team y second, got %s", board[1].TeamID)
	}
}
