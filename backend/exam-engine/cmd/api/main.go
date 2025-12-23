package main

import (
	"exam-engine/internal/config"
	"exam-engine/internal/repository"
	"exam-engine/internal/routes"
	"log"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize Database
	repository.ConnectDB(cfg)

	r := routes.SetupRouter()

	log.Printf("Exam Engine Service starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
