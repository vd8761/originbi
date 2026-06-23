package service

import "testing"

// TestResolveDominantFactor validates the Pure-Trait resolution rule
// (top*2 >= total  OR  top/2 > every other), the C>D>I>S tie-break, and that
// non-dominant profiles still produce the unchanged 12-blend codes.
func TestResolveDominantFactor(t *testing.T) {
	cases := []struct {
		name   string
		scores map[string]float64
		want   string
	}{
		// ── Pure via rule (1): top is >= 50% of the total ──────────────────
		{"pure C at exactly 50% (boundary, inclusive)", map[string]float64{"D": 1, "I": 12, "S": 7, "C": 20}, "C"}, // att 1877
		{"pure C above 50%", map[string]float64{"D": 5, "I": 6, "S": 6, "C": 23}, "C"},                            // att 1861
		{"pure D at exact 50%", map[string]float64{"D": 20, "I": 10, "S": 5, "C": 5}, "D"},

		// ── Pure via rule (2): top more than doubles each other, but < 50% ──
		// D18 of total40 -> 36 < 40 (rule1 fails); 18/2=9 > 8,8,6 (rule2 holds).
		{"pure D via relative dominance", map[string]float64{"D": 18, "I": 8, "S": 8, "C": 6}, "D"},

		// ── Blends: not dominant enough -> unchanged top-two behaviour ──────
		{"blend DI (real att 1888)", map[string]float64{"D": 22, "I": 16, "S": 6, "C": 8}, "DI"},
		{"blend IS (real att 1891)", map[string]float64{"D": 6, "I": 24, "S": 17, "C": 7}, "IS"},
		{"blend DI (real att 1894)", map[string]float64{"D": 27, "I": 15, "S": 9, "C": 8}, "DI"},
		{"blend SD (real att 1897)", map[string]float64{"D": 19, "I": 6, "S": 25, "C": 7}, "SD"},
		{"blend just below 50% boundary", map[string]float64{"D": 19, "I": 11, "S": 5, "C": 5}, "DI"},

		// ── Tie-break C > D > I > S ─────────────────────────────────────────
		{"tie D=I -> D first (priority), blend DI", map[string]float64{"D": 10, "I": 10, "S": 5, "C": 5}, "DI"},
		{"tie on second I=S -> I first, blend CI", map[string]float64{"D": 1, "I": 11, "S": 11, "C": 18}, "CI"},
		{"all equal -> C then D by priority", map[string]float64{"D": 10, "I": 10, "S": 10, "C": 10}, "CD"},

		// ── Edge cases ──────────────────────────────────────────────────────
		{"single factor present", map[string]float64{"C": 15}, "C"},
		{"empty map", map[string]float64{}, ""},
		{"all zero -> guard, no override, deterministic CD", map[string]float64{"D": 0, "I": 0, "S": 0, "C": 0}, "CD"},
		{"missing factor treated as absent", map[string]float64{"I": 12, "S": 7, "C": 20}, "C"},
		{"ignores extra total key", map[string]float64{"D": 22, "I": 16, "S": 6, "C": 8, "total": 52}, "DI"},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := ResolveDominantFactor(c.scores)
			if got != c.want {
				t.Errorf("ResolveDominantFactor(%v) = %q, want %q", c.scores, got, c.want)
			}
		})
	}
}
