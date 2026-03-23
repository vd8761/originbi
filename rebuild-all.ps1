# rebuild-all.ps1
Write-Host "Starting full clean and rebuild of OriginBi..." -ForegroundColor Cyan

# Define all directories that need node_modules cleared and reinstalled
$directories = @(
    "frontend",
    "backend",
    "backend/shared",
    "backend/student-service",
    "backend/admin-service",
    "backend/auth-service",
    "backend/corporate-service"
)

foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "--- Processing: $dir ---" -ForegroundColor Yellow

        # 1. Delete node_modules if it exists
        $modulePath = Join-Path $dir "node_modules"
        if (Test-Path $modulePath) {
            Write-Host "Removing node_modules in $dir..."
            Remove-Item -Recurse -Force $modulePath
        }

        # 2. Run npm install
        Write-Host "Running npm install in $dir..." -ForegroundColor Gray
        Push-Location $dir
        npm install
        Pop-Location
    } else {
        Write-Warning "Directory not found: $dir"
    }
}

# 3. Build the shared library
Write-Host "--- Building Backend Shared Library ---" -ForegroundColor Yellow
if (Test-Path "backend/shared") {
    Push-Location "backend/shared"
    npm run build
    Pop-Location
    Write-Host "Shared library build complete!" -ForegroundColor Green
} else {
    Write-Error "Could not find backend/shared to run build."
}

Write-Host "Rebuild Process Finished!" -ForegroundColor Green