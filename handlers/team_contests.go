package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/smtp"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	TeamContestModeICPC = "icpc_3v3"
	ICPCWrongPenaltyMin = 20
)

type TeamContest struct {
	ID          string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"not null;index" json:"name"`
	Mode        string    `gorm:"not null;default:'icpc_3v3'" json:"mode"`
	TeamSize    int       `gorm:"not null;default:3" json:"team_size"`
	DurationSec int       `gorm:"not null;default:7200" json:"duration_sec"`
	StartedAt   time.Time `gorm:"not null;default:now()" json:"started_at"`
	Finalized   bool      `gorm:"not null;default:false;index" json:"finalized"`
	CreatedAt   time.Time `json:"created_at"`
}

func (TeamContest) TableName() string { return "team_contests" }

type TeamContestTeam struct {
	ID         string    `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	ContestID  string    `gorm:"type:uuid;not null;index" json:"contest_id"`
	TeamName   string    `gorm:"type:text;not null" json:"team_name"`
	TeamNumber int       `gorm:"not null;index" json:"team_number"`
	CreatedAt  time.Time `json:"created_at"`
}

func (TeamContestTeam) TableName() string { return "team_contest_teams" }

type TeamContestMember struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TeamID    string    `gorm:"type:uuid;not null;index" json:"team_id"`
	UserID    string    `gorm:"type:uuid;not null;index" json:"user_id"`
	IsCaptain bool      `gorm:"not null;default:false" json:"is_captain"`
	CreatedAt time.Time `json:"created_at"`
}

func (TeamContestMember) TableName() string { return "team_contest_members" }

type TeamContestProblem struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ContestID   string    `gorm:"type:uuid;not null;index" json:"contest_id"`
	ProblemSlug string    `gorm:"type:text;not null;index" json:"problem_slug"`
	Position    int       `gorm:"not null" json:"position"`
	CreatedAt   time.Time `json:"created_at"`
}

func (TeamContestProblem) TableName() string { return "team_contest_problems" }

type TeamContestSubmission struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ContestID   string    `gorm:"type:uuid;not null;index" json:"contest_id"`
	TeamID      string    `gorm:"type:uuid;not null;index" json:"team_id"`
	ProblemSlug string    `gorm:"type:text;not null;index" json:"problem_slug"`
	Verdict     string    `gorm:"type:text;not null" json:"verdict"`
	SubmittedAt time.Time `gorm:"not null;default:now();index" json:"submitted_at"`
	CreatedAt   time.Time `json:"created_at"`
}

func (TeamContestSubmission) TableName() string { return "team_contest_submissions" }

type TeamContestSideCreate struct {
	TeamName  string   `json:"team_name" binding:"required"`
	MemberIDs []string `json:"member_ids" binding:"required"`
	CaptainID string   `json:"captain_id" binding:"required"`
}

type TeamContestCreateRequest struct {
	Name         string                `json:"name" binding:"required"`
	Mode         string                `json:"mode"`
	DurationSec  int                   `json:"duration_sec"`
	TeamA        TeamContestSideCreate `json:"team_a" binding:"required"`
	TeamB        TeamContestSideCreate `json:"team_b" binding:"required"`
	ProblemSlugs []string              `json:"problem_slugs" binding:"required"`
}

type TeamContestSubmissionRequest struct {
	TeamID      string `json:"team_id" binding:"required"`
	ProblemSlug string `json:"problem_slug" binding:"required"`
	Verdict     string `json:"verdict" binding:"required"`
	SubmittedAt string `json:"submitted_at"`
}

type ICPCProblemScore struct {
	ProblemSlug      string `json:"problem_slug"`
	Solved           bool   `json:"solved"`
	WrongBeforeSolve int    `json:"wrong_before_solve"`
	SolvedAtMin      int    `json:"solved_at_min,omitempty"`
	Penalty          int    `json:"penalty"`
}

type ICPCTeamScore struct {
	Rank         int                `json:"rank"`
	TeamID       string             `json:"team_id"`
	TeamName     string             `json:"team_name"`
	TeamNumber   int                `json:"team_number"`
	Solved       int                `json:"solved"`
	Penalty      int                `json:"penalty"`
	LastSolvedAt int                `json:"last_solved_at"`
	Problems     []ICPCProblemScore `json:"problems"`
}

