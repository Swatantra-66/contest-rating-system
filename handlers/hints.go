package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type HintRequest struct {
	ProblemSlug  string `json:"problem_slug" binding:"required"`
	ProblemTitle string `json:"problem_title"`
	Content      string `json:"content"`
	Examples     string `json:"examples"`
	MetaData     string `json:"meta_data"`
	Language     string `json:"language"`
	Code         string `json:"code"`
	ContestID    string `json:"contest_id"`
	UserID       string `json:"user_id"`
}

type AnalysisRequest struct {
	ProblemSlug  string `json:"problem_slug" binding:"required"`
	ProblemTitle string `json:"problem_title"`
	Content      string `json:"content" binding:"required"`
	Examples     string `json:"examples"`
	MetaData     string `json:"meta_data"`
	Language     string `json:"language"`
	Code         string `json:"code"`
	Result       string `json:"result"`
}

type geminiRequest struct {
	Contents []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"contents"`
	GenerationConfig struct {
		Temperature     float64 `json:"temperature"`
		MaxOutputTokens int     `json:"maxOutputTokens"`
	} `json:"generationConfig"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

const MaxHintsPerContest = 3

var hintUsageStore = struct {
	mu sync.Mutex
	m  map[string]int
}{
	m: make(map[string]int),
}

func (h *Handler) GenerateHint(c *gin.Context) {
	var req HintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hint request"})
		return
	}
	if strings.TrimSpace(req.ProblemSlug) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_slug is required"})
		return
	}
	if strings.TrimSpace(req.Content) == "" && strings.TrimSpace(req.ProblemTitle) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem content is missing"})
		return
	}

	usageKey := buildHintUsageKey(req, c.ClientIP())
	used := getHintUsage(usageKey)
	if used >= MaxHintsPerContest {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":           "hint limit reached for this contest",
			"hints_used":      used,
			"hints_remaining": 0,
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}

	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if apiKey == "" {
		used = incrementHintUsage(usageKey)
		c.JSON(http.StatusOK, gin.H{
			"hint":            buildFallbackHint(req),
			"source":          "fallback",
			"hints_used":      used,
			"hints_remaining": max(0, MaxHintsPerContest-used),
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}

	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-2.5-flash"
	}

	prompt := buildHintPrompt(req)
	payload := geminiRequest{}
	payload.GenerationConfig.Temperature = 0.35
	payload.GenerationConfig.MaxOutputTokens = 320
	payload.Contents = []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	}{
		{
			Parts: []struct {
				Text string `json:"text"`
			}{
				{Text: prompt},
			},
		},
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model)

	httpClient := &http.Client{Timeout: 25 * time.Second}
	request, _ := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("x-goog-api-key", apiKey)

	resp, err := httpClient.Do(request)
	if err != nil {
		used = incrementHintUsage(usageKey)
		c.JSON(http.StatusOK, gin.H{
			"hint":            buildFallbackHint(req),
			"source":          "fallback",
			"hints_used":      used,
			"hints_remaining": max(0, MaxHintsPerContest-used),
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		used = incrementHintUsage(usageKey)
		c.JSON(http.StatusOK, gin.H{
			"hint":            buildFallbackHint(req),
			"source":          "fallback",
			"hints_used":      used,
			"hints_remaining": max(0, MaxHintsPerContest-used),
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(respBody, &gemResp); err != nil {
		used = incrementHintUsage(usageKey)
		c.JSON(http.StatusOK, gin.H{
			"hint":            buildFallbackHint(req),
			"source":          "fallback",
			"hints_used":      used,
			"hints_remaining": max(0, MaxHintsPerContest-used),
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}

	hint := ""
	if len(gemResp.Candidates) > 0 {
		for _, p := range gemResp.Candidates[0].Content.Parts {
			if strings.TrimSpace(p.Text) != "" {
				if hint != "" {
					hint += "\n"
				}
				hint += p.Text
			}
		}
	}
	hint = strings.TrimSpace(hint)
	if hint == "" {
		used = incrementHintUsage(usageKey)
		c.JSON(http.StatusOK, gin.H{
			"hint":            buildFallbackHint(req),
			"source":          "fallback",
			"hints_used":      used,
			"hints_remaining": max(0, MaxHintsPerContest-used),
			"hint_limit":      MaxHintsPerContest,
		})
		return
	}

	used = incrementHintUsage(usageKey)

	c.JSON(http.StatusOK, gin.H{
		"hint":            hint,
		"hints_used":      used,
		"hints_remaining": max(0, MaxHintsPerContest-used),
		"hint_limit":      MaxHintsPerContest,
	})
}

func (h *Handler) HintHealth(c *gin.Context) {
	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-2.5-flash"
	}

	if apiKey == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status": "down",
			"error":  "GEMINI_API_KEY is not configured",
			"model":  model,
		})
		return
	}

	// Optional live ping: /api/hints/health?live=1
	if c.Query("live") == "1" {
		ok, detail := pingGemini(apiKey, model)
		if !ok {
			c.JSON(http.StatusBadGateway, gin.H{
				"status": "down",
				"error":  "gemini live ping failed",
				"detail": detail,
				"model":  model,
			})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":          "ok",
		"model":           model,
		"api_key_present": true,
		"live_checked":    c.Query("live") == "1",
	})
}

func (h *Handler) GenerateAnalysis(c *gin.Context) {
	var req AnalysisRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid analysis request"})
		return
	}

	apiKey := strings.TrimSpace(os.Getenv("GEMINI_API_KEY"))
	if apiKey == "" {
		c.JSON(http.StatusOK, gin.H{
			"analysis": buildFallbackAnalysis(req),
			"source":   "fallback",
		})
		return
	}

	model := strings.TrimSpace(os.Getenv("GEMINI_MODEL"))
	if model == "" {
		model = "gemini-2.5-flash"
	}

	prompt := buildAnalysisPrompt(req)
	payload := geminiRequest{}
	payload.GenerationConfig.Temperature = 0.25
	payload.GenerationConfig.MaxOutputTokens = 900
	payload.Contents = []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	}{
		{
			Parts: []struct {
				Text string `json:"text"`
			}{
				{Text: prompt},
			},
		},
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model)
	httpClient := &http.Client{Timeout: 30 * time.Second}
	request, _ := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("x-goog-api-key", apiKey)

	resp, err := httpClient.Do(request)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"analysis": buildFallbackAnalysis(req),
			"source":   "fallback",
		})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		c.JSON(http.StatusOK, gin.H{
			"analysis": buildFallbackAnalysis(req),
			"source":   "fallback",
		})
		return
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(respBody, &gemResp); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"analysis": buildFallbackAnalysis(req),
			"source":   "fallback",
		})
		return
	}

	analysis := ""
	if len(gemResp.Candidates) > 0 {
		for _, p := range gemResp.Candidates[0].Content.Parts {
			if strings.TrimSpace(p.Text) != "" {
				if analysis != "" {
					analysis += "\n"
				}
				analysis += p.Text
			}
		}
	}
	analysis = strings.TrimSpace(analysis)
	if analysis == "" {
		c.JSON(http.StatusOK, gin.H{
			"analysis": buildFallbackAnalysis(req),
			"source":   "fallback",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"analysis": analysis,
	})
}

