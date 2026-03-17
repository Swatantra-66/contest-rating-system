package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type CodeReviewRequest struct {
	ProblemTitle   string `json:"problem_title"`
	ProblemContent string `json:"problem_content"`
	UserCode       string `json:"user_code"`
	Language       string `json:"language"`
	Won            bool   `json:"won"`
	TimeTaken      int    `json:"time_taken"`
	SubmissionID   string `json:"submission_id"`
}

type CodeReviewResult struct {
	TimeComplexity  string   `json:"time_complexity"`
	SpaceComplexity string   `json:"space_complexity"`
	QualityScore    int      `json:"quality_score"`
	Verdict         string   `json:"verdict"`
	Strengths       []string `json:"strengths"`
	Weaknesses      []string `json:"weaknesses"`
	Optimization    string   `json:"optimization"`
}

func (h *Handler) CyberJudgeReview(c *gin.Context) {
	var req CodeReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := map[bool]string{true: "WON", false: "LOST"}[req.Won]
	prompt := fmt.Sprintf(`You are the ORACLE — a ruthless AI judge inside EloNode, a cyberpunk competitive programming arena. You have zero tolerance for inefficiency. Your tone is cold, direct, and harsh like a hacker who has seen a million rookie mistakes.

Analyze the submitted code and respond ONLY with valid JSON in this exact structure:
{"time_complexity":"O(...)","space_complexity":"O(...)","quality_score":0,"verdict":"<one harsh sentence>","strengths":["..."],"weaknesses":["..."],"optimization":"<specific actionable improvement>"}

Rules:
- quality_score 0-40: rookie. 41-70: operative. 71-90: elite. 91-100: ghost-tier.
- Use terms like "Node", "rookie move", "brute-force peasant", "O(n²) is a death wish"
- Be specific — reference actual patterns from their code
- Never be encouraging. Be brutally honest.

Problem: %s
Constraints: %s
Language: %s
Result: %s in %ds

Code:
%s`,
		req.ProblemTitle, req.ProblemContent, req.Language, result, req.TimeTaken, req.UserCode)

	go func() {
		raw, err := callGemini(prompt)
		if err != nil {
			return
		}
		var review CodeReviewResult
		if err := json.Unmarshal([]byte(raw), &review); err != nil {
			return
		}
		if req.SubmissionID != "" {
			h.db.Exec(`UPDATE code_submissions SET ai_review=?, quality_score=?, time_complexity=?, space_complexity=? WHERE id=?`,
				raw, review.QualityScore, review.TimeComplexity, review.SpaceComplexity, req.SubmissionID)
		}
	}()

	reviewJSON, err := callGemini(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Oracle offline"})
		return
	}

	var result2 CodeReviewResult
	if err := json.Unmarshal([]byte(reviewJSON), &result2); err != nil {
		c.JSON(http.StatusOK, gin.H{"review": reviewJSON})
		return
	}
	c.JSON(http.StatusOK, result2)
}

type TestCaseGenRequest struct {
	ProblemID      string `json:"problem_id"`
	ProblemTitle   string `json:"problem_title"`
	ProblemContent string `json:"problem_content"`
	Constraints    string `json:"constraints"`
	InputFormat    string `json:"input_format"`
	PublicTestEx   string `json:"public_test_example"`
	MasterCodePy   string `json:"master_code_py"`
	Count          int    `json:"count"`
}

type GeneratedInput struct {
	ID       int    `json:"id"`
	Input    string `json:"input"`
	CaseType string `json:"case_type"`
}

