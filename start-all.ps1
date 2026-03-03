# OriginBi - Start All Services Script

Write-Host "Starting all OriginBi services..." -ForegroundColor Green

# 1. Admin Service (Port 4001)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/admin-service; npm run start:dev"
Write-Host "Launched Admin Service..."

# 2. Auth Service (Port 4002)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/auth-service; npm run start:dev"
Write-Host "Launched Auth Service..."

# 3. Corporate Service (Port 4003)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/corporate-service; npm run start:dev"
Write-Host "Launched Corporate Service..."

# 4. Student Service (Port 4004)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/student-service; npm run start:dev"
Write-Host "Launched Student Service..."

# 5. Exam Engine (Go) (Port 4005)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend/exam-engine; go run cmd/api/main.go"
Write-Host "Launched Exam Engine..."

# 6. Frontend (Port 3000)
# We add a small delay to let backends initialize
Start-Sleep -Seconds 5
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
Write-Host "Launched Frontend..."

Write-Host "All services started! You can close the original terminal if you wish." -ForegroundColor Cyan
