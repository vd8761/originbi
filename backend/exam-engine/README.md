# Exam Engine Service

## Overview
This is the Go-based service for the Exam Engine. It handles fetching assessment questions and submitting answers.

## Prerequisites
- Go 1.20+ installed
- PostgreSQL database running
- Database schema populated (specifically `assessment_attempts` and `assessment_answers`)

## Configuration
Ensure you have a `.env` file in the root directory with the following variables:
```env
PORT=4005
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=originbi_db
DB_PORT=5432
```

## Running Locally

1. Open a terminal in this directory (`backend/exam-engine`).
2. Run the service:
   ```bash
   go run cmd/api/main.go
   ```
3. The service will start on port 4005 (or as configured).

## API Endpoints

- **Start Exam**: `POST /api/v1/exam/start`
  - Payload: `{ "student_id": "...", "exam_id": "..." }`
- **Submit Answer**: `POST /api/v1/exam/answer`
  - Payload: `{ "attempt_id": "...", "question_id": "...", "selected_option": "...", "time_taken": 10 }`

## Troubleshooting
- If you see "question not found", ensure `assessment_answers` table has records for the given `attempt_id`.
