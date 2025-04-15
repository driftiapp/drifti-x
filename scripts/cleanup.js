const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function cleanup() {
  console.log(chalk.blue('🧹 Starting cleanup...'));

  try {
    // Remove .next directory
    if (fs.existsSync('.next')) {
      console.log(chalk.yellow('Removing .next directory...'));
      fs.rmSync('.next', { recursive: true, force: true });
    }

    // Remove node_modules
    if (fs.existsSync('node_modules')) {
      console.log(chalk.yellow('Removing node_modules...'));
      fs.rmSync('node_modules', { recursive: true, force: true });
    }

    // Remove package-lock.json
    if (fs.existsSync('package-lock.json')) {
      console.log(chalk.yellow('Removing package-lock.json...'));
      fs.unlinkSync('package-lock.json');
    }

    // Install dependencies
    console.log(chalk.blue('Installing dependencies...'));
    execSync('npm install', { stdio: 'inherit' });

    console.log(chalk.green('✅ Cleanup completed successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Error during cleanup:'), error);
    process.exit(1);
  }
}

cleanup(); 