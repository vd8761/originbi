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
				// 1. Attention Check Fail
				if question.Category == "ATTENTION_CHECK" {
					// If the selected option is NOT correct, it's a fail
					// Or if Score < 1. Let's use IsCorrect flag if available or Score.
					if !option.IsCorrect {
						answerRecord.IsAttentionFail = true
					} else {
						answerRecord.IsAttentionFail = false
					}
				}

				// 2. Distraction Chosen
				// If the question itself is a Distraction Question OR the Option is marked as such?
				// User schema "question_type" check: 'DISTRACTION'.
				// Mapped to "Category" in struct?
				if question.Category == "DISTRACTION" {
					answerRecord.IsDistractionChosen = true
				}

				// 3. Sincerity Flag (Placeholder Logic)
				// If attention failed, maybe flag sincerity?
				if answerRecord.IsAttentionFail {
					answerRecord.SincerityFlag = 1
				} else {
					answerRecord.SincerityFlag = 0
				}
			}
		}

	} else if answerRecord.OpenQuestionID != nil && *answerRecord.OpenQuestionID == req.QuestionID {
		answerRecord.OpenOptionID = &req.SelectedOption

		// Open Question Logic
		var option models.OpenQuestionOption
		if err := db.First(&option, req.SelectedOption).Error; err == nil {
			// Open questions usually don't have IsCorrect or Score in the same way
			// But can set IsAttentionFail if needed based on traits
		}
	}

	// Update fields
	answerRecord.TimeSpentSeconds += req.TimeTaken
	answerRecord.AnswerChangeCount = req.AnswerChangeCount
	answerRecord.Status = "ANSWERED"

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

		// --- Score Calculation ---
		type ScoreResult struct {
			DiscFactor string
			Total      float64
		}
		var scores []ScoreResult
		// Calculate scores grouped by DiscFactor
		db.Raw(`
            SELECT o.disc_factor, SUM(o.score_value) as total 
            FROM assessment_answers a 
            JOIN assessment_question_options o ON a.main_option_id = o.id 
            WHERE a.assessment_attempt_id = ? 
            GROUP BY o.disc_factor
        `, answerRecord.AssessmentAttemptID).Scan(&scores)

		scoreMap := make(map[string]float64)
		var totalScore float64
		var validScores []ScoreResult

		for _, s := range scores {
			totalScore += s.Total // Accumulate Total Score regardless of factor
			if s.DiscFactor != "" {
				scoreMap[s.DiscFactor] = s.Total
				validScores = append(validScores, s)
			}
		}

		// Sort by Score Descending
		sort.Slice(validScores, func(i, j int) bool {
			return validScores[i].Total > validScores[j].Total
		})

		var dominantFactor string
		if len(validScores) >= 2 {
			// Combine Top 2 (e.g. "D" + "C" = "DC")
			dominantFactor = validScores[0].DiscFactor + validScores[1].DiscFactor
		} else if len(validScores) == 1 {
			dominantFactor = validScores[0].DiscFactor
		}

		// Prepare Metadata
		var attempt models.AssessmentAttempt
		db.First(&attempt, answerRecord.AssessmentAttemptID)

		metaMap := make(map[string]interface{})
		if attempt.Metadata != "" && attempt.Metadata != "{}" {
			json.Unmarshal([]byte(attempt.Metadata), &metaMap)
		}

		// Determine Level Context & Update Metadata
		var currentLevel models.AssessmentLevel
		if err := db.First(&currentLevel, "id = ?", answerRecord.AssessmentLevelID).Error; err == nil {
			if currentLevel.LevelNumber == 1 || currentLevel.PatternType == "DISC" {
				metaMap["disc_scores"] = scoreMap
			} else {
				// For Agile/Others, if no factors found, store Total
				if len(scoreMap) == 0 {
					metaMap["agile_scores"] = map[string]float64{"Total": totalScore}
				} else {
					metaMap["agile_scores"] = scoreMap
				}
			}
		}

		updatedMeta, _ := json.Marshal(metaMap)

		// Find Dominant Trait ID
		var traitID *int64
		if dominantFactor != "" {
			var trait models.PersonalityTrait
			// Search for Code "DC" (or "CD"? Usually standardize logic in DB or Query. Assuming DB has "DC")
			// If not found, try permutations? For now exact match.
			if err := db.Where("code = ?", dominantFactor).First(&trait).Error; err == nil {
				tID := trait.ID
				traitID = &tID
			}
		}

		// Update Current Attempt
		db.Model(&models.AssessmentAttempt{}).Where("id = ?", answerRecord.AssessmentAttemptID).Updates(map[string]interface{}{
			"status":            "COMPLETED",
			"completed_at":      now,
			"metadata":          string(updatedMeta),
			"dominant_trait_id": traitID,
			"total_score":       totalScore,
		})

		// --- Next Level Setup ---
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

				// Generate Questions for Next Level (Trait Based)
				if traitID != nil {
					// 1. Clear existing generic questions
					db.Exec("DELETE FROM assessment_answers WHERE assessment_attempt_id = ?", nextAttempt.ID)

					// 2. Insert new questions based on Trait (Limit 25)
					query := `
                        INSERT INTO assessment_answers (
                            assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
                            main_question_id, question_source, status, created_at, updated_at
                        )
                        SELECT ?, ?, ?, ?, ?, ?, id, 'MAIN', 'NOT_ANSWERED', NOW(), NOW()
                        FROM assessment_questions 
                        WHERE assessment_level_id = ? AND personality_trait_id = ?
                        ORDER BY id
                        LIMIT 25
                    `
					db.Exec(query, nextAttempt.ID, nextAttempt.AssessmentSessionID, nextAttempt.UserID, nextAttempt.RegistrationID, nextAttempt.ProgramID, nextLevel.ID, nextLevel.ID, *traitID)
				}
			}
		}
	}

	return nil
}