func (h *Handler) CreateTeamContest(c *gin.Context) {
	var req TeamContestCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.ProblemSlugs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "at least one problem is required"})
		return
	}
	if req.DurationSec <= 0 {
		req.DurationSec = 2 * 60 * 60
	}
	if req.Mode == "" {
		req.Mode = TeamContestModeICPC
	}
	if req.Mode != TeamContestModeICPC {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported mode"})
		return
	}
	if err := validateTeamSide(req.TeamA); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "team_a: " + err.Error()})
		return
	}
	if err := validateTeamSide(req.TeamB); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "team_b: " + err.Error()})
		return
	}

	seenUsers := make(map[string]bool, 6)
	for _, id := range append(req.TeamA.MemberIDs, req.TeamB.MemberIDs...) {
		if seenUsers[id] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "duplicate user across teams: " + id})
			return
		}
		seenUsers[id] = true
	}

	contest := TeamContest{
		Name:        req.Name,
		Mode:        req.Mode,
		TeamSize:    3,
		DurationSec: req.DurationSec,
		StartedAt:   time.Now().UTC(),
		Finalized:   false,
	}

	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&contest).Error; err != nil {
			return err
		}

		teams := []TeamContestTeam{
			{ContestID: contest.ID, TeamName: req.TeamA.TeamName, TeamNumber: 1},
			{ContestID: contest.ID, TeamName: req.TeamB.TeamName, TeamNumber: 2},
		}
		if err := tx.Create(&teams).Error; err != nil {
			return err
		}

		for i, side := range []TeamContestSideCreate{req.TeamA, req.TeamB} {
			teamID := teams[i].ID
			for _, userID := range side.MemberIDs {
				member := TeamContestMember{
					TeamID:    teamID,
					UserID:    userID,
					IsCaptain: userID == side.CaptainID,
				}
				if err := tx.Create(&member).Error; err != nil {
					return err
				}
			}
		}

		for i, slug := range req.ProblemSlugs {
			p := TeamContestProblem{
				ContestID:   contest.ID,
				ProblemSlug: slug,
				Position:    i + 1,
			}
			if err := tx.Create(&p).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	go func(contestID, contestName string, teamA, teamB TeamContestSideCreate) {
		allMemberIDs := append(teamA.MemberIDs, teamB.MemberIDs...)

		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:3000"
			// frontendURL = "https://elonode.online"
		}
		lobbyLink := fmt.Sprintf("%s/team-contests/%s/lobby", frontendURL, contestID)

		for _, userID := range allMemberIDs {
			email, err := getUserEmailFromClerk(userID)
			if err != nil {
				fmt.Printf("[EMAIL SYSTEM] : Error fetching email for UUID %s: %v\n", userID, err)
				continue
			}

			err = sendMatchInviteEmail(email, contestName, lobbyLink)
			if err != nil {
				fmt.Printf("[EMAIL SYSTEM] : Failed to send to %s: %v\n", email, err)
			} else {
				fmt.Printf("[EMAIL SYSTEM] : Invite sent successfully to: %s\n", email)
			}
		}
	}(contest.ID, contest.Name, req.TeamA, req.TeamB)

	c.JSON(http.StatusCreated, contest)
}

func (h *Handler) GetLatestContestForUser(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var contest TeamContest
	err := h.db.Table("team_contests").
		Select("team_contests.*").
		Joins("JOIN team_contest_teams ON team_contest_teams.contest_id = team_contests.id").
		Joins("JOIN team_contest_members ON team_contest_members.team_id = team_contest_teams.id").
		Where("team_contest_members.user_id = ? AND team_contests.finalized = ?", userID, false).
		Order("team_contests.created_at DESC").
		First(&contest).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, nil)
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, contest)
}

func (h *Handler) GetTeamContest(c *gin.Context) {
	contestID := c.Param("id")
	var contest TeamContest
	if err := h.db.First(&contest, "id = ?", contestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team contest not found"})
		return
	}

	var teams []TeamContestTeam
	if err := h.db.Where("contest_id = ?", contestID).Order("team_number asc").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var members []TeamContestMember
	if err := h.db.Where("team_id IN ?", extractTeamIDs(teams)).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var problems []TeamContestProblem
	if err := h.db.Where("contest_id = ?", contestID).Order("position asc").Find(&problems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"contest":  contest,
		"teams":    teams,
		"members":  members,
		"problems": problems,
	})
}

func (h *Handler) SubmitTeamContest(c *gin.Context) {
	contestID := c.Param("id")
	var req TeamContestSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var contest TeamContest
	if err := h.db.First(&contest, "id = ?", contestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team contest not found"})
		return
	}
	if contest.Finalized {
		c.JSON(http.StatusConflict, gin.H{"error": "team contest already finalized"})
		return
	}

	var team TeamContestTeam
	if err := h.db.First(&team, "id = ? AND contest_id = ?", req.TeamID, contestID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team for contest"})
		return
	}

	req.ProblemSlug = strings.TrimSpace(req.ProblemSlug)
	if req.ProblemSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem_slug is required"})
		return
	}
	var problem TeamContestProblem
	if err := h.db.First(&problem, "contest_id = ? AND problem_slug = ?", contestID, req.ProblemSlug).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "problem not part of this contest"})
		return
	}

	verdict := strings.ToUpper(strings.TrimSpace(req.Verdict))
	allowed := map[string]bool{"AC": true, "WA": true, "TLE": true, "RE": true, "CE": true}
	if !allowed[verdict] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported verdict"})
		return
	}

	submittedAt := time.Now().UTC()
	if strings.TrimSpace(req.SubmittedAt) != "" {
		parsed, err := time.Parse(time.RFC3339, req.SubmittedAt)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid submitted_at, use RFC3339"})
			return
		}
		submittedAt = parsed.UTC()
	}

	sub := TeamContestSubmission{
		ContestID:   contestID,
		TeamID:      req.TeamID,
		ProblemSlug: req.ProblemSlug,
		Verdict:     verdict,
		SubmittedAt: submittedAt,
	}
	if err := h.db.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, sub)
}

