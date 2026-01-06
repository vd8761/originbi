package models

// StudentAnswer represents the payload for submitting an answer
type StudentAnswer struct {
	AttemptID         int64 `json:"attempt_id" binding:"required"`
	QuestionID        int64 `json:"question_id" binding:"required"`
	SelectedOption    int64 `json:"selected_option" binding:"required"`
	TimeTaken         int   `json:"time_taken"` // in seconds
	AnswerChangeCount int   `json:"answer_change_count"`
}

// ExamStartRequest represents the request to start an exam
type ExamStartRequest struct {
	StudentID int64 `json:"student_id" binding:"required"`
	ExamID    int64 `json:"exam_id" binding:"required"`
}

// ServiceResponse is a standard API response wrapper
type ServiceResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
