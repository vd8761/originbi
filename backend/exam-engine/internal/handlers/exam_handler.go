package handlers

import (
	"exam-engine/internal/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ExamHandler struct {
	// Service injection would go here
}

func NewExamHandler() *ExamHandler {
	return &ExamHandler{}
}

func (h *ExamHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"service": "exam-engine",
	})
}

func (h *ExamHandler) StartExam(c *gin.Context) {
	var req models.ExamStartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ServiceResponse{
			Status:  "error",
			Message: "Invalid request payload",
		})
		return
	}

	// TODO: Call service to start exam
	c.JSON(http.StatusOK, models.ServiceResponse{
		Status:  "success",
		Message: "Exam started",
		Data:    gin.H{"session_id": "dummy-session-123"},
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

	// TODO: Call service to record answer
	c.JSON(http.StatusOK, models.ServiceResponse{
		Status: "success",
	})
}