func (h *Handler) FinalizeTeamContest(c *gin.Context) {
	contestID := c.Param("id")
	if err := h.db.Model(&TeamContest{}).
		Where("id = ?", contestID).
		Update("finalized", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "team contest finalized", "contest_id": contestID})
}

func (h *Handler) GetTeamContestScoreboard(c *gin.Context) {
	contestID := c.Param("id")
	var contest TeamContest
	if err := h.db.First(&contest, "id = ?", contestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "team contest not found"})
		return
	}

	var teams []TeamContestTeam
	if err := h.db.Where("contest_id = ?", contestID).Order("team_number asc").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var problems []TeamContestProblem
	if err := h.db.Where("contest_id = ?", contestID).Order("position asc").Find(&problems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var subs []TeamContestSubmission
	if err := h.db.Where("contest_id = ?", contestID).Order("submitted_at asc").Find(&subs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	scoreboard := computeICPCScoreboard(contest.StartedAt, teams, problems, subs)
	c.JSON(http.StatusOK, gin.H{
		"contest_id": contestID,
		"mode":       contest.Mode,
		"scoreboard": scoreboard,
	})
}

func (h *Handler) GetMyTeam(c *gin.Context) {
	contestID := c.Param("id")
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	var member TeamContestMember
	err := h.db.
		Where("user_id = ? AND team_id IN (SELECT id FROM team_contest_teams WHERE contest_id = ?)", userID, contestID).
		First(&member).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user is not a member of this contest"})
		return
	}

	var team TeamContestTeam
	if err := h.db.First(&team, "id = ?", member.TeamID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team not found"})
		return
	}

	var problems []TeamContestProblem
	h.db.Where("contest_id = ?", contestID).Order("position asc").Find(&problems)

	var contest TeamContest
	h.db.First(&contest, "id = ?", contestID)

	c.JSON(http.StatusOK, gin.H{
		"team":       team,
		"member":     member,
		"problems":   problems,
		"contest":    contest,
		"is_captain": member.IsCaptain,
	})
}

func (h *Handler) StartTeamContest(c *gin.Context) {
	contestID := c.Param("id")
	now := time.Now().UTC()
	if err := h.db.Model(&TeamContest{}).
		Where("id = ?", contestID).
		Update("started_at", now).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":    "contest started",
		"contest_id": contestID,
		"started_at": now,
	})
}

func validateTeamSide(side TeamContestSideCreate) error {
	if len(side.MemberIDs) != 3 {
		return fmt.Errorf("must have exactly 3 members")
	}
	seen := make(map[string]bool, 3)
	foundCaptain := false
	for _, id := range side.MemberIDs {
		if strings.TrimSpace(id) == "" {
			return fmt.Errorf("member_ids contains empty id")
		}
		if seen[id] {
			return fmt.Errorf("duplicate member id: %s", id)
		}
		seen[id] = true
		if id == side.CaptainID {
			foundCaptain = true
		}
	}
	if !foundCaptain {
		return fmt.Errorf("captain_id must be included in member_ids")
	}
	return nil
}

func extractTeamIDs(teams []TeamContestTeam) []string {
	ids := make([]string, 0, len(teams))
	for _, t := range teams {
		ids = append(ids, t.ID)
	}
	return ids
}