func (h *Handler) MatrixForger(c *gin.Context) {
	var req TestCaseGenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Count == 0 {
		req.Count = 30
	}

	prompt := fmt.Sprintf(`You are a test case architect for a competitive programming judge.
Your ONLY job is to generate adversarial inputs that break naive solutions.
Respond ONLY with a valid JSON array. No explanation, no markdown, no preamble.

Focus on:
- Edge cases: empty arrays, single element, all same elements
- Boundary values: min/max constraints exactly
- Adversarial: worst-case patterns for brute force
- Large scale: max constraint inputs
- Special patterns: overflow-inducing, palindromes, alternating

Output format:
[{"id":1,"input":"<exact stdin>","case_type":"edge_empty"},...]

case_type values: edge_empty, edge_single, boundary_min, boundary_max,
adversarial_sorted, adversarial_negatives, large_scale, special_pattern

Problem: %s
Description: %s
Constraints: %s
Input format: %s
Public test example: %s

Generate exactly %d hidden test cases. No expected_output field.`,
		req.ProblemTitle, req.ProblemContent, req.Constraints,
		req.InputFormat, req.PublicTestEx, req.Count)

	raw, err := callGemini(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Matrix Forger offline"})
		return
	}

	var inputs []GeneratedInput
	if err := json.Unmarshal([]byte(raw), &inputs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse generated cases", "raw": raw})
		return
	}

	type SavedCase struct {
		Input          string `json:"input"`
		ExpectedOutput string `json:"expected_output"`
		CaseType       string `json:"case_type"`
	}

	var mu sync.Mutex
	var saved []SavedCase
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, 5)

	for _, tc := range inputs {
		wg.Add(1)
		go func(tc GeneratedInput) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			result, err := runCodeOnJudge0(req.MasterCodePy, "python3", tc.Input)
			if err != nil || result.Stderr != "" {
				return
			}

			mu.Lock()
			saved = append(saved, SavedCase{
				Input:          tc.Input,
				ExpectedOutput: result.Stdout,
				CaseType:       tc.CaseType,
			})
			mu.Unlock()
		}(tc)
	}
	wg.Wait()

	for _, s := range saved {
		h.db.Exec(`INSERT INTO test_cases (problem_id, input, expected_output, is_hidden, case_type) VALUES (?,?,?,true,?)`,
			req.ProblemID, s.Input, s.ExpectedOutput, s.CaseType)
	}

	h.db.Exec(`UPDATE problems SET hidden_cases_generated=true WHERE id=?`, req.ProblemID)

	c.JSON(http.StatusOK, gin.H{
		"generated": len(inputs),
		"saved":     len(saved),
		"discarded": len(inputs) - len(saved),
	})
}

type Judge0Result struct {
	Stdout string
	Stderr string
	Status string
}

func runCodeOnJudge0(code, language, stdin string) (*Judge0Result, error) {
	langIDs := map[string]int{"python3": 71, "cpp": 54, "javascript": 63}
	langID := langIDs[language]
	if langID == 0 {
		langID = 71
	}

	body, _ := json.Marshal(map[string]interface{}{
		"source_code": code, "language_id": langID, "stdin": stdin,
	})

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post("https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
		"application/json", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var data map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&data)

	stdout, _ := data["stdout"].(string)
	stderr, _ := data["stderr"].(string)
	status := ""
	if s, ok := data["status"].(map[string]interface{}); ok {
		status, _ = s["description"].(string)
	}
	return &Judge0Result{Stdout: stdout, Stderr: stderr, Status: status}, nil
}

type ProfileResponse struct {
	User                interface{} `json:"user"`
	HeatmapData         interface{} `json:"heatmap_data"`
	WinLoss             interface{} `json:"win_loss"`
	RecentDuels         interface{} `json:"recent_duels"`
	Badges              interface{} `json:"badges"`
	DifficultyBreakdown interface{} `json:"difficulty_breakdown"`
}

