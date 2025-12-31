package routes

import (
	"exam-engine/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

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
