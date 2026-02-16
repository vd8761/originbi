# resolve-onedrive.ps1
# Run this after filling in the 3 values below to get your DRIVE_ID and FOLDER_ID

$tenantId = $env:ONEDRIVE_TENANT_ID
$clientId = $env:ONEDRIVE_CLIENT_ID
$clientSecret = $env:ONEDRIVE_CLIENT_SECRET

if (-not $tenantId -or -not $clientId -or -not $clientSecret) {
    Write-Host "ERROR: Set these environment variables first:" -ForegroundColor Red
    Write-Host "  `$env:ONEDRIVE_TENANT_ID = 'your-tenant-id'"
    Write-Host "  `$env:ONEDRIVE_CLIENT_ID = 'your-client-id'"
    Write-Host "  `$env:ONEDRIVE_CLIENT_SECRET = 'your-client-secret'"
    exit 1
}

# 1. Get access token
Write-Host "`n--- Getting access token ---" -ForegroundColor Cyan
$tokenBody = @{
    grant_type    = "client_credentials"
    client_id     = $clientId
    client_secret = $clientSecret
    scope         = "https://graph.microsoft.com/.default"
}
$tokenUrl = "https://login.microsoftonline.com/$tenantId/oauth2/v2.0/token"
try {
    $tokenRes = Invoke-RestMethod -Uri $tokenUrl -Method Post -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenRes.access_token
    Write-Host "Access token obtained successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR getting token: $($_.Exception.Message)" -ForegroundColor Red
    $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errRes = $streamReader.ReadToEnd()
    Write-Host "Response: $errRes" -ForegroundColor Red
    exit 1
}

# 2. Encode the sharing URL
$sharingUrl = "https://1drv.ms/f/c/2f70d01ddb7a4cb6/IgCp94X0VISHR68gIodhZ9Z7AQGjoi_4yjSrdxFaiC2ocNI?e=YMrOr1"
$base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($sharingUrl))
$encodedUrl = "u!" + $base64.TrimEnd('=').Replace('/', '_').Replace('+', '-')

Write-Host "`n--- Resolving sharing link ---" -ForegroundColor Cyan
Write-Host "Sharing URL: $sharingUrl"

# 3. Resolve the sharing link to get driveItem
$graphUrl = "https://graph.microsoft.com/v1.0/shares/$encodedUrl/driveItem"
$headers = @{
    Authorization = "Bearer $accessToken"
}

try {
    $driveItem = Invoke-RestMethod -Uri $graphUrl -Headers $headers -Method Get
    
    $driveId = $driveItem.parentReference.driveId
    $folderId = $driveItem.id
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  RESOLVED VALUES" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "ONEDRIVE_DRIVE_ID=$driveId" -ForegroundColor Yellow
    Write-Host "ONEDRIVE_ROOT_FOLDER_ID=$folderId" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Folder name: $($driveItem.name)" -ForegroundColor Cyan
    Write-Host "Web URL: $($driveItem.webUrl)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Green
} catch {
    Write-Host "ERROR resolving sharing link: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errRes = $streamReader.ReadToEnd()
        Write-Host "Response: $errRes" -ForegroundColor Red
    }
}
