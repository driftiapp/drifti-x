import { connectToDatabase } from "@/lib/mongodb";

async function verifyConnection() {
  try {
    const connection = await connectToDatabase();
    console.log("✅ MongoDB connection successful!");
    console.log("Database name:", connection.connection.db.databaseName);
    console.log("Connection state:", connection.connection.readyState);
    
    // Test a simple query
    const collections = await connection.connection.db.listCollections().toArray();
    console.log("\nAvailable collections:");
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

verifyConnection(); 