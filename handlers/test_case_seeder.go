package handlers

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type DBTestCase struct {
	ProblemSlug    string  `gorm:"column:problem_slug"`
	InputData      string  `gorm:"column:input_data"`
	ExpectedOutput string  `gorm:"column:expected_output"`
	IsHidden       bool    `gorm:"column:is_hidden"`
	CheckerType    string  `gorm:"column:checker_type"`
	FloatTolerance float64 `gorm:"column:float_tolerance"`
}

func (DBTestCase) TableName() string { return "test_cases" }

func seedTestCasesForProblem(db *gorm.DB, problem *ProblemResponse) {
	if problem == nil || strings.TrimSpace(problem.Slug) == "" {
		return
	}

	slug := strings.TrimSpace(problem.Slug)

	var count int64
	db.Model(&DBTestCase{}).
		Where("problem_slug = ?", slug).
		Count(&count)
	if count > 0 {
		return
	}

	// ensure parent problem row exists
	db.Exec(
		`INSERT INTO problems (slug, title, difficulty, source)
		 VALUES (?, ?, ?, 'leetcode')
		 ON CONFLICT (slug) DO NOTHING`,
		slug, problem.Title, problem.Difficulty,
	)

	lines := parseExampleLines(problem.Examples)
	if len(lines) == 0 {
		return
	}

	var cases []DBTestCase
	for i, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		cases = append(cases, DBTestCase{
			ProblemSlug: slug,
			InputData:   line,
			IsHidden:    false,
			CheckerType: "standard",
		})
		_ = i
	}

	if len(cases) == 0 {
		return
	}

	db.Clauses(clause.OnConflict{DoNothing: true}).Create(&cases)

	fmt.Printf("[seeder] saved %d public test cases for %s\n", len(cases), slug)
}

func parseExampleLines(examples string) []string {
	if strings.TrimSpace(examples) == "" {
		return nil
	}
	raw := strings.Split(examples, "\n")
	var out []string
	for _, line := range raw {
		trimmed := strings.TrimSpace(line)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
