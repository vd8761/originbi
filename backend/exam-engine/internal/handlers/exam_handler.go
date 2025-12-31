package handlers

import (
	"exam-engine/internal/models"
	"exam-engine/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ExamHandler struct {
	service *service.ExamService
}

func NewExamHandler() *ExamHandler {
	return &ExamHandler{
		service: service.NewExamService(),
	}
}

func (h *ExamHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "exam-engine",
	})
}

func (h *ExamHandler) StartExam(c *gin.Context) {
	var req models.ExamStartRequest
	// User StartExam payload might just need attempt_id if session is already created?
	// The models.ExamStartRequest has StudentID, ExamID. 
	// The user logic relies on "assessment_attempt_id". 
	// Let's assume the frontend sends attempt_id or we derive it.
	// For now, let's treat ExamID as AttemptID or add AttemptID to the request model.
	// I'll assume we pass AttemptID in the body for simplicity as "exam_id" or add a field.
	// Let's assume ExamID = AttemptID for this flow.
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ServiceResponse{
			Status:  "error",
			Message: "Invalid request payload",
		})
		return
	}

	questions, err := h.service.GetExamQuestions(req.ExamID) // Passing ID as attempt ID
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ServiceResponse{
			Status:  "error",
			Message: "Failed to fetch questions: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.ServiceResponse{
		Status:  "success",
		Message: "Exam started",
		Data:    questions, // Return the list of questions
	})
}

func (h *ExamHandler) SubmitAnswer(c *gin.Context) {
	var ans models.StudentAnswer
	if err := c.ShouldBindJSON(&ans); err != nil {
		c.JSON(http.StatusBadRequest, models.ServiceResponse{
			Status:  "error",
			Message: err.Error(),
		})
		return
	}

	if err := h.service.SubmitAnswer(ans); err != nil {
		c.JSON(http.StatusInternalServerError, models.ServiceResponse{
			Status:  "error",
			Message: "Failed to submit answer: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.ServiceResponse{
		Status: "success",
	})
}