func computeICPCScoreboard(startedAt time.Time, teams []TeamContestTeam, problems []TeamContestProblem, subs []TeamContestSubmission) []ICPCTeamScore {
	type pState struct {
		solved      bool
		wrongBefore int
		solvedAtMin int
	}

	problemSet := make(map[string]bool, len(problems))
	for _, p := range problems {
		problemSet[p.ProblemSlug] = true
	}

	teamStates := make(map[string]map[string]*pState, len(teams))
	for _, t := range teams {
		teamStates[t.ID] = make(map[string]*pState, len(problems))
		for _, p := range problems {
			teamStates[t.ID][p.ProblemSlug] = &pState{}
		}
	}

	sort.Slice(subs, func(i, j int) bool {
		return subs[i].SubmittedAt.Before(subs[j].SubmittedAt)
	})

	for _, s := range subs {
		if !problemSet[s.ProblemSlug] {
			continue
		}
		pMap, ok := teamStates[s.TeamID]
		if !ok {
			continue
		}
		st := pMap[s.ProblemSlug]
		if st.solved {
			continue
		}
		if s.Verdict == "AC" {
			st.solved = true
			mins := int(s.SubmittedAt.Sub(startedAt).Minutes())
			if mins < 0 {
				mins = 0
			}
			st.solvedAtMin = mins
		} else if s.Verdict != "CE" {
			st.wrongBefore++
		}
	}

	result := make([]ICPCTeamScore, 0, len(teams))
	for _, t := range teams {
		score := ICPCTeamScore{
			TeamID:       t.ID,
			TeamName:     t.TeamName,
			TeamNumber:   t.TeamNumber,
			Solved:       0,
			Penalty:      0,
			LastSolvedAt: 0,
			Problems:     make([]ICPCProblemScore, 0, len(problems)),
		}
		for _, p := range problems {
			st := teamStates[t.ID][p.ProblemSlug]
			item := ICPCProblemScore{
				ProblemSlug:      p.ProblemSlug,
				Solved:           st.solved,
				WrongBeforeSolve: st.wrongBefore,
				SolvedAtMin:      st.solvedAtMin,
				Penalty:          0,
			}
			if st.solved {
				item.Penalty = st.solvedAtMin + ICPCWrongPenaltyMin*st.wrongBefore
				score.Solved++
				score.Penalty += item.Penalty
				if st.solvedAtMin > score.LastSolvedAt {
					score.LastSolvedAt = st.solvedAtMin
				}
			}
			score.Problems = append(score.Problems, item)
		}
		result = append(result, score)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].Solved != result[j].Solved {
			return result[i].Solved > result[j].Solved
		}
		if result[i].Penalty != result[j].Penalty {
			return result[i].Penalty < result[j].Penalty
		}
		return result[i].LastSolvedAt < result[j].LastSolvedAt
	})

	for i := range result {
		result[i].Rank = i + 1
	}

	return result
}

func EnsureUUID(id string) string {
	if strings.TrimSpace(id) == "" {
		return uuid.NewString()
	}
	return id
}

func getUserEmailFromClerk(userID string) (string, error) {
	clerkSecret := os.Getenv("CLERK_SECRET_KEY")
	if clerkSecret == "" {
		return "", fmt.Errorf("CLERK_SECRET_KEY is not set")
	}

	req, _ := http.NewRequest("GET", "https://api.clerk.com/v1/users/"+userID, nil)
	req.Header.Add("Authorization", "Bearer "+clerkSecret)

	client := &http.Client{Timeout: 5 * time.Second}
	res, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return "", fmt.Errorf("failed to fetch user from clerk, status: %d", res.StatusCode)
	}

	body, _ := io.ReadAll(res.Body)

	var clerkUser struct {
		EmailAddresses []struct {
			EmailAddress string `json:"email_address"`
		} `json:"email_addresses"`
	}

	if err := json.Unmarshal(body, &clerkUser); err != nil {
		return "", err
	}

	if len(clerkUser.EmailAddresses) > 0 {
		return clerkUser.EmailAddresses[0].EmailAddress, nil
	}
	return "", fmt.Errorf("no email found for user")
}

func sendMatchInviteEmail(toEmail, contestName, lobbyLink string) error {
	from := os.Getenv("SMTP_EMAIL")
	password := os.Getenv("SMTP_PASSWORD")
	if from == "" || password == "" {
		return fmt.Errorf("SMTP credentials not set in .env")
	}

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"

	subject := "Subject: INITIATE: You are summoned for a 3v3 ICPC Battle!\r\n"
	headers := "MIME-version: 1.0;\r\nContent-Type: text/html; charset=\"UTF-8\";\r\n\r\n"

	htmlBody := fmt.Sprintf(`
		<div style="font-family: monospace; background-color: #05060b; color: #e4e4e7; padding: 40px; border-radius: 10px;">
			<h2 style="color: #6366f1;">ELONODE - MATCH DEPLOYED</h2>
			<p>Your Captain has deployed <strong>%s</strong>.</p>
			<p>The system is waiting for all nodes to connect.</p>
			<a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #4ade80; color: #000; text-decoration: none; font-weight: bold; border-radius: 5px; margin-top: 20px;">
				JOIN LOBBY & READY UP
			</a>
			<p style="margin-top: 30px; font-size: 10px; color: #52525b;">Do not share this link with unauthorized personnel.</p>
		</div>
	`, contestName, lobbyLink)

	message := []byte(subject + headers + htmlBody)

	auth := smtp.PlainAuth("", from, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{toEmail}, message)

	return err
}
