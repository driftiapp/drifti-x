import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const collections = [
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
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB connection not established');
    }

    // Initialize each collection
    for (const collection of collections) {
      console.log(`\n🔍 Initializing ${collection.name}...`);

      // Create collection if it doesn't exist
      const exists = await db.listCollections({ name: collection.name }).hasNext();
      if (!exists) {
        await db.createCollection(collection.name);
        console.log(`✅ Created collection: ${collection.name}`);
      } else {
        console.log(`ℹ️ Collection already exists: ${collection.name}`);
      }

      // Create indexes
      const coll = db.collection(collection.name);
      for (const index of collection.indexes) {
        try {
          await coll.createIndex(index.fields, index.options);
          console.log(`✅ Created index: ${JSON.stringify(index.fields)}`);
        } catch (error) {
          if (error.code === 85) { // Index already exists
            console.log(`ℹ️ Index already exists: ${JSON.stringify(index.fields)}`);
          } else {
            console.error(`❌ Failed to create index: ${error}`);
          }
        }
      }
    }

    // Verify all collections
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(col => col.name);
    
    console.log('\n📊 Database Status:');
    collections.forEach(col => {
      const exists = existingNames.includes(col.name);
      console.log(`${exists ? '✅' : '❌'} ${col.name}`);
    });

    await mongoose.disconnect();
    console.log('\n✨ Database initialization complete!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase(); 