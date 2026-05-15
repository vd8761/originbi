# rebuild-all.ps1
# Set the root directory to the script's location
Set-Location -Path $PSScriptRoot
Write-Host "Starting full clean and rebuild from: $PSScriptRoot" -ForegroundColor Cyan

# Define all directories relative to the script location
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
    # Resolve the full path relative to the script root
    $fullPath = Join-Path $PSScriptRoot $dir

    if (Test-Path $fullPath) {
        Write-Host "--- Processing: $dir ---" -ForegroundColor Yellow

        # 1. Delete node_modules if it exists
        $modulePath = Join-Path $fullPath "node_modules"
        if (Test-Path $modulePath) {
            Write-Host "Removing node_modules in $dir..."
            # Using -ErrorAction SilentlyContinue in case files are locked
            Remove-Item -Recurse -Force $modulePath -ErrorAction SilentlyContinue
        }

        # 2. Run npm install
        Write-Host "Running npm install in $dir..." -ForegroundColor Gray
        Push-Location $fullPath
        npm install
        Pop-Location
    } else {
        Write-Warning "Directory not found: $fullPath"
    }
}

# 3. Build the shared library
Write-Host "--- Building Backend Shared Library ---" -ForegroundColor Yellow
$sharedPath = Join-Path $PSScriptRoot "backend/shared"

if (Test-Path $sharedPath) {
    Push-Location $sharedPath
    npm run build
    Pop-Location
    Write-Host "Shared library build complete!" -ForegroundColor Green
} else {
    Write-Error "Could not find $sharedPath to run build."
}

Write-Host "Rebuild Process Finished!" -ForegroundColor Green