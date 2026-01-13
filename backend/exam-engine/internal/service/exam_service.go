package service

import (
	"encoding/json"
	"errors"
	"exam-engine/internal/models"
	"exam-engine/internal/repository"
	"sort"
	"time"
)

type ExamService struct{}

func NewExamService() *ExamService {
	return &ExamService{}
}

func (s *ExamService) GetExamQuestions(attemptID int64, studentID int64) ([]models.AssessmentAnswer, error) {
	db := repository.GetDB()

	// 1. Security Check: Verify the attempt belongs to the requesting student
	var attempt models.AssessmentAttempt
	if err := db.Where("id = ? AND user_id = ?", attemptID, studentID).First(&attempt).Error; err != nil {
		return nil, errors.New("assessment attempt not found or access denied")
	}

	// 1b. Update Status to IN_PROGRESS if started
	if attempt.Status == "NOT_STARTED" {
		now := time.Now()

		// Update Attempt
		attempt.Status = "IN_PROGRESS"
		attempt.StartedAt = &now
		if err := db.Model(&attempt).Updates(map[string]interface{}{
			"status":     "IN_PROGRESS",
			"started_at": now,
		}).Error; err != nil {
			return nil, err // Return error or log it? Best to return error to be safe
		}

		// Update Parent Session if needed
		var session models.AssessmentSession
		if err := db.First(&session, attempt.AssessmentSessionID).Error; err == nil {
			if session.Status == "NOT_STARTED" {
				db.Model(&session).Updates(map[string]interface{}{
					"status":     "IN_PROGRESS",
					"started_at": now,
				})
			}
		}
	}

	// 2. Fetch Questions
	var answers []models.AssessmentAnswer
	result := db.Where("assessment_attempt_id = ?", attemptID).
		Preload("MainQuestion").
		Preload("MainQuestion.Options").
		Preload("OpenQuestion").
		Preload("OpenQuestion.Options").
		Preload("OpenQuestion.Images").
		Order("question_sequence ASC").
		Find(&answers)

	if result.Error != nil {
		return nil, result.Error
	}

	return answers, nil
}

