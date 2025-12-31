package models

import (
	"time"
)

// Table: assessment_answers
type AssessmentAnswer struct {
	ID                    string `gorm:"primaryKey;type:uuid;default:gen_random_uuid()" json:"id"`
	AssessmentAttemptID   string `gorm:"type:uuid;not null" json:"assessment_attempt_id"`
	AssessmentSessionID   string `gorm:"type:uuid;not null" json:"assessment_session_id"`
	
	MainQuestionID        *string `gorm:"type:uuid" json:"main_question_id"`
	MainQuestion          *AssessmentQuestion `gorm:"foreignKey:MainQuestionID;references:ID" json:"main_question"`

	OpenQuestionID        *string `gorm:"type:uuid" json:"open_question_id"`
	OpenQuestion          *OpenQuestion `gorm:"foreignKey:OpenQuestionID;references:ID" json:"open_question"`
	
	// Answer columns
	MainOptionID          *string `gorm:"type:uuid" json:"main_option_id"`
	OpenOptionID          *string `gorm:"type:uuid" json:"open_option_id"` 
	AnswerText            string  `gorm:"type:text" json:"answer_text"`
	AnswerScore           float64 `gorm:"type:numeric" json:"answer_score"`
	TimeSpendInSeconds    int     `gorm:"type:integer" json:"time_spend_in_seconds"`
	
	// Flags
	IsMultipleSelection   bool `gorm:"default:false" json:"is_multiple_selection"`
	AnswerChangeCount     int  `gorm:"default:0" json:"answer_change_count"`
	IsAttentionFail       bool `gorm:"default:false" json:"is_attention_fail"`
	IsDistractionChoosen  bool `gorm:"default:false" json:"is_distraction_choosen"`
	SincerityScore        float64 `gorm:"type:numeric" json:"sincerity_score"`
	Status                string `gorm:"type:varchar(50)" json:"status"`
	
	CreatedAt             time.Time `json:"created_at"`
	UpdatedAt             time.Time `json:"updated_at"`
}

// Table: assessment_questions
type AssessmentQuestion struct {
	ID       string `gorm:"primaryKey;type:uuid" json:"id"`
	Question string `gorm:"column:question_text_en;type:text" json:"question"`
	Options  []AssessmentQuestionOption `gorm:"foreignKey:QuestionID" json:"options"`
}

// Table: assessment_question_options
type AssessmentQuestionOption struct {
	ID             string  `gorm:"primaryKey;column:id" json:"id"`
	QuestionID     string  `gorm:"column:question_id" json:"question_id"`
	OptionText     string  `gorm:"column:option_text_en" json:"option_text"`
	DiscFactor     *string `gorm:"column:disc_factor" json:"disc_factor"`
	Score          float64 `gorm:"column:score_value" json:"score"`
	IsCorrect      bool    `gorm:"column:is_correct" json:"is_correct"`
	DisplayOrder   int     `gorm:"column:display_order" json:"display_order"`
}

// Table: open_questions
type OpenQuestion struct {
	ID       string `gorm:"primaryKey;type:uuid" json:"id"`
	Question string `gorm:"column:question_text_en;type:text" json:"question"`
	Options  []OpenQuestionOption `gorm:"foreignKey:OpenQuestionID" json:"options"`
	Images   []OpenQuestionImage  `gorm:"foreignKey:OpenQuestionID" json:"images"`
}

// Table: open_questions_options
type OpenQuestionOption struct {
	ID             string `gorm:"primaryKey;type:uuid" json:"id"`
	OpenQuestionID     string `gorm:"column:open_question_id;type:uuid" json:"open_question_id"`
	OptionText     string `gorm:"type:text" json:"option_text"`
}

// Table: open_question_images
type OpenQuestionImage struct {
	ID             string `gorm:"primaryKey;type:uuid" json:"id"`
	OpenQuestionID string `gorm:"column:open_question_id;type:uuid" json:"open_question_id"`
	ImageUrl       string `gorm:"type:text" json:"image_url"`
}
