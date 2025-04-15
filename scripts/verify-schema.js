const mongoose = require('mongoose');
require('dotenv').config();
const { logger } = require('../backend/src/utils/logger');

async function verifySchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    logger.info('✅ Connected to MongoDB');

    // Get all collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(col => col.name);

    logger.info('\n📊 Database Collections:');
    collectionNames.forEach(name => {
      logger.info(`  - ${name}`);
    });

    // Check for required collections
    const requiredCollections = [
      'users',
      'orders',
      'analytics',
      'devicetrusts',
      'activitylogs',
      'smokeshops'
    ];

    const missingCollections = requiredCollections.filter(
      name => !collectionNames.includes(name)
    );

    if (missingCollections.length > 0) {
      logger.warn('\n⚠️ Missing collections:');
      missingCollections.forEach(name => {
        logger.warn(`  - ${name}`);
      });
    } else {
      logger.info('\n✅ All required collections exist');
    }

    // Disconnect
    await mongoose.disconnect();
    logger.info('\n✅ Schema verification complete!');

  } catch (error) {
    logger.error('❌ Schema verification failed:', error);
    process.exit(1);
  }
}

verifySchema(); 