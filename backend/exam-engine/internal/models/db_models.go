package models

import (
	"time"
)

// Table: assessment_attempts
type AssessmentAttempt struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	AssessmentSessionID int64      `gorm:"not null" json:"assessment_session_id"`
	UserID              int64      `gorm:"not null" json:"user_id"`
	RegistrationID      int64      `gorm:"not null" json:"registration_id"`
	ProgramID           int64      `gorm:"not null" json:"program_id"`
	UnlockAt            *time.Time `gorm:"type:timestamp with time zone" json:"unlock_at"`
	ExpiresAt           *time.Time `gorm:"type:timestamp with time zone" json:"expires_at"`
	StartedAt           *time.Time `gorm:"type:timestamp with time zone" json:"started_at"`
	MustFinishBy        *time.Time `gorm:"type:timestamp with time zone" json:"must_finish_by"`
	CompletedAt         *time.Time `gorm:"type:timestamp with time zone" json:"completed_at"`
	Status              string     `gorm:"type:varchar(20);default:'NOT_STARTED'" json:"status"`
	TotalScore          float64    `gorm:"type:numeric(10,2)" json:"total_score"`
	MaxScoreSnapshot    int        `gorm:"type:integer" json:"max_score_snapshot"`
	SincerityIndex      float64    `gorm:"type:numeric(5,2)" json:"sincerity_index"`
	SincerityClass      string     `gorm:"type:varchar(20)" json:"sincerity_class"`
	DominantTraitID     *int64     `json:"dominant_trait_id"`
	Metadata            string     `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt           time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt           time.Time  `gorm:"default:now()" json:"updated_at"`
	AssessmentLevelID   *int       `gorm:"type:integer" json:"assessment_level_id"`
}

// Table: assessment_levels
type AssessmentLevel struct {
	ID               int       `gorm:"primaryKey;autoIncrement" json:"id"`
	LevelNumber      int       `gorm:"type:smallint;not null;unique" json:"level_number"`
	Name             string    `gorm:"type:varchar(255);not null" json:"name"`
	Description      string    `gorm:"type:text" json:"description"`
	PatternType      string    `gorm:"type:varchar(50)" json:"pattern_type"`
	UnlockAfterHours int       `gorm:"default:0" json:"unlock_after_hours"`
	StartWithinHours int       `gorm:"default:72" json:"start_within_hours"`
	DurationMinutes  int       `gorm:"default:40" json:"duration_minutes"`
	MaxScore         int       `gorm:"type:integer" json:"max_score"`
	SortOrder        int       `gorm:"type:smallint;default:0" json:"sort_order"`
	IsMandatory      bool      `gorm:"default:false" json:"is_mandatory"`
	CreatedAt        time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt        time.Time `gorm:"default:current_timestamp" json:"updated_at"`
}

// Table: assessment_answers
type AssessmentAnswer struct {
	ID                  int64 `gorm:"primaryKey;autoIncrement" json:"id"`
	AssessmentAttemptID int64 `gorm:"not null" json:"assessment_attempt_id"`
	AssessmentSessionID int64 `gorm:"not null" json:"assessment_session_id"`
	UserID              int64 `gorm:"not null" json:"user_id"`
	RegistrationID      int64 `gorm:"not null" json:"registration_id"`
	ProgramID           int64 `gorm:"not null" json:"program_id"`
	AssessmentLevelID   int64 `gorm:"not null" json:"assessment_level_id"`

	QuestionSource string              `gorm:"type:varchar(10);not null" json:"question_source"`
	MainQuestionID *int64              `gorm:"index" json:"main_question_id"`
	MainQuestion   *AssessmentQuestion `gorm:"foreignKey:MainQuestionID;references:ID" json:"main_question"`

	OpenQuestionID *int64        `gorm:"index" json:"open_question_id"`
	OpenQuestion   *OpenQuestion `gorm:"foreignKey:OpenQuestionID;references:ID" json:"open_question"`

	QuestionSequence     int    `gorm:"type:smallint" json:"question_sequence"`
	QuestionOptionsOrder string `gorm:"type:varchar(200)" json:"question_options_order"`

	// Answer columns
	MainOptionID     *int64  `gorm:"index" json:"main_option_id"`
	OpenOptionID     *int64  `gorm:"index" json:"open_option_id"`
	AnswerText       string  `gorm:"type:text" json:"answer_text"`
	AnswerScore      float64 `gorm:"type:numeric(10,2);default:0" json:"answer_score"`
	TimeSpentSeconds int     `gorm:"column:time_spent_seconds;default:0" json:"time_spent_seconds"`

	// Flags
	IsMultipleSelection bool   `gorm:"default:false" json:"is_multiple_selection"`
	AnswerChangeCount   int    `gorm:"default:0" json:"answer_change_count"`
	IsAttentionFail     bool   `gorm:"default:false" json:"is_attention_fail"`
	IsDistractionChosen bool   `gorm:"column:is_distraction_chosen;default:false" json:"is_distraction_chosen"`
	SincerityFlag       int    `gorm:"column:sincerity_flag" json:"sincerity_flag"`
	Status              string `gorm:"type:varchar(20);default:'NOT_ANSWERED'" json:"status"`
	Metadata            string `gorm:"type:jsonb;default:'{}'" json:"metadata"`

	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: assessment_questions
type AssessmentQuestion struct {
	ID                 int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	AssessmentLevelID  int64     `gorm:"not null" json:"assessment_level_id"`
	ProgramID          int64     `gorm:"not null" json:"program_id"`
	SetNumber          int       `gorm:"type:smallint;not null" json:"set_number"`
	ExternalCode       string    `gorm:"type:varchar(50)" json:"external_code"`
	ContextTextEn      *string   `gorm:"column:context_text_en;type:text" json:"context_text_en"`
	QuestionTextEn     string    `gorm:"column:question_text_en;type:text" json:"question_text_en"`
	ContextTextTa      *string   `gorm:"column:context_text_ta;type:text" json:"context_text_ta"`
	QuestionTextTa     *string   `gorm:"column:question_text_ta;type:text" json:"question_text_ta"`
	Metadata           string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	Category           string    `gorm:"type:varchar(100)" json:"category"`
	PersonalityTraitID *int64    `json:"personality_trait_id"`
	IsActive           bool      `gorm:"default:true" json:"is_active"`
	IsDeleted          bool      `gorm:"default:false" json:"is_deleted"`
	CreatedByUserID    *int64    `json:"created_by_user_id"`
	CreatedAt          time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt          time.Time `gorm:"default:current_timestamp" json:"updated_at"`

	// Relations
	Options []AssessmentQuestionOption `gorm:"foreignKey:QuestionID" json:"options"`
}

// Table: assessment_question_options
type AssessmentQuestionOption struct {
	ID           int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	QuestionID   int64     `gorm:"not null" json:"question_id"`
	DisplayOrder int       `gorm:"type:smallint;default:1;not null" json:"display_order"`
	OptionTextEn string    `gorm:"column:option_text_en;type:text" json:"option_text_en"`
	OptionTextTa *string   `gorm:"column:option_text_ta;type:text" json:"option_text_ta"`
	DiscFactor   *string   `gorm:"column:disc_factor;type:varchar(10)" json:"disc_factor"`
	ScoreValue   float64   `gorm:"column:score_value;type:numeric(5,2);default:0" json:"score_value"`
	IsCorrect    bool      `gorm:"column:is_correct;default:false" json:"is_correct"`
	Metadata     string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	IsDeleted    bool      `gorm:"default:false" json:"is_deleted"`
	CreatedAt    time.Time `gorm:"default:current_timestamp" json:"created_at"`
	UpdatedAt    time.Time `gorm:"default:current_timestamp" json:"updated_at"`

	// Fallback Compat for Frontend if needed
	OptionText string `gorm:"-" json:"option_text"`
}

// Table: assessment_reports
type AssessmentReports struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	AssessmentSessionID int64      `gorm:"not null;unique" json:"assessment_session_id"`
	ReportNumber        string     `gorm:"type:varchar(150);not null;unique" json:"report_number"`
	ReportPassword      string     `gorm:"type:varchar(150)" json:"report_password"`
	ReportUrl           string     `gorm:"type:text" json:"report_url"`
	GeneratedAt         time.Time  `gorm:"default:now()" json:"generated_at"`
	DiscScores          string     `gorm:"type:jsonb" json:"disc_scores"`
	AgileScores         string     `gorm:"type:jsonb" json:"agile_scores"`
	Level3Scores        string     `gorm:"type:jsonb" json:"level3_scores"`
	Level4Scores        string     `gorm:"type:jsonb" json:"level4_scores"`
	OverallSincerity    float64    `gorm:"type:numeric(5,2)" json:"overall_sincerity"`
	DominantTraitID     *int64     `json:"dominant_trait_id"`
	EmailSent           bool       `gorm:"default:false" json:"email_sent"`
	EmailSentAt         *time.Time `json:"email_sent_at"`
	EmailSentTo         string     `gorm:"type:varchar(255)" json:"email_sent_to"`
	Metadata            string     `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt           time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt           time.Time  `gorm:"default:now()" json:"updated_at"`
}