func pingGemini(apiKey, model string) (bool, string) {
	payload := geminiRequest{}
	payload.GenerationConfig.Temperature = 0
	payload.GenerationConfig.MaxOutputTokens = 20
	payload.Contents = []struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	}{
		{
			Parts: []struct {
				Text string `json:"text"`
			}{{Text: `Reply with exactly: ok`}},
		},
	}

	body, _ := json.Marshal(payload)
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent", model)
	req, _ := http.NewRequest(http.MethodPost, url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-goog-api-key", apiKey)

	client := &http.Client{Timeout: 12 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, err.Error()
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return false, strings.TrimSpace(string(respBody))
	}
	return true, "ok"
}

func buildHintPrompt(req HintRequest) string {
	codeSnippet := strings.TrimSpace(req.Code)
	if len(codeSnippet) > 2500 {
		codeSnippet = codeSnippet[:2500] + "\n...[truncated]"
	}

	return fmt.Sprintf(`You are a coding coach.
Give a helpful hint for a competitive programming problem, but DO NOT provide full solution code.

Rules:
1) Give at most 3 short bullets.
2) Focus on strategy, edge cases, and time complexity.
3) If user code is present, mention one likely bug/risk in it.
4) Keep it concise and practical.

Problem slug: %s
Problem title: %s
Language: %s

Problem statement:
%s

Examples:
%s

Meta data:
%s

User code:
%s
`, req.ProblemSlug, req.ProblemTitle, req.Language, req.Content, req.Examples, req.MetaData, codeSnippet)
}

