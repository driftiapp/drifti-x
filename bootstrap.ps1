# PowerShell script for DriftiX bootstrap

# Colors for output
$Green = "`e[32m"
$Blue = "`e[34m"
$Red = "`e[31m"
$Reset = "`e[0m"

Write-Host "$Blue🚀 Starting DriftiX bootstrap process...$Reset"

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "$Red❌ Node.js is not installed. Please install Node.js 20 or later.$Reset"
    exit 1
}

# Check Node.js version
$NodeVersion = (node -v).Substring(1)
if ([version]$NodeVersion -lt [version]"20.0.0") {
    Write-Host "$Red❌ Node.js version must be 20.0.0 or higher. Current version: $NodeVersion$Reset"
    exit 1
}

# Check if npm is installed
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "$Red❌ npm is not installed. Please install npm 10 or later.$Reset"
    exit 1
}

Write-Host "$Blue📦 Cleaning up old dependencies...$Reset"
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
Remove-Item -Force -ErrorAction SilentlyContinue package-lock.json

Write-Host "$Blue📥 Installing dependencies...$Reset"
npm install --no-audit

# Check if frontend and backend directories exist and install their dependencies
if (Test-Path "frontend") {
    Write-Host "$Blue📦 Installing frontend dependencies...$Reset"
    Push-Location frontend
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
    Remove-Item -Force -ErrorAction SilentlyContinue package-lock.json
    npm install --no-audit
    Pop-Location
}

if (Test-Path "backend") {
    Write-Host "$Blue📦 Installing backend dependencies...$Reset"
    Push-Location backend
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules
    Remove-Item -Force -ErrorAction SilentlyContinue package-lock.json
    npm install --no-audit
    Pop-Location
}

# Create scripts directory if it doesn't exist
New-Item -ItemType Directory -Force -Path scripts | Out-Null

# Create pre-flight check script
Write-Host "$Blue📝 Creating pre-flight dependency check script...$Reset"
@'
import fs from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';

function checkDependencies() {
    try {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        for (const [pkg, version] of Object.entries(allDeps)) {
            try {
                require.resolve(pkg);
            } catch (e) {
                console.log(chalk.yellow(`📦 Missing dependency: ${pkg}. Installing...`));
                execSync(`npm install --no-audit ${pkg}@${version}`, { stdio: 'inherit' });
            }
        }
        
        console.log(chalk.green('✅ All dependencies are installed!'));
    } catch (error) {
        console.error(chalk.red('❌ Error checking dependencies:'), error);
        process.exit(1);
    }
}

checkDependencies();
'@ | Set-Content -Path "scripts\check-dependencies.js"

# Add pre-flight check to package.json scripts
$packageJson = Get-Content -Raw -Path "package.json" | ConvertFrom-Json
if (-not $packageJson.scripts.preflight) {
    $packageJson.scripts | Add-Member -Name "preflight" -Value "node scripts/check-dependencies.js" -MemberType NoteProperty
    $packageJson | ConvertTo-Json -Depth 100 | Set-Content "package.json"
}

Write-Host "$Green✅ Bootstrap complete! Your environment is ready.$Reset"
Write-Host "$Blue💡 Run 'npm run preflight' before starting development to ensure all dependencies are installed.$Reset" 