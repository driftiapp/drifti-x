require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function verifyConnection() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in .env.local');
    }

    const connection = await mongoose.connect(uri, {
      bufferCommands: false,
    });

    console.log("✅ MongoDB connection successful!");
    console.log("Database name:", connection.connection.db.databaseName);
    console.log("Connection state:", connection.connection.readyState);
    
    // Test a simple query
    const collections = await connection.connection.db.listCollections().toArray();
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

verifyConnection(); 