// Table: assessment_sessions
type AssessmentSession struct {
	ID             int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID         int64      `gorm:"not null" json:"user_id"`
	RegistrationID int64      `gorm:"not null" json:"registration_id"`
	ProgramID      int64      `gorm:"not null;default:0" json:"program_id"`
	GroupID        *int64     `json:"group_id"`
	Status         string     `gorm:"type:varchar(20);default:'NOT_STARTED'" json:"status"`
	ValidFrom      *time.Time `gorm:"type:timestamp with time zone" json:"valid_from"`
	ValidTo        *time.Time `gorm:"type:timestamp with time zone" json:"valid_to"`
	StartedAt      *time.Time `gorm:"type:timestamp with time zone" json:"started_at"`
	CompletedAt    *time.Time `gorm:"type:timestamp with time zone" json:"completed_at"`
	IsReportReady  bool       `gorm:"default:false" json:"is_report_ready"`
	Metadata       string     `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt      time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"default:now()" json:"updated_at"`
}

// Table: corporate_accounts
type CorporateAccount struct {
	ID                int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID            int64     `gorm:"not null;unique" json:"user_id"`
	CompanyName       string    `gorm:"type:varchar(250);not null" json:"company_name"`
	SectorCode        string    `gorm:"type:varchar(50)" json:"sector_code"`
	JobTitle          string    `gorm:"type:varchar(100)" json:"job_title"`
	EmployeeRefID     string    `gorm:"type:varchar(100)" json:"employee_ref_id"`
	CountryCode       string    `gorm:"type:varchar(10)" json:"country_code"`
	MobileNumber      string    `gorm:"type:varchar(20)" json:"mobile_number"`
	TotalCredits      int       `gorm:"default:0" json:"total_credits"`
	AvailableCredits  int       `gorm:"default:0" json:"available_credits"`
	IsActive          bool      `gorm:"default:true" json:"is_active"`
	IsBlocked         bool      `gorm:"default:false" json:"is_blocked"`
	FullName          string    `gorm:"type:varchar(200)" json:"full_name"`
	Gender            string    `gorm:"type:varchar(20)" json:"gender"`
	LinkedinUrl       string    `json:"linkedin_url"`
	BusinessLocations string    `json:"business_locations"`
	CreatedAt         time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt         time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: corporate_credit_ledger
type CorporateCreditLedger struct {
	ID                 int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	CorporateAccountID int64      `gorm:"not null" json:"corporate_account_id"`
	CreditDelta        int        `gorm:"not null" json:"credit_delta"`
	Reason             string     `gorm:"type:text" json:"reason"`
	CreatedByUserID    *int64     `json:"created_by_user_id"`
	LedgerType         string     `gorm:"type:varchar(10)" json:"ledger_type"`
	PerCreditCost      float64    `gorm:"type:numeric(10,2)" json:"per_credit_cost"`
	TotalAmount        float64    `gorm:"type:numeric(10,2)" json:"total_amount"`
	PaymentStatus      string     `gorm:"type:varchar(20);default:'NA'" json:"payment_status"`
	PaidOn             *time.Time `json:"paid_on"`
	CreatedAt          time.Time  `gorm:"default:now()" json:"created_at"`
	RazorpayOrderID    string     `json:"razorpay_order_id"`
	RazorpayPaymentID  string     `json:"razorpay_payment_id"`
}

func (CorporateCreditLedger) TableName() string {
	return "corporate_credit_ledger"
}

// Table: degree_types
type DegreeType struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(50);not null" json:"name"`
	Level     string    `gorm:"type:varchar(20)" json:"level"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	IsDeleted bool      `gorm:"default:false" json:"is_deleted"`
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: department_degrees
type DepartmentDegree struct {
	ID             int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	DepartmentID   int64     `gorm:"not null" json:"department_id"`
	DegreeTypeID   int64     `gorm:"not null" json:"degree_type_id"`
	CourseDuration int       `gorm:"type:smallint;not null" json:"course_duration"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	IsDeleted      bool      `gorm:"default:false" json:"is_deleted"`
	CreatedAt      time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt      time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: departments
type Department struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:text;not null" json:"name"`
	ShortName string    `gorm:"type:varchar(50)" json:"short_name"`
	Category  string    `gorm:"type:varchar(50)" json:"category"`
	Metadata  string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	IsDeleted bool      `gorm:"default:false" json:"is_deleted"`
	CreatedAt time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: groups
type Group struct {
	ID                 int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code               string    `gorm:"type:varchar(100)" json:"code"`
	Name               string    `gorm:"type:text;not null" json:"name"`
	CorporateAccountID *int64    `json:"corporate_account_id"`
	ResellerAccountID  *int64    `json:"reseller_account_id"`
	CreatedByUserID    *int64    `json:"created_by_user_id"`
	IsDefault          bool      `gorm:"default:false" json:"is_default"`
	IsActive           bool      `gorm:"default:true" json:"is_active"`
	IsDeleted          bool      `gorm:"default:false" json:"is_deleted"`
	Metadata           string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	CreatedAt          time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt          time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: open_question_images
type OpenQuestionImage struct {
	ID             int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	OpenQuestionID int64     `gorm:"not null" json:"open_question_id"`
	ImageFile      string    `gorm:"type:varchar(255);not null;column:image_file" json:"image_url"` // Check this mapping
	DisplayOrder   int       `gorm:"type:smallint;default:1" json:"display_order"`
	IsActive       bool      `gorm:"default:true" json:"is_active"`
	IsDeleted      bool      `gorm:"default:false" json:"is_deleted"`
	CreatedAt      time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt      time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: open_question_options
type OpenQuestionOption struct {
	ID              int64     `gorm:"primaryKey;autoIncrement;column:id" json:"id"`
	OpenQuestionID  int64     `gorm:"not null;column:open_question_id" json:"open_question_id"`
	OptionType      string    `gorm:"type:varchar(20);not null;column:option_type" json:"option_type"`
	OptionTextEn    string    `gorm:"column:option_text_en;type:text" json:"option_text_en"`
	OptionTextTa    *string   `gorm:"column:option_text_ta;type:text" json:"option_text_ta"`
	OptionImageFile string    `gorm:"column:option_image_file;type:varchar(255)" json:"option_image_file"`
	IsValid         bool      `gorm:"column:is_valid;default:false" json:"is_valid"`
	DisplayOrder    int       `gorm:"column:display_order;type:smallint;default:1" json:"display_order"`
	IsActive        bool      `gorm:"column:is_active;default:true" json:"is_active"`
	IsDeleted       bool      `gorm:"column:is_deleted;default:false" json:"is_deleted"`
	CreatedAt       time.Time `gorm:"column:created_at;default:now()" json:"created_at"`
	UpdatedAt       time.Time `gorm:"column:updated_at;default:now()" json:"updated_at"`

	// Compat
	OptionText string `gorm:"-" json:"option_text"`
}

// Table: open_questions
type OpenQuestion struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	QuestionType    string    `gorm:"type:varchar(30);not null" json:"question_type"`
	MediaType       string    `gorm:"type:varchar(20);not null" json:"media_type"`
	QuestionTextEn  string    `gorm:"column:question_text_en;type:text" json:"question_text_en"`
	QuestionTextTa  *string   `gorm:"column:question_text_ta;type:text" json:"question_text_ta"`
	AudioFile       string    `gorm:"type:varchar(255)" json:"audio_file"`
	VideoFile       string    `gorm:"type:varchar(255)" json:"video_file"`
	DocumentFile    string    `gorm:"type:varchar(255)" json:"document_file"`
	Metadata        string    `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	IsDeleted       bool      `gorm:"default:false" json:"is_deleted"`
	CreatedByUserID *int64    `json:"created_by_user_id"`
	CreatedAt       time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt       time.Time `gorm:"default:now()" json:"updated_at"`

	// Default/Compat for Frontend
	Question string `gorm:"-" json:"question"`

	Options []OpenQuestionOption `gorm:"foreignKey:OpenQuestionID" json:"options"`
	Images  []OpenQuestionImage  `gorm:"foreignKey:OpenQuestionID" json:"images"`
}

// Table: programs
type Program struct {
	ID              int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	Code            string    `gorm:"type:varchar(50);not null;unique" json:"code"`
	Name            string    `gorm:"type:varchar(255);not null" json:"name"`
	Description     string    `gorm:"type:text" json:"description"`
	AssessmentTitle string    `gorm:"type:varchar(255)" json:"assessment_title"`
	ReportTitle     string    `gorm:"type:varchar(255)" json:"report_title"`
	IsDemo          bool      `gorm:"default:false" json:"is_demo"`
	IsActive        bool      `gorm:"default:true" json:"is_active"`
	CreatedAt       time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt       time.Time `gorm:"default:now()" json:"updated_at"`
}

// Table: registrations
type Registration struct {
	ID                  int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID              int64      `gorm:"not null" json:"user_id"`
	RegistrationSource  string     `gorm:"type:varchar(20);default:'SELF'" json:"registration_source"`
	CreatedByUserID     *int64     `json:"created_by_user_id"`
	CorporateAccountID  *int64     `json:"corporate_account_id"`
	ResellerAccountID   *int64     `json:"reseller_account_id"`
	SchoolLevel         string     `gorm:"type:varchar(20)" json:"school_level"`
	SchoolStream        string     `gorm:"type:varchar(20)" json:"school_stream"`
	DepartmentDegreeID  *int64     `json:"department_degree_id"`
	GroupID             *int64     `json:"group_id"`
	PaymentRequired     bool       `gorm:"default:false" json:"payment_required"`
	PaymentProvider     string     `gorm:"type:varchar(20)" json:"payment_provider"`
	PaymentReference    string     `gorm:"type:varchar(100)" json:"payment_reference"`
	PaymentAmount       float64    `gorm:"type:numeric(10,2)" json:"payment_amount"`
	PaymentStatus       string     `gorm:"type:varchar(20);default:'NOT_REQUIRED'" json:"payment_status"`
	PaymentCreatedAt    *time.Time `json:"payment_created_at"`
	PaidAt              *time.Time `json:"paid_at"`
	Status              string     `gorm:"type:varchar(20);default:'INCOMPLETE'" json:"status"`
	Metadata            string     `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsDeleted           bool       `gorm:"default:false" json:"is_deleted"`
	CreatedAt           time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt           time.Time  `gorm:"default:now()" json:"updated_at"`
	CountryCode         string     `gorm:"type:varchar(10);default:'+91'" json:"country_code"`
	MobileNumber        string     `gorm:"type:varchar(20);not null" json:"mobile_number"`
	Gender              string     `gorm:"type:varchar(10)" json:"gender"`
	FullName            string     `gorm:"type:varchar(255)" json:"full_name"`
	ProgramID           *int64     `json:"program_id"`
	AssessmentSessionID *int64     `json:"assessment_session_id"`
}

// Table: user_action_logs
type UserActionLog struct {
	ID             string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	AttemptCount   int       `gorm:"default:0" json:"attempt_count"`
	ActionDate     time.Time `gorm:"type:date;not null" json:"action_date"`
	UserID         int64     `gorm:"not null" json:"user_id"`
	CreatedAt      time.Time `gorm:"default:now()" json:"created_at"`
	UpdatedAt      time.Time `gorm:"default:now()" json:"updated_at"`
	RegistrationID string    `json:"registration_id"`
	Role           string    `gorm:"type:user_action_logs_role_enum" json:"role"`
	ActionType     string    `gorm:"type:user_action_logs_action_type_enum;not null" json:"action_type"`
}

// Table: users
type User struct {
	ID            int64      `gorm:"primaryKey;autoIncrement" json:"id"`
	EmailVerified bool       `gorm:"default:false" json:"email_verified"`
	FirstLoginAt  *time.Time `json:"first_login_at"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	LoginCount    int        `gorm:"default:0" json:"login_count"`
	Metadata      string     `gorm:"type:jsonb;default:'{}'" json:"metadata"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	IsBlocked     bool       `gorm:"default:false" json:"is_blocked"`
	CorporateID   string     `json:"corporate_id"`
	CognitoSub    string     `json:"cognito_sub"`
	Email         string     `json:"email"`
	Role          string     `json:"role"`
	AvatarUrl     string     `json:"avatar_url"`
	LastLoginIP   string     `gorm:"column:last_login_ip" json:"last_login_ip"`
	CreatedAt     time.Time  `gorm:"default:now()" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"default:now()" json:"updated_at"`
}

// Table: personality_traits
type PersonalityTrait struct {
	ID               int64  `gorm:"primaryKey;autoIncrement" json:"id"`
	Code             string `gorm:"type:varchar(10);not null" json:"code"`
	BlendedStyleName string `gorm:"type:varchar(100)" json:"blended_style_name"`
	BlendedStyleDesc string `gorm:"type:text" json:"blended_style_desc"`
}
