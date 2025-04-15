import { execSync } from 'child_process';
import chalk from 'chalk';

const checkDependencies = () => {
  console.log(chalk.blue('🔍 Checking dependencies...\n'));

  try {
    // Check if MongoDB is installed
    execSync('mongod --version');
    console.log(chalk.green('✅ MongoDB is installed'));
  } catch (error) {
    console.error(chalk.red('❌ MongoDB is not installed or not in PATH'));
    console.error(chalk.yellow('Please install MongoDB from https://www.mongodb.com/try/download/community'));
  }

  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(chalk.green(`✅ Node.js ${nodeVersion} is installed`));
  } catch (error) {
    console.error(chalk.red('❌ Node.js is not installed'));
    console.error(chalk.yellow('Please install Node.js from https://nodejs.org/'));
  }

  try {
    // Check npm version
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(chalk.green(`✅ npm ${npmVersion} is installed`));
  } catch (error) {
    console.error(chalk.red('❌ npm is not installed'));
  }

  try {
    // Check if project dependencies are installed
    execSync('npm list --depth=0');
    console.log(chalk.green('✅ Project dependencies are installed'));
  } catch (error) {
    console.error(chalk.red('❌ Project dependencies are not installed'));
    console.error(chalk.yellow('Run `npm install` to install dependencies'));
  }

  console.log(chalk.green('\n✨ Dependency check complete!'));
};

checkDependencies();
