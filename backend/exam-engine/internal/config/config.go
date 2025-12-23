package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	DBHost string
	DBUser string
	DBPass string
	DBName string
	DBPort string
}

func LoadConfig() *Config {
	// Try loading from .env, ignore error if not found
	_ = godotenv.Load()
	// Try loading from config.env (fallback/alternative)
	_ = godotenv.Load("config.env")

	port := os.Getenv("PORT")
	if port == "" {
		port = "4005"
	}

	return &Config{
		Port:   port,
		DBHost: os.Getenv("DB_HOST"),
		DBUser: os.Getenv("DB_USER"),
		DBPass: os.Getenv("DB_PASS"),
		DBName: os.Getenv("DB_NAME"),
		DBPort: os.Getenv("DB_PORT"),
	}
}