func (s *ExamService) SubmitAnswer(req models.StudentAnswer) error {
	db := repository.GetDB()

	// 1. Find the answer record
	var answerRecord models.AssessmentAnswer

	// Query by AttemptID and (MainQuestionID OR OpenQuestionID)
	query := db.Where("assessment_attempt_id = ? AND (main_question_id = ? OR open_question_id = ?)", req.AttemptID, req.QuestionID, req.QuestionID).First(&answerRecord)

	if query.Error != nil {
		return errors.New("question not found for this attempt")
	}

	// 2. Update the record
	if answerRecord.MainQuestionID != nil && *answerRecord.MainQuestionID == req.QuestionID {
		answerRecord.MainOptionID = &req.SelectedOption

		// Fetch Option & Question Details
		var option models.AssessmentQuestionOption
		if err := db.First(&option, req.SelectedOption).Error; err == nil {
			answerRecord.AnswerScore = option.ScoreValue

			// Detect Flags based on Question Category
			var question models.AssessmentQuestion
			if err := db.First(&question, *answerRecord.MainQuestionID).Error; err == nil {

				// Default: Assume Sincere (2)
				answerRecord.SincerityFlag = 2

				// 1. Attention Check Fail
				if question.Category == "ATTENTION_CHECK" {
					// For attention checks, the option must be marked IsCorrect=true to pass.
					if !option.IsCorrect {
						answerRecord.IsAttentionFail = true
						answerRecord.SincerityFlag = 1 // Not Sincere
					} else {
						answerRecord.IsAttentionFail = false
						answerRecord.SincerityFlag = 2 // Sincere
					}
				}

				// 2. Distraction Chosen
				// If the question category is DISTRACTION, any selection is considered "choosing distraction"
				// OR if the system supports Distractor Options within normal questions (not implemented here yet).
				// Assuming 'DISTRACTION' category represents questions designed to test focus/distractibility.
				if question.Category == "DISTRACTION" {
					// Logic: If they answer a distraction question, does it count as chosen?
					// Usually Distraction questions are "Do not answer this" or "Select 'Strongly Disagree'".
					// Without specific logic, we'll assume if it's a Distraction Category,
					// and they selected a "Wrong" or specific option?
					// For now: If Category is Distraction, set flag.
					answerRecord.IsDistractionChosen = true
					answerRecord.SincerityFlag = 1
				}
			}
		}

	} else if answerRecord.OpenQuestionID != nil && *answerRecord.OpenQuestionID == req.QuestionID {
		answerRecord.OpenOptionID = &req.SelectedOption

		// Open Question Logic
		// Default Sincere for Open Questions
		answerRecord.SincerityFlag = 2
	}

	// Update fields
	answerRecord.TimeSpentSeconds += req.TimeTaken
	answerRecord.AnswerChangeCount = req.AnswerChangeCount
	answerRecord.Status = "ANSWERED"
	answerRecord.UpdatedAt = time.Now() // Ensure UpdatedAt is set

	if err := db.Save(&answerRecord).Error; err != nil {
		return err
	}

	// Check if this was the last question
	var totalCounts int64
	var answeredCounts int64

	// Count total rows in answers table for this attempt (Total Questions)
	db.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ?", answerRecord.AssessmentAttemptID).Count(&totalCounts)

	// Count answered rows
	db.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ? AND status = ?", answerRecord.AssessmentAttemptID, "ANSWERED").Count(&answeredCounts)

	if totalCounts > 0 && answeredCounts == totalCounts {
		now := time.Now()

		// Fetch Level Context First
		var currentLevel models.AssessmentLevel
		db.First(&currentLevel, "id = ?", answerRecord.AssessmentLevelID)

		scoreMap := make(map[string]float64)
		var totalScore float64
		var dominantFactor string
		var traitID *int64
		var agileOrderedData interface{}

		// --- Scoring Logic Based on Level ---
		if currentLevel.LevelNumber == 1 || currentLevel.Name == "Level 1" || currentLevel.PatternType == "DISC" {
			// ** Level 1: DISC Logic (Option Based) **
			type ScoreResult struct {
				DiscFactor string
				Total      float64
			}
			var scores []ScoreResult
			db.Raw(`
                SELECT o.disc_factor, SUM(o.score_value) as total 
                FROM assessment_answers a 
                JOIN assessment_question_options o ON a.main_option_id = o.id 
                WHERE a.assessment_attempt_id = ? 
                GROUP BY o.disc_factor
            `, answerRecord.AssessmentAttemptID).Scan(&scores)

			var validScores []ScoreResult
			for _, s := range scores {
				totalScore += s.Total
				if s.DiscFactor != "" {
					scoreMap[s.DiscFactor] = s.Total
					validScores = append(validScores, s)
				}
			}

			// Determine Dominant Factor
			sort.Slice(validScores, func(i, j int) bool {
				return validScores[i].Total > validScores[j].Total
			})

			if len(validScores) >= 2 {
				dominantFactor = validScores[0].DiscFactor + validScores[1].DiscFactor
			} else if len(validScores) == 1 {
				dominantFactor = validScores[0].DiscFactor
			}

			// Find Dominant Trait ID
			if dominantFactor != "" {
				var trait models.PersonalityTrait
				if err := db.Where("code = ?", dominantFactor).First(&trait).Error; err == nil {
					tID := trait.ID
					traitID = &tID
				}
			}

		} else if currentLevel.LevelNumber == 2 || currentLevel.Name == "Level 2" {
			// ** Level 2: Agile Logic (Question Category Based) **
			// Categories: Commitment, Focus, Openness, Respect, Courage
			type AgileScoreResult struct {
				Category string
				Total    float64
			}
			var agileScores []AgileScoreResult
			db.Raw(`
                SELECT q.category, SUM(a.answer_score) as total
                FROM assessment_answers a
                JOIN assessment_questions q ON a.main_question_id = q.id
                WHERE a.assessment_attempt_id = ?
                GROUP BY q.category
            `, answerRecord.AssessmentAttemptID).Scan(&agileScores)

			// Define struct with specific field order (Total last)
			var orderedAgile struct {
				Commitment float64 `json:"Commitment"`
				Courage    float64 `json:"Courage"`
				Focus      float64 `json:"Focus"`
				Openness   float64 `json:"Openness"`
				Respect    float64 `json:"Respect"`
				Total      float64 `json:"total"`
			}

			for _, s := range agileScores {
				totalScore += s.Total
				// Populate struct fields
				switch s.Category {
				case "Commitment":
					orderedAgile.Commitment = s.Total
				case "Courage":
					orderedAgile.Courage = s.Total
				case "Focus":
					orderedAgile.Focus = s.Total
				case "Openness":
					orderedAgile.Openness = s.Total
				case "Respect":
					orderedAgile.Respect = s.Total
				}
				// Also populate map for legacy/fallback (excluding total here to avoid duplicate if needed, but scoreMap['total'] is added later anyway)
				if s.Category != "" {
					scoreMap[s.Category] = s.Total
				}
			}
			orderedAgile.Total = totalScore
			agileOrderedData = orderedAgile
		}

		// Add Total to Map
		scoreMap["total"] = totalScore

		// --- Sincerity Index Calculation ---
		var sincerityStats struct {
			AttentionFails     int64
			DistractionsChosen int64
			TotalQuestions     int64
		}

		db.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ?", answerRecord.AssessmentAttemptID).
			Select("COUNT(*) FILTER (WHERE is_attention_fail = true) as attention_fails, COUNT(*) FILTER (WHERE is_distraction_chosen = true) as distractions_chosen, COUNT(*) as total_questions").
			Scan(&sincerityStats)

		sincerityIndex := 100.0
		sincerityIndex -= (float64(sincerityStats.AttentionFails) * 20.0)
		sincerityIndex -= (float64(sincerityStats.DistractionsChosen) * 10.0)
		if sincerityIndex < 0 {
			sincerityIndex = 0
		}

		var sincerityClass string
		if sincerityIndex >= 80 {
			sincerityClass = "SINCERE"
		} else if sincerityIndex >= 50 {
			sincerityClass = "BORDERLINE"
		} else {
			sincerityClass = "NOT_SINCERE"
		}

		// --- Metadata Update ---
		var attempt models.AssessmentAttempt
		db.First(&attempt, answerRecord.AssessmentAttemptID)

		metaMap := make(map[string]interface{})
		if attempt.Metadata != "" && attempt.Metadata != "{}" {
			json.Unmarshal([]byte(attempt.Metadata), &metaMap)
		}

		metaMap["overall_sincerity"] = sincerityIndex // Always store sincerity

		if currentLevel.LevelNumber == 1 || currentLevel.PatternType == "DISC" || currentLevel.Name == "Level 1" {
			metaMap["disc_scores"] = scoreMap
		} else if currentLevel.LevelNumber == 2 || currentLevel.Name == "Level 2" {
			if agileOrderedData != nil {
				metaMap["agile_scores"] = agileOrderedData
			} else {
				metaMap["agile_scores"] = scoreMap
			}
		} else if currentLevel.LevelNumber == 3 {
			metaMap["level3_scores"] = scoreMap
		} else if currentLevel.LevelNumber == 4 {
			metaMap["level4_scores"] = scoreMap
		}

		updatedMeta, _ := json.Marshal(metaMap)

		// --- Update Current Attempt ---
		updates := map[string]interface{}{
			"status":          "COMPLETED",
			"completed_at":    now,
			"metadata":        string(updatedMeta),
			"total_score":     totalScore,
			"sincerity_index": sincerityIndex,
			"sincerity_class": sincerityClass,
		}
		// Only update dominant_trait_id if it was calculated (Level 1)
		if traitID != nil {
			updates["dominant_trait_id"] = traitID
		}

		db.Model(&models.AssessmentAttempt{}).Where("id = ?", answerRecord.AssessmentAttemptID).Updates(updates)

		// 5. Next Level Setup (Level 2 Generation)
		var nextLevel models.AssessmentLevel
		if err := db.Where("level_number > ?", currentLevel.LevelNumber).Order("level_number ASC").First(&nextLevel).Error; err == nil {
			var nextAttempt models.AssessmentAttempt
			if err := db.Where("assessment_session_id = ? AND assessment_level_id = ?", answerRecord.AssessmentSessionID, nextLevel.ID).First(&nextAttempt).Error; err == nil {

				unlockAt := now.Add(time.Duration(nextLevel.UnlockAfterHours) * time.Hour)
				startWindow := 72
				if nextLevel.StartWithinHours > 0 {
					startWindow = nextLevel.StartWithinHours
				}
				expiresAt := unlockAt.Add(time.Duration(startWindow) * time.Hour)

				db.Model(&nextAttempt).Updates(map[string]interface{}{
					"unlock_at":  unlockAt,
					"expires_at": expiresAt,
				})

				// Generate Questions for Next Level (Trait Based for Level 2)
				if nextLevel.LevelNumber == 2 && traitID != nil {
					// 1. Clear existing generic questions (if any)
					db.Exec("DELETE FROM assessment_answers WHERE assessment_attempt_id = ?", nextAttempt.ID)

					// 2. Insert new questions based on Trait (Limit 25)
					// We use ROW_NUMBER() to generate QuestionSequence random 1-25
					query := `
                        INSERT INTO assessment_answers (
                            assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
                            main_question_id, question_source, status, question_sequence, created_at, updated_at
                        )
                        SELECT ?, ?, ?, ?, ?, ?, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY RANDOM()), NOW(), NOW()
                        FROM assessment_questions 
                        WHERE assessment_level_id = ? AND personality_trait_id = ?
                        ORDER BY RANDOM()
                        LIMIT 25
                    `
					db.Exec(query, nextAttempt.ID, nextAttempt.AssessmentSessionID, nextAttempt.UserID, nextAttempt.RegistrationID, nextAttempt.ProgramID, nextLevel.ID, nextLevel.ID, *traitID)
				}
			}
		}
	}

	return nil
}