func buildHintUsageKey(req HintRequest, ip string) string {
	contest := strings.TrimSpace(req.ContestID)
	userID := strings.TrimSpace(req.UserID)
	if contest != "" && userID != "" {
		return "contest:" + contest + "|user:" + userID
	}
	return "ip:" + ip + "|problem:" + strings.TrimSpace(req.ProblemSlug)
}

func getHintUsage(key string) int {
	hintUsageStore.mu.Lock()
	defer hintUsageStore.mu.Unlock()
	return hintUsageStore.m[key]
}

func incrementHintUsage(key string) int {
	hintUsageStore.mu.Lock()
	defer hintUsageStore.mu.Unlock()
	hintUsageStore.m[key]++
	return hintUsageStore.m[key]
}

func buildAnalysisPrompt(req AnalysisRequest) string {
	codeSnippet := strings.TrimSpace(req.Code)
	if len(codeSnippet) > 5000 {
		codeSnippet = codeSnippet[:5000] + "\n...[truncated]"
	}
	result := strings.TrimSpace(req.Result)
	if result == "" {
		result = "unknown"
	}

	return fmt.Sprintf(`You are an expert coding interviewer and contest coach.
Provide a post-contest analysis like LeetCode editorials, but adapted to this user's context.

Output format (strict):
1) "Core Idea" (2-4 bullets)
2) "Step-by-Step Approach" (numbered)
3) "Complexity" (time + space, concise)
4) "Common Pitfalls" (2-4 bullets)
5) "How to Improve This Submission" (concrete feedback based on user code; if empty code, say what to start with)

Rules:
- Do NOT provide full final code.
- Keep it practical and contest-focused.
- Mention edge cases.
- Prefer concise explanations over long prose.

Contest result: %s
Problem slug: %s
Problem title: %s
Language: %s

Problem statement:
%s

Examples:
%s

Meta data:
%s

User code:
%s
`, result, req.ProblemSlug, req.ProblemTitle, req.Language, req.Content, req.Examples, req.MetaData, codeSnippet)
}

func buildFallbackHint(req HintRequest) string {
	title := strings.TrimSpace(req.ProblemTitle)
	if title == "" {
		title = req.ProblemSlug
	}
	return fmt.Sprintf(`Hint for %s:
- Start with a brute-force approach first, then identify repeated work to optimize.
- Write down 2-3 edge cases (empty/single element/max constraints) before coding.
- Match your final complexity to the expected difficulty and test with small custom inputs.`, title)
}

func buildFallbackAnalysis(req AnalysisRequest) string {
	result := strings.TrimSpace(req.Result)
	if result == "" {
		result = "unknown"
	}
	return fmt.Sprintf(`Core Idea
- Break the problem into clear input -> transform -> output stages.
- Focus on reducing repeated computation with the right data structure.

Step-by-Step Approach
1. Clarify constraints and edge cases.
2. Build a correct baseline solution.
3. Optimize hot loops/data access.
4. Re-test boundary cases and invalid assumptions.

Complexity
- Time: depends on chosen structure, target near O(n) or O(n log n) for most medium tasks.
- Space: keep auxiliary memory minimal and predictable.

Common Pitfalls
- Off-by-one errors and incorrect boundary handling.
- Not validating empty input and single-item cases.
- Using an approach that is too slow for constraints.

How to Improve This Submission
- Result seen: %s
- Add targeted tests for edge cases.
- Refactor into smaller helper functions for clarity and fewer bugs.`, result)
}
