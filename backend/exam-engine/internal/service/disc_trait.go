package service

import "sort"

// discFactorPriority is the deterministic tie-break order C > D > I > S, applied
// when two factors share the same score. It mirrors getTopTwoTraits in the
// report layer and calculateDiscProfile in the specialization report so all
// three trait-resolution paths agree.
var discFactorPriority = map[string]int{"C": 0, "D": 1, "I": 2, "S": 3}

// ResolveDominantFactor turns raw Level-1 DISC factor sums into the dominant
// trait code that is stored on assessment_attempts.dominant_trait_id (via the
// personality_traits.code lookup).
//
// It returns a single letter ("D"/"I"/"S"/"C") - a "Pure Trait" - when one
// dimension is dominant enough, otherwise the top-two blend (e.g. "DI").
//
// Pure-trait rule (raw disc_scores; total = D+I+S+C):
//
//	(1) top*2 >= total          // top is at least 50% of the candidate's own total
//	(2) top/2  >  every other   // top strictly dominates each other dimension
//
// Guard: when the top score or the total is non-positive we never override -
// the result is the same blend (or single factor) the engine produced before,
// so an empty/abandoned attempt is unaffected.
//
// `scores` is the factor->sum map (e.g. {"D":22,"I":16,"S":6,"C":8}); any extra
// keys (such as "total") are ignored. Missing factors are treated as absent
// (i.e. score 0 and excluded from the total), matching the SQL aggregation that
// only returns factors the candidate actually scored on.
func ResolveDominantFactor(scores map[string]float64) string {
	type factorScore struct {
		factor string
		score  float64
	}

	list := make([]factorScore, 0, 4)
	var total float64
	for _, f := range []string{"D", "I", "S", "C"} {
		v, ok := scores[f]
		if !ok {
			continue
		}
		list = append(list, factorScore{factor: f, score: v})
		total += v
	}

	if len(list) == 0 {
		return ""
	}

	sort.SliceStable(list, func(i, j int) bool {
		if list[i].score != list[j].score {
			return list[i].score > list[j].score
		}
		return discFactorPriority[list[i].factor] < discFactorPriority[list[j].factor]
	})

	top := list[0]
	if len(list) == 1 {
		return top.factor
	}

	if top.score > 0 && total > 0 {
		// Rule (1): top is at least half of the whole distribution.
		if top.score*2 >= total {
			return top.factor
		}
		// Rule (2): top more than doubles every other dimension individually.
		dominatesAll := true
		for _, r := range list[1:] {
			if !(top.score/2 > r.score) {
				dominatesAll = false
				break
			}
		}
		if dominatesAll {
			return top.factor
		}
	}

	// Standard dual-trait blend (unchanged 12-combination behaviour).
	return top.factor + list[1].factor
}
