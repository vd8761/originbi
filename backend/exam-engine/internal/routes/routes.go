package routes

import (
	"exam-engine/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	examHandler := handlers.NewExamHandler()

	// Health Check
	r.GET("/health", examHandler.HealthCheck)

	// Exam Routes
	api := r.Group("/api/v1")
	{
		api.POST("/exam/start", examHandler.StartExam)
		api.POST("/exam/answer", examHandler.SubmitAnswer)
	}

	return r
}
