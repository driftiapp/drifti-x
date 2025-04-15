import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../backend/src/utils/logger';
import { IUserDocument, userMongooseSchema } from '../backend/src/models/user.model';
import { ILiquorOrder, orderSchema } from '../backend/src/models/order.model';
import { analyticsSchema } from '../backend/src/models/analytics.model';
import { deviceTrustSchema } from '../backend/src/models/deviceTrust.model';
import { activityLogSchema } from '../backend/src/models/activityLog.model';
import { smokeShopSchema } from '../backend/src/models/smokeShop.model';

dotenv.config();

interface VerificationResult {
  model: string;
  collectionExists: boolean;
  indexes: {
    name: string;
    exists: boolean;
    fields: Record<string, number>;
  }[];
  requiredFields: string[];
  relationships: {
    field: string;
    ref: string;
    exists: boolean;
  }[];
}

async function verifySchema() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI);
    logger.info('✅ Connected to MongoDB');

    // Get all models
    const models = [
      { name: 'User', schema: userMongooseSchema },
      { name: 'Order', schema: orderSchema },
      { name: 'Analytics', schema: analyticsSchema },
      { name: 'DeviceTrust', schema: deviceTrustSchema },
      { name: 'ActivityLog', schema: activityLogSchema },
      { name: 'SmokeShop', schema: smokeShopSchema }
    ];

    const results: VerificationResult[] = [];

    // Verify each model
    for (const { name, schema } of models) {
      logger.info(`\n🔍 Verifying ${name} model...`);

      const collectionName = schema.get('collection');
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('MongoDB connection not established');
      }

      // Check if collection exists
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
      
      // Get indexes
      const indexes = await db.collection(collectionName).indexes();
      const indexInfo = indexes.map((index: any) => ({
        name: index.name,
        exists: true,
        fields: index.key
      }));

      // Get required fields
      const requiredFields = Object.entries(schema.paths)
        .filter(([_, path]: [string, any]) => path.isRequired)
        .map(([field]) => field);

      // Get relationships
      const relationships = Object.entries(schema.paths)
        .filter(([_, path]: [string, any]) => path.options?.ref)
        .map(([field, path]: [string, any]) => ({
          field,
          ref: path.options.ref,
          exists: true
        }));

      results.push({
        model: name,
        collectionExists,
        indexes: indexInfo,
        requiredFields,
        relationships
      });

      // Log results
      logger.info(`Collection exists: ${collectionExists ? '✅' : '❌'}`);
      logger.info(`Indexes (${indexInfo.length}):`);
      indexInfo.forEach((index: any) => {
        logger.info(`  - ${index.name}: ${JSON.stringify(index.fields)}`);
      });
      logger.info(`Required fields (${requiredFields.length}):`);
      requiredFields.forEach(field => {
        logger.info(`  - ${field}`);
      });
      logger.info(`Relationships (${relationships.length}):`);
      relationships.forEach(rel => {
        logger.info(`  - ${rel.field} -> ${rel.ref}`);
      });
    }

    // Check for missing collections
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }

    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(col => col.name);
    const modelCollectionNames = models.map(m => m.schema.get('collection'));

    const missingCollections = modelCollectionNames.filter(
      name => !existingCollectionNames.includes(name)
    );

    if (missingCollections.length > 0) {
      logger.warn('\n⚠️ Missing collections:');
      missingCollections.forEach(name => {
        logger.warn(`  - ${name}`);
      });
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