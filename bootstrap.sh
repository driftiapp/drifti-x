#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting DriftiX bootstrap process...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 or later.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d "v" -f 2)
if (( $(echo "$NODE_VERSION 20.0.0" | awk '{print ($1 < $2)}') )); then
    echo -e "${RED}❌ Node.js version must be 20.0.0 or higher. Current version: $NODE_VERSION${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install npm 10 or later.${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Cleaning up old dependencies...${NC}"
rm -rf node_modules package-lock.json

echo -e "${BLUE}📥 Installing dependencies...${NC}"
npm install --no-audit

# Check if frontend and backend directories exist and install their dependencies
if [ -d "frontend" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd frontend
    rm -rf node_modules package-lock.json
    npm install --no-audit
    cd ..
fi

if [ -d "backend" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    rm -rf node_modules package-lock.json
    npm install --no-audit
    cd ..
fi

# Create pre-flight check script
echo -e "${BLUE}📝 Creating pre-flight dependency check script...${NC}"
cat > scripts/check-dependencies.js << 'EOF'
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
EOF

# Ensure the scripts directory exists
mkdir -p scripts

# Add pre-flight check to package.json scripts
node -e "
const fs = require('fs');
const package = require('./package.json');
package.scripts = package.scripts || {};
if (!package.scripts.preflight) {
    package.scripts.preflight = 'node scripts/check-dependencies.js';
    fs.writeFileSync('./package.json', JSON.stringify(package, null, 2));
}
"

echo -e "${GREEN}✅ Bootstrap complete! Your environment is ready.${NC}"
echo -e "${BLUE}💡 Run 'npm run preflight' before starting development to ensure all dependencies are installed.${NC}" 