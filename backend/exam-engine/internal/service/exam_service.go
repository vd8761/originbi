package service

import (
	"encoding/json"
	"errors"
	"exam-engine/internal/models"
	"exam-engine/internal/repository"
	"fmt"
	"sort"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

	// 1b. Ensure Started State
	now := time.Now()

	// Update Attempt to IN_PROGRESS if needed
	// Fix: Handle both "NOT_STARTED" (Default) and "NOT_YET_STARTED" (Legacy/Seeded)
	if attempt.Status == "NOT_STARTED" || attempt.Status == "NOT_YET_STARTED" {
		attempt.Status = "IN_PROGRESS"
		attempt.StartedAt = &now
		if err := db.Model(&attempt).Updates(map[string]interface{}{
			"status":     "IN_PROGRESS",
			"started_at": now,
		}).Error; err != nil {
			return nil, err
		}
	}

	// Update Parent Session and Group Assessment (Always check to ensure consistency)
	var session models.AssessmentSession
	if err := db.First(&session, attempt.AssessmentSessionID).Error; err == nil {
		// 1. Ensure Session is IN_PROGRESS
		if session.Status == "NOT_STARTED" || session.Status == "NOT_YET_STARTED" {
			db.Model(&session).Updates(map[string]interface{}{
				"status":     "IN_PROGRESS",
				"started_at": now,
			})
		}

		// ... (Logic continues in next chunk or I can include it if small enough, but avoiding giant replacement) ...

		// 2. Ensure Group Assessment is IN_PROGRESS
		if session.GroupID != nil {
			var groupAssessment models.GroupAssessment
			// Find the group assessment by group_id AND program_id
			if err := db.Where("group_id = ? AND program_id = ?", *session.GroupID, session.ProgramID).First(&groupAssessment).Error; err == nil {
				// Update the GroupAssessment status
				if groupAssessment.Status != "IN_PROGRESS" && groupAssessment.Status != "COMPLETED" {
					db.Model(&groupAssessment).Update("status", "IN_PROGRESS")
				}
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

	// 3. Fallback Generation (Self-Healing)
	// If no answers exist, check if this is Level 2 and needs dynamic generation
	if len(answers) == 0 && attempt.AssessmentLevelID != nil {
		var level models.AssessmentLevel
		if err := db.First(&level, *attempt.AssessmentLevelID).Error; err == nil && (level.LevelNumber == 2 || level.Name == "Level 2") {
			// Extract necessary metadata from session
			var setNumber int = 1 // Default
			var studentBoard string = ""
			var traitID *int64 = attempt.DominantTraitID

			if err := db.First(&session, attempt.AssessmentSessionID).Error; err == nil {
				if traitID == nil {
					// Check session metadata for Trait ID
					var meta map[string]interface{}
					if session.Metadata != "" && session.Metadata != "{}" {
						if err := json.Unmarshal([]byte(session.Metadata), &meta); err == nil {
							if val, ok := meta["personalityTraitId"]; ok {
								if v, ok := val.(float64); ok {
									tId := int64(v)
									traitID = &tId
								}
							}
						}
					}
				}

				// Check previous completed attempt if Trait ID is still nil
				if traitID == nil {
					var previousAttempt models.AssessmentAttempt
					if err := db.Where("assessment_session_id = ? AND dominant_trait_id IS NOT NULL AND status = 'COMPLETED'", attempt.AssessmentSessionID).Order("completed_at DESC").First(&previousAttempt).Error; err == nil {
						traitID = previousAttempt.DominantTraitID
					}
				}

				// Extract board and set info
				var meta map[string]interface{}
				if session.Metadata != "" && session.Metadata != "{}" {
					if err := json.Unmarshal([]byte(session.Metadata), &meta); err == nil {
						if val, ok := meta["setNumber"]; ok {
							if v, ok := val.(float64); ok {
								setNumber = int(v)
							} else if v, ok := val.(int); ok {
								setNumber = v
							}
						}
						// If board is in session meta (less likely but possible)
						if val, ok := meta["studentBoard"]; ok {
							if v, ok := val.(string); ok {
								studentBoard = v
							}
						}
					}
				}

				// Also try picking board from Registration metadata as a fallback
				if studentBoard == "" {
					var reg models.Registration
					if err := db.First(&reg, attempt.RegistrationID).Error; err == nil {
						var regMeta map[string]interface{}
						if reg.Metadata != "" && reg.Metadata != "{}" {
							if err := json.Unmarshal([]byte(reg.Metadata), &regMeta); err == nil {
								if val, ok := regMeta["studentBoard"]; ok {
									if v, ok := val.(string); ok {
										studentBoard = v
									}
								}
							}
						}
					}
				}

				if traitID != nil {
					// 3. Clear existing generic answers for this attempt (just in case of dirty state)
					db.Exec("DELETE FROM assessment_answers WHERE assessment_attempt_id = ?", attempt.ID)

					// 4. Generate questions based on constraints
					query := `
						INSERT INTO assessment_answers (
							assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
							main_question_id, question_source, status, question_sequence, created_at, updated_at
						)
						SELECT ?, ?, ?, ?, ?, ?, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY (board = ?) DESC, RANDOM()), NOW(), NOW()
						FROM assessment_questions 
						WHERE assessment_level_id = ? 
							AND personality_trait_id = ?
							AND (board = ? OR board IS NULL)
							AND set_number = ?
						ORDER BY (board = ?) DESC, RANDOM()
						LIMIT 25
					`
					args := []interface{}{
						attempt.ID, attempt.AssessmentSessionID, attempt.UserID, attempt.RegistrationID, attempt.ProgramID, *attempt.AssessmentLevelID,
						studentBoard, // for first ORDER BY clause in SELECT
						*attempt.AssessmentLevelID, *traitID, studentBoard, setNumber,
						studentBoard, // for ORDER BY clause
					}

					fmt.Printf("[GetExamQuestions - Fallback] Generating Level 2 Questions for Attempt %d. Trait=%d, Board=%s, Set=%d\n", attempt.ID, *traitID, studentBoard, setNumber)
					db.Exec(query, args...)

					// Re-fetch questions after generation
					result = db.Where("assessment_attempt_id = ?", attemptID).
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
				} else {
					fmt.Printf("[GetExamQuestions - Fallback Error] Cannot generate questions for Attempt %d: Trait ID is nil.\n", attempt.ID)
				}
			}
		}
	}

	return answers, nil
}

func (s *ExamService) SubmitAnswer(req models.StudentAnswer) error {
	db := repository.GetDB()

	// 1. Find the answer record
	var answerRecord models.AssessmentAnswer
	var query *gorm.DB

	// DEFINITIVE FIX: Use Primary Key of assessment_answers if available (Precision Update)
	if req.AssessmentAnswerID > 0 {
		query = db.First(&answerRecord, req.AssessmentAnswerID)
	} else {
		// Fallback Logic (Legacy)
		// Improve Precision: Use QuestionSource if available
		if req.QuestionSource != "" {
			if req.QuestionSource == "OPEN" {
				query = db.Where("assessment_attempt_id = ? AND open_question_id = ?", req.AttemptID, req.QuestionID)
			} else {
				// Assume MAIN if not OPEN (or explicit MAIN)
				query = db.Where("assessment_attempt_id = ? AND main_question_id = ?", req.AttemptID, req.QuestionID)
			}
		} else {
			// Fallback for legacy requests (Potentially ambiguous)
			query = db.Where("assessment_attempt_id = ? AND (main_question_id = ? OR open_question_id = ?)", req.AttemptID, req.QuestionID, req.QuestionID)
		}

		query = query.First(&answerRecord)
	}

	if query.Error != nil {
		fmt.Printf("[SubmitAnswer] ERROR: Record not found. AttemptID=%d QuestionID=%d AnswerID=%d Source=%s Error=%v\n",
			req.AttemptID, req.QuestionID, req.AssessmentAnswerID, req.QuestionSource, query.Error)
		return errors.New("question not found for this attempt")
	}

	fmt.Printf("[SubmitAnswer] DEBUG: Found Record ID=%d Status=%s. ReqQuestionID=%d MainQ=%v OpenQ=%v\n",
		answerRecord.ID, answerRecord.Status, req.QuestionID, answerRecord.MainQuestionID, answerRecord.OpenQuestionID)

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

	// Self-Healing: If Attempt Status is still NOT_STARTED (e.g. initial start race condition), force it to IN_PROGRESS
	// We do this asynchronously or simply fire-and-forget update
	go func(attemptID int64) {
		repoDB := repository.GetDB()
		var att models.AssessmentAttempt
		if err := repoDB.First(&att, attemptID).Error; err == nil {
			if att.Status == "NOT_STARTED" || att.Status == "NOT_YET_STARTED" {
				repoDB.Model(&att).Updates(map[string]interface{}{
					"status":     "IN_PROGRESS",
					"started_at": time.Now(),
				})
				// Also update Session if needed (Simplified)
				var sess models.AssessmentSession
				if err := repoDB.First(&sess, att.AssessmentSessionID).Error; err == nil {
					if sess.Status == "NOT_STARTED" || sess.Status == "NOT_YET_STARTED" {
						repoDB.Model(&sess).Updates(map[string]interface{}{
							"status":     "IN_PROGRESS",
							"started_at": time.Now(),
						})
					}
				}
			}
		}
	}(req.AttemptID)

	// Update fields
	answerRecord.TimeSpentSeconds += req.TimeTaken
	answerRecord.AnswerChangeCount = req.AnswerChangeCount
	answerRecord.Status = "ANSWERED"
	answerRecord.UpdatedAt = time.Now() // Ensure UpdatedAt is set

	fmt.Printf("[SubmitAnswer] DEBUG: Saving Record ID=%d Status=%s MainOption=%v OpenOption=%v\n",
		answerRecord.ID, answerRecord.Status, answerRecord.MainOptionID, answerRecord.OpenOptionID)

	if err := db.Save(&answerRecord).Error; err != nil {
		fmt.Printf("[SubmitAnswer] ERROR: Save Failed for ID=%d Error=%v\n", answerRecord.ID, err)
		return err
	}
	fmt.Printf("[SubmitAnswer] SUCCESS: Saved Answer ID=%d\n", answerRecord.ID)

	// Check if this was the last question
	var totalCounts int64
	var answeredCounts int64

	// Count total rows in answers table for this attempt (Total Questions)
	db.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ?", answerRecord.AssessmentAttemptID).Count(&totalCounts)

	// Count answered rows
	db.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ? AND status = ?", answerRecord.AssessmentAttemptID, "ANSWERED").Count(&answeredCounts)

	if totalCounts > 0 && answeredCounts == totalCounts {
		// Start Transaction (Concurrency Fix)
		err := db.Transaction(func(tx *gorm.DB) error {
			now := time.Now()

			// 1. Lock Attempt Row & Check Idempotency
			var lockedAttempt models.AssessmentAttempt
			if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&lockedAttempt, answerRecord.AssessmentAttemptID).Error; err != nil {
				return err
			}

			if lockedAttempt.Status == "COMPLETED" {
				fmt.Printf("[SubmitAnswer] IDEMPOTENCY HIT: Attempt %d already completed.\n", lockedAttempt.ID)
				return nil
			}

			// Fetch Level Context First
			var currentLevel models.AssessmentLevel
			if err := tx.First(&currentLevel, "id = ?", answerRecord.AssessmentLevelID).Error; err != nil {
				return err
			}

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
				tx.Raw(`
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
					if err := tx.Where("code = ?", dominantFactor).First(&trait).Error; err == nil {
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
				tx.Raw(`
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

			tx.Model(&models.AssessmentAnswer{}).Where("assessment_attempt_id = ?", answerRecord.AssessmentAttemptID).
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
			// Re-use lockedAttempt for metadata as it's fresh
			metaMap := make(map[string]interface{})
			if lockedAttempt.Metadata != "" && lockedAttempt.Metadata != "{}" {
				json.Unmarshal([]byte(lockedAttempt.Metadata), &metaMap)
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

			if err := tx.Model(&models.AssessmentAttempt{}).Where("id = ?", answerRecord.AssessmentAttemptID).Updates(updates).Error; err != nil {
				return err
			}

			// 5. Next Level Setup (Level 2 Generation)
			var nextLevel models.AssessmentLevel
			hasNextLevel := false

			// Check if a next level generally exists in the system (Check only MANDATORY levels)
			if err := tx.Where("level_number > ? AND is_mandatory = ?", currentLevel.LevelNumber, true).Order("level_number ASC").First(&nextLevel).Error; err == nil {

				// Check if this specific user/session HAS an attempt for this next level
				var nextAttempt models.AssessmentAttempt
				if err := tx.Where("assessment_session_id = ? AND assessment_level_id = ?", answerRecord.AssessmentSessionID, nextLevel.ID).First(&nextAttempt).Error; err == nil {

					// CASE A: Next Level Exists AND User has an attempt for it -> Unlock it
					hasNextLevel = true

					unlockAt := now.Add(time.Duration(nextLevel.UnlockAfterHours) * time.Hour)
					startWindow := 72
					if nextLevel.StartWithinHours > 0 {
						startWindow = nextLevel.StartWithinHours
					}
					expiresAt := unlockAt.Add(time.Duration(startWindow) * time.Hour)

					tx.Model(&nextAttempt).Updates(map[string]interface{}{
						"unlock_at":  unlockAt,
						"expires_at": expiresAt,
					})

					// Generate Questions for Next Level (Trait Based for Level 2)
					if nextLevel.LevelNumber == 2 && traitID != nil {
						// 1. Fetch Session Metadata for constraints (Board, Set)
						var session models.AssessmentSession
						var setNumber int = 1 // Default
						var studentBoard string = ""

						if err := tx.First(&session, nextAttempt.AssessmentSessionID).Error; err == nil {
							var meta map[string]interface{}
							if session.Metadata != "" && session.Metadata != "{}" {
								if err := json.Unmarshal([]byte(session.Metadata), &meta); err == nil {
									if val, ok := meta["setNumber"]; ok {
										// JSON numbers are often float64
										if v, ok := val.(float64); ok {
											setNumber = int(v)
										} else if v, ok := val.(int); ok {
											setNumber = v
										}
									}
									if val, ok := meta["studentBoard"]; ok {
										if v, ok := val.(string); ok {
											studentBoard = v
										}
									}
								}
							}
						}

						// Fallback to Registration metadata for board
						if studentBoard == "" {
							var reg models.Registration
							if err := tx.First(&reg, nextAttempt.RegistrationID).Error; err == nil {
								var regMeta map[string]interface{}
								if reg.Metadata != "" && reg.Metadata != "{}" {
									if err := json.Unmarshal([]byte(reg.Metadata), &regMeta); err == nil {
										if val, ok := regMeta["studentBoard"]; ok {
											if v, ok := val.(string); ok {
												studentBoard = v
											}
										}
									}
								}
							}
						}

						// 2. Clear existing generic questions (if any)
						tx.Exec("DELETE FROM assessment_answers WHERE assessment_attempt_id = ?", nextAttempt.ID)

						// 3. Insert new questions based on Trait + Constraints
						// Limit 25 is standard logic here
						query := `
							INSERT INTO assessment_answers (
								assessment_attempt_id, assessment_session_id, user_id, registration_id, program_id, assessment_level_id, 
								main_question_id, question_source, status, question_sequence, created_at, updated_at
							)
							SELECT ?, ?, ?, ?, ?, ?, id, 'MAIN', 'NOT_ANSWERED', ROW_NUMBER() OVER (ORDER BY (board = ?) DESC, RANDOM()), NOW(), NOW()
							FROM assessment_questions 
							WHERE assessment_level_id = ? 
							  AND personality_trait_id = ?
							  AND (board = ? OR board IS NULL)
							  AND set_number = ?
							ORDER BY (board = ?) DESC, RANDOM()
							LIMIT 25
						`
						args := []interface{}{
							nextAttempt.ID, nextAttempt.AssessmentSessionID, nextAttempt.UserID, nextAttempt.RegistrationID, nextAttempt.ProgramID, nextLevel.ID,
							studentBoard, // for first ORDER BY clause in SELECT
							nextLevel.ID, *traitID, studentBoard, setNumber,
							studentBoard, // for ORDER BY clause
						}

						tx.Exec(query, args...)
					}
				}
			}

			// CASE B: No Next Level (System-wide) OR No Attempt for Next Level (Program-specific) -> Mark Completed
			if !hasNextLevel {
				// This session is FULLY COMPLETED
				var session models.AssessmentSession
				if err := tx.First(&session, answerRecord.AssessmentSessionID).Error; err == nil {
					tx.Model(&session).Updates(map[string]interface{}{
						"status":       "COMPLETED",
						"completed_at": now,
					})

					// --- 🟢 GENERATE ASSESSMENT REPORT ---
					var existingReport models.AssessmentReports
					if err := tx.Where("assessment_session_id = ?", session.ID).First(&existingReport).Error; err != nil {
						// Report does not exist, create it

						// 1. Fetch Program Code
						var program models.Program
						tx.First(&program, session.ProgramID)

						// 2. Fetch Group (if applicable)
						groupIDStr := ""
						if session.GroupID != nil {
							groupIDStr = fmt.Sprintf("G%d-", *session.GroupID)
						}

						// 3. Generate Report Number Prefix
						// Format: OBI-G{group_id}-{Month/Year}-{Program code}-
						dateStr := now.Format("01/06") // Month/Year (e.g., 06/25)
						reportPrefix := fmt.Sprintf("OBI-%s%s-%s-", groupIDStr, dateStr, program.Code)

						// 4. Calculate Sequence Number
						var count int64
						tx.Model(&models.AssessmentReports{}).Where("report_number LIKE ?", reportPrefix+"%").Count(&count)
						seqNum := count + 1
						reportNumber := fmt.Sprintf("%s%03d", reportPrefix, seqNum)

						// 5. Aggregate Data from Attempts
						var attempts []models.AssessmentAttempt
						tx.Where("assessment_session_id = ?", session.ID).Find(&attempts)

						discScores := "{}"
						agileScores := "{}"
						level3Scores := "{}"
						level4Scores := "{}"
						var overallSincerity float64
						var dominantTraitID *int64

						// Loop attempts to extract scores based on level
						for _, att := range attempts {
							// Parse Level Info
							var level models.AssessmentLevel
							tx.First(&level, att.AssessmentLevelID)

							// Attempt Metadata
							var meta map[string]interface{}
							if att.Metadata != "" && att.Metadata != "{}" {
								json.Unmarshal([]byte(att.Metadata), &meta)
							}

							if level.LevelNumber == 1 || level.Name == "Level 1" || level.PatternType == "DISC" {
								// DISC Scores
								if val, ok := meta["disc_scores"]; ok {
									bytes, _ := json.Marshal(val)
									discScores = string(bytes)
								}
								overallSincerity = att.SincerityIndex
								dominantTraitID = att.DominantTraitID
							} else if level.LevelNumber == 2 || level.Name == "Level 2" {
								// Agile Scores
								if val, ok := meta["agile_scores"]; ok {
									bytes, _ := json.Marshal(val)
									agileScores = string(bytes)
								}
							}
						}

						fmt.Printf("DEBUG: Generating Report -> Prefix: %s, Number: %s\n", reportPrefix, reportNumber)

						// Create Report Record
						newReport := models.AssessmentReports{
							AssessmentSessionID: session.ID,
							ReportNumber:        reportNumber,
							GeneratedAt:         now,
							DiscScores:          discScores,
							AgileScores:         agileScores,
							Level3Scores:        level3Scores,
							Level4Scores:        level4Scores,
							OverallSincerity:    overallSincerity,
							DominantTraitID:     dominantTraitID,
							Metadata:            "{}",
						}

						// Save
						if err := tx.Create(&newReport).Error; err != nil {
							fmt.Printf("ERROR: Failed to create Assessment Report: %v\n", err)
						} else {
							fmt.Printf("SUCCESS: Assessment Report Created. ID: %d\n", newReport.ID)
						}
					}

					// Update Group Assessment Status
					if session.GroupID != nil {
						var groupAssessment models.GroupAssessment
						tx.Where("group_id = ? AND program_id = ?", *session.GroupID, session.ProgramID).First(&groupAssessment)

						var stats struct {
							Total     int64
							Started   int64
							Completed int64
						}

						// Count sessions in the group for this program
						tx.Model(&models.AssessmentSession{}).
							Where("group_id = ? AND program_id = ?", *session.GroupID, session.ProgramID).
							Select("COUNT(*) as total, COUNT(*) FILTER (WHERE status != 'NOT_STARTED') as started, COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed").
							Scan(&stats)

						newStatus := "NOT_STARTED"
						isExpired := groupAssessment.ValidTo != nil && groupAssessment.ValidTo.Before(now)

						if stats.Total > 0 {
							if stats.Completed == stats.Total {
								newStatus = "COMPLETED"
							} else if isExpired {
								if stats.Started > 0 {
									// Some completed or started but unfinished AND time expired
									newStatus = "PARTIALLY_EXPIRED"
								} else {
									// No one started AND time expired
									newStatus = "EXPIRED"
								}
							} else {
								// Not Expired
								if stats.Started > 0 {
									newStatus = "IN_PROGRESS"
								}
							}
						}

						// Update the GroupAssessment status
						tx.Model(&models.GroupAssessment{}).
							Where("group_id = ? AND program_id = ?", *session.GroupID, session.ProgramID).
							Update("status", newStatus)
					}
				}
			}

			return nil
		})

		if err != nil {
			fmt.Printf("[SubmitAnswer] ERROR: Transaction Failed: %v\n", err)
			return err
		}
	}

	return nil
}

func (s *ExamService) IsLastLevel(attemptID int64) (bool, error) {
	db := repository.GetDB()

	var attempt models.AssessmentAttempt
	if err := db.First(&attempt, attemptID).Error; err != nil {
		return false, err
	}

	if attempt.AssessmentLevelID == nil {
		return false, errors.New("level id is nil")
	}

	var currentLevel models.AssessmentLevel
	if err := db.First(&currentLevel, *attempt.AssessmentLevelID).Error; err != nil {
		return false, err
	}

	// Check count of attempts in same session with higher level number
	var count int64
	// Filter out CANCELLED or other invalid statuses if necessary, but mainly just check existence
	err := db.Table("assessment_attempts").
		Joins("JOIN assessment_levels ON assessment_levels.id = assessment_attempts.assessment_level_id").
		Where("assessment_attempts.assessment_session_id = ? AND assessment_attempts.status != 'CANCELLED' AND assessment_levels.level_number > ?",
			attempt.AssessmentSessionID, currentLevel.LevelNumber).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count == 0, nil
}
