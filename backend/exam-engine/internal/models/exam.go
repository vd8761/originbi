package models

// StudentAnswer represents the payload for submitting an answer
type StudentAnswer struct {
	AttemptID   string `json:"attempt_id" binding:"required"`
	QuestionID  string `json:"question_id" binding:"required"`
	SelectedOption string `json:"selected_option" binding:"required"`
	TimeTaken   int    `json:"time_taken"` // in seconds
}

// ExamStartRequest represents the request to start an exam
type ExamStartRequest struct {
	StudentID string `json:"student_id" binding:"required"`
	ExamID    string `json:"exam_id" binding:"required"`
}

// ServiceResponse is a standard API response wrapper
type ServiceResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}
