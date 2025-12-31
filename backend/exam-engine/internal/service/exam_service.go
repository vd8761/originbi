package service

import (
	"exam-engine/internal/models"
	"exam-engine/internal/repository"
	"errors"
)

type ExamService struct{}

func NewExamService() *ExamService {
	return &ExamService{}
}

func (s *ExamService) GetExamQuestions(attemptID string) ([]models.AssessmentAnswer, error) {
	db := repository.GetDB()
	var answers []models.AssessmentAnswer

	// Fetch all answers rows which conceptually represent the questions assigned to this attempt
	// We preload relations to get the full question text and options
	result := db.Where("assessment_attempt_id = ?", attemptID).
		Preload("MainQuestion").
		Preload("MainQuestion.Options").
		Preload("OpenQuestion").
		Preload("OpenQuestion.Options").
		Preload("OpenQuestion.Images").
		Find(&answers)

	if result.Error != nil {
		return nil, result.Error
	}

	return answers, nil
}

func (s *ExamService) SubmitAnswer(req models.StudentAnswer) error {
	db := repository.GetDB()

	// 1. Find the answer record using ID (assuming QuestionID in request is actually the AnswerRecord ID or we query by attempt + question_id)
	// The user said "Respective Level Questions available in the assessment_answers table".
	// The frontend likely sends the ID of the `AssessmentAnswer` row it received.
	// OR it sends the QuestionID and we have to find the matching row in `assessment_answers` for this attempt.
	// Let's assume QuestionID in request payload maps to AssessmentAnswer.ID for simplicity, or we match by questions.
	
	// If the payload QuestionID is the actual MainQuestionID/OpenQuestionID, we need to find the record in assessment_answers
	// where (main_question_id = ? OR open_question_id = ?) AND assessment_attempt_id = ?

	var answerRecord models.AssessmentAnswer
	// Try finding by ID first if logic matches, else query by attempt + question ID
	// Let's try matching by MainQuestionID or OpenQuestionID within the attempt
	
	query := db.Where("assessment_attempt_id = ? AND (main_question_id = ? OR open_question_id = ?)", req.AttemptID, req.QuestionID, req.QuestionID).First(&answerRecord)
	if query.Error != nil {
		return errors.New("question not found for this attempt")
	}

	// 2. Update the record
	// Determine if it matches Main or Open
	if answerRecord.MainQuestionID != nil && *answerRecord.MainQuestionID == req.QuestionID {
		answerRecord.MainOptionID = &req.SelectedOption
	} else if answerRecord.OpenQuestionID != nil && *answerRecord.OpenQuestionID == req.QuestionID {
		answerRecord.OpenOptionID = &req.SelectedOption
	}

	// Update other fields
	answerRecord.TimeSpendInSeconds += req.TimeTaken // Increment time? or Set? User said "time spend in seconds want to store". Usually accumulative or set. Let's assume passed total or increment. Let's just set it for now or assume logic. User said "time spend... want to store".
	// If multiple selection
	// answerRecord.IsMultipleSelection = ... (logic depends on if multiple options sent, here we assume one option for now)
	
	answerRecord.AnswerChangeCount++ 
	// answerRecord.Status = "answered"

	return db.Save(&answerRecord).Error
}
