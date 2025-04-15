import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testMongoDBConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    
    // Get the MongoDB URI from environment
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Attempt to connect
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection details:');
    console.log(`- Host: ${mongoose.connection.host}`);
    console.log(`- Database: ${mongoose.connection.name}`);
    console.log(`- State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);

    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

testMongoDBConnection(); 