func (h *Handler) GetHackerProfile(c *gin.Context) {
	userID := c.Param("id")

	var wg sync.WaitGroup
	var mu sync.Mutex
	result := ProfileResponse{}

	wg.Add(5)

	go func() {
		defer wg.Done()
		var user map[string]interface{}
		h.db.Raw(`SELECT u.*, 
			(SELECT COUNT(*)+1 FROM users WHERE current_rating > u.current_rating) as global_rank
			FROM users u WHERE u.id = ?`, userID).Scan(&user)
		mu.Lock()
		result.User = user
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		var heatmap []map[string]interface{}
		h.db.Raw(`SELECT DATE(ended_at) as date, COUNT(*) as count 
			FROM matches WHERE (player1_id=? OR player2_id=?) 
			AND ended_at > NOW() - INTERVAL '1 year'
			GROUP BY DATE(ended_at) ORDER BY date`, userID, userID).Scan(&heatmap)
		mu.Lock()
		result.HeatmapData = heatmap
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		var duels []map[string]interface{}
		h.db.Raw(`SELECT m.id, m.difficulty, m.ended_at,
			CASE WHEN m.winner_id=? THEN 'won' ELSE 'lost' END as result,
			CASE WHEN m.player1_id=? THEN u2.username ELSE u1.username END as opponent,
			p.title as problem_title,
			rh.change as elo_change
			FROM matches m
			JOIN users u1 ON u1.id=m.player1_id
			JOIN users u2 ON u2.id=m.player2_id
			JOIN problems p ON p.id=m.problem_id
			LEFT JOIN rating_history rh ON rh.match_id=m.id AND rh.user_id=?
			WHERE m.player1_id=? OR m.player2_id=?
			ORDER BY m.ended_at DESC LIMIT 20`,
			userID, userID, userID, userID, userID).Scan(&duels)
		mu.Lock()
		result.RecentDuels = duels
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		var badges []map[string]interface{}
		h.db.Raw(`SELECT b.name, b.description, b.icon, b.rarity, ub.earned_at
			FROM user_badges ub JOIN badges b ON b.id=ub.badge_id
			WHERE ub.user_id=? ORDER BY ub.earned_at DESC`, userID).Scan(&badges)
		mu.Lock()
		result.Badges = badges
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		var breakdown []map[string]interface{}
		h.db.Raw(`SELECT m.difficulty,
			SUM(CASE WHEN m.winner_id=? THEN 1 ELSE 0 END) as wins,
			SUM(CASE WHEN m.winner_id!=? AND m.winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses
			FROM matches m WHERE m.player1_id=? OR m.player2_id=?
			GROUP BY m.difficulty`, userID, userID, userID, userID).Scan(&breakdown)
		mu.Lock()
		result.DifficultyBreakdown = breakdown
		mu.Unlock()
	}()

	wg.Wait()
	c.JSON(http.StatusOK, result)
}

type HintsGenRequest struct {
	ProblemID      string `json:"problem_id"`
	ProblemTitle   string `json:"problem_title"`
	ProblemContent string `json:"problem_content"`
}

func (h *Handler) GenerateHints(c *gin.Context) {
	var req HintsGenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	prompt := fmt.Sprintf(`You are a mentor inside EloNode. Generate exactly 3 progressive hints for this problem.
Respond ONLY with valid JSON:
{"hint_1":{"type":"intuition","content":"<what to think about, no algorithm names>"},"hint_2":{"type":"approach","content":"<algorithm approach, no code>"},"hint_3":{"type":"pseudocode","content":"<step-by-step pseudocode>"}}

Each hint must be strictly more revealing than the previous.
Hint 1: Never mention algorithm names. Only intuition and data structure suggestions.
Hint 2: Name the algorithm. Describe the full approach.
Hint 3: Complete pseudocode. User should code it directly.

Problem: %s
%s`, req.ProblemTitle, req.ProblemContent)

	raw, err := callGemini(prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Hint system offline"})
		return
	}

	var hints map[string]map[string]string
	if err := json.Unmarshal([]byte(raw), &hints); err != nil {
		c.JSON(http.StatusOK, gin.H{"raw": raw})
		return
	}

	for level, hint := range hints {
		lvl := map[string]int{"hint_1": 1, "hint_2": 2, "hint_3": 3}[level]
		h.db.Exec(`INSERT INTO hints (problem_id, level, hint_type, content) VALUES (?,?,?,?) ON CONFLICT DO NOTHING`,
			req.ProblemID, lvl, hint["type"], hint["content"])
	}

	c.JSON(http.StatusOK, hints)
}

func (h *Handler) GetHintByLevel(c *gin.Context) {
	problemID := c.Param("problem_id")
	level := c.Param("level")
	userID := c.Query("user_id")
	matchID := c.Query("match_id")

	var hint struct {
		ID      string `json:"id"`
		Level   int    `json:"level"`
		Type    string `json:"hint_type"`
		Content string `json:"content"`
	}
	if err := h.db.Raw(`SELECT id, level, hint_type, content FROM hints WHERE problem_id=? AND level=?`, problemID, level).Scan(&hint).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Hint not found"})
		return
	}

	if userID != "" {
		h.db.Exec(`INSERT INTO hint_unlocks (user_id, hint_id, match_id) VALUES (?,?,?) ON CONFLICT DO NOTHING`,
			userID, hint.ID, matchID)
	}

	c.JSON(http.StatusOK, hint)
}
