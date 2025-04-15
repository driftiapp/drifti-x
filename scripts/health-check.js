import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config({ path: '.env.local' });

const checkMongoDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log(chalk.green('✅ MongoDB connected successfully'));
    await client.close();
  } catch (error) {
    console.error(chalk.red('❌ MongoDB connection failed:'), error.message);
    process.exit(1);
  }
};

const checkEnvVars = () => {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NEXT_PUBLIC_MAPBOX_TOKEN',
    'FRONTEND_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red('❌ Missing required environment variables:'));
    missingVars.forEach(varName => console.error(chalk.yellow(`  - ${varName}`)));
    process.exit(1);
  }

  console.log(chalk.green('✅ All required environment variables are set'));
};

const main = async () => {
  console.log(chalk.blue('🔍 Running health check...\n'));
  
  // Check environment variables
  checkEnvVars();
  
  // Check MongoDB connection
  await checkMongoDB();
  
  console.log(chalk.green('\n✨ All checks passed! You\'re good to go!'));
};

main().catch(error => {
  console.error(chalk.red('❌ Health check failed:'), error);
  process.exit(1);
}); 