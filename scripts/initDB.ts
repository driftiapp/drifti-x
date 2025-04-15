import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../backend/src/utils/logger';

dotenv.config();

interface CollectionConfig {
  name: string;
  indexes: {
    fields: Record<string, number | string>;
    options?: mongoose.CreateIndexesOptions;
  }[];
}

const collections: CollectionConfig[] = [
  {
    name: 'users',
    indexes: [
      { fields: { email: 1 }, options: { unique: true } },
      { fields: { role: 1 } },
      { fields: { isActive: 1 } },
      { fields: { createdAt: -1 } }
    ]
  },
  {
    name: 'orders',
    indexes: [
      { fields: { customer: 1 } },
      { fields: { store: 1 } },
      { fields: { driver: 1 } },
      { fields: { status: 1 } },
      { fields: { paymentStatus: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { 'deliveryAddress.coordinates': '2dsphere' } }
    ]
  },
  {
    name: 'analytics',
    indexes: [
      { fields: { type: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { userId: 1 } }
    ]
  },
  {
    name: 'devicetrusts',
    indexes: [
      { fields: { userId: 1 } },
      { fields: { deviceId: 1 } },
      { fields: { createdAt: -1 } }
    ]
  },
  {
    name: 'activitylogs',
    indexes: [
      { fields: { userId: 1 } },
      { fields: { type: 1 } },
      { fields: { createdAt: -1 } }
    ]
  },
  {
    name: 'smokeshops',
    indexes: [
      { fields: { name: 1 } },
      { fields: { location: '2dsphere' } },
      { fields: { isActive: 1 } }
    ]
  }
];

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    logger.info('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }

    // Initialize each collection
    for (const collection of collections) {
      logger.info(`\n🔍 Initializing ${collection.name}...`);

      // Create collection if it doesn't exist
      const exists = await db.listCollections({ name: collection.name }).hasNext();
      if (!exists) {
        await db.createCollection(collection.name);
        logger.info(`✅ Created collection: ${collection.name}`);
      } else {
        logger.info(`ℹ️ Collection already exists: ${collection.name}`);
      }

      // Create indexes
      const coll = db.collection(collection.name);
      for (const index of collection.indexes) {
        try {
          await coll.createIndex(index.fields, index.options);
          logger.info(`✅ Created index: ${JSON.stringify(index.fields)}`);
        } catch (error) {
          if ((error as any).code === 85) { // Index already exists
            logger.info(`ℹ️ Index already exists: ${JSON.stringify(index.fields)}`);
          } else {
            logger.error(`❌ Failed to create index: ${error}`);
          }
        }
      }
    }

    // Verify all collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);
    
    logger.info('\n📊 Database Status:');
    collections.forEach(col => {
      const exists = existingNames.includes(col.name);
      logger.info(`${exists ? '✅' : '❌'} ${col.name}`);
    });

    await mongoose.disconnect();
    logger.info('\n✨ Database initialization complete!');

  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase(); 