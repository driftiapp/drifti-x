# Run this script as Administrator
# Requires PowerShell 5.1 or later

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Download MongoDB Community Server
$mongodbUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.6-signed.msi"
$installerPath = "$env:TEMP\mongodb-installer.msi"

Write-Host "Downloading MongoDB Community Server..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $mongodbUrl -OutFile $installerPath

# Install MongoDB
Write-Host "Installing MongoDB..." -ForegroundColor Yellow
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i `"$installerPath`" /quiet /norestart" -Wait

# Create data directories
Write-Host "Creating data directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\data\db"
New-Item -ItemType Directory -Force -Path "C:\data\log"

# Create MongoDB configuration
$configContent = @"
systemLog:
  destination: file
  path: C:\data\log\mongod.log
  logAppend: true
storage:
  dbPath: C:\data\db
  journal:
    enabled: true
net:
  port: 27017
  bindIp: 127.0.0.1
security:
  authorization: disabled
"@

$configPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg"
Set-Content -Path $configPath -Value $configContent

# Install MongoDB as a service
Write-Host "Installing MongoDB service..." -ForegroundColor Yellow
& "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --config "$configPath" --install

# Start MongoDB service
Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
Start-Service MongoDB

# Add MongoDB to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (-not $currentPath.Contains("C:\Program Files\MongoDB\Server\8.0\bin")) {
    $newPath = $currentPath + ";C:\Program Files\MongoDB\Server\8.0\bin"
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
}

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Yellow
$mongodVersion = & "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --version
Write-Host "MongoDB Version: $mongodVersion" -ForegroundColor Green

Write-Host "`nMongoDB installation complete!" -ForegroundColor Green
Write-Host "You can now connect to MongoDB at mongodb://localhost:27017" -ForegroundColor Green 