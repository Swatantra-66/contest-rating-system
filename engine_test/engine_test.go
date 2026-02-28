package engine_test

import (
	"testing"

	"github.com/Swatantra-66/contest-rating-system/engine"
	"github.com/Swatantra-66/contest-rating-system/models"
)

type engineCase struct {
	name            string
	rank            int
	total           int
	oldRating       int
	wantPercentile  float64
	wantPerformance int
	wantChange      int
	wantNewRating   int
	wantTier        models.Tier
	wantErr         bool
}

var engineCases = []engineCase{
	{
		name: "document example - top 10%",
		rank: 10, total: 100, oldRating: 1000,
		wantPercentile:  0.90,
		wantPerformance: 1200,
		wantChange:      100,
		wantNewRating:   1100,
		wantTier:        models.TierApprentice,
		wantErr:         false,
	},
	{
		name: "top 1% grandmaster zone",
		rank: 1, total: 200, oldRating: 1700,
		wantPercentile:  0.995,
		wantPerformance: 1800,
		wantChange:      50,
		wantNewRating:   1750,
		wantTier:        models.TierMaster,
		wantErr:         false,
	},
	{
		name: "top 5% bracket",
		rank: 5, total: 100, oldRating: 1300,
		wantPercentile:  0.95,
		wantPerformance: 1400,
		wantChange:      50,
		wantNewRating:   1350,
		wantTier:        models.TierExpert,
		wantErr:         false,
	},
	{
		name: "bottom half - rating decreases",
		rank: 60, total: 100, oldRating: 1200,
		wantPercentile:  0.40,
		wantPerformance: 900,
		wantChange:      -150,
		wantNewRating:   1050,
		wantTier:        models.TierNewbie,
		wantErr:         false,
	},
	{
		name: "last place",
		rank: 100, total: 100, oldRating: 1000,
		wantPercentile:  0.00,
		wantPerformance: 900,
		wantChange:      -50,
		wantNewRating:   950,
		wantTier:        models.TierNewbie,
		wantErr:         false,
	},

	{
		name:    "error - zero participants",
		rank:    10,
		total:   0,
		wantErr: true,
	},
	{
		name:    "error - negative rank",
		rank:    -1,
		total:   100,
		wantErr: true,
	},
	{
		name:    "error - rank greater than total",
		rank:    101,
		total:   100,
		wantErr: true,
	},
}

func TestCalculate(t *testing.T) {
	for _, tc := range engineCases {
		t.Run(tc.name, func(t *testing.T) {
			r, err := engine.Calculate(tc.rank, tc.total, tc.oldRating)

			if (err != nil) != tc.wantErr {
				t.Fatalf("Calculate() error = %v, wantErr %v", err, tc.wantErr)
			}

			if tc.wantErr {
				return
			}

			if r.Percentile != tc.wantPercentile {
				t.Errorf("Percentile: got %.4f, want %.4f", r.Percentile, tc.wantPercentile)
			}
			if r.PerformanceRating != tc.wantPerformance {
				t.Errorf("Performance: got %d, want %d", r.PerformanceRating, tc.wantPerformance)
			}
			if r.RatingChange != tc.wantChange {
				t.Errorf("Change: got %d, want %d", r.RatingChange, tc.wantChange)
			}
			if r.NewRating != tc.wantNewRating {
				t.Errorf("NewRating: got %d, want %d", r.NewRating, tc.wantNewRating)
			}
			if r.NewTier != tc.wantTier {
				t.Errorf("Tier: got %s, want %s", r.NewTier, tc.wantTier)
			}
		})
	}
}

func TestResolveTier(t *testing.T) {
	cases := []struct {
		rating int
		want   models.Tier
	}{
		{999, models.TierNewbie},
		{1100, models.TierApprentice},
		{1150, models.TierSpecialist},
		{1200, models.TierExpert},
		{1400, models.TierMaster},
		{1800, models.TierGrandmaster},
	}
	for _, tc := range cases {
		got := engine.ResolveTier(tc.rating)
		if got != tc.want {
			t.Errorf("ResolveTier(%d) = %s, want %s", tc.rating, got, tc.want)
		}
	}
}
