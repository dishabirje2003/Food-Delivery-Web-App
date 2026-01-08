
const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.log("⚠️ MONGO_URI not set, skipping DB connection");
    return;
  }

  try {
    // Add connection options to handle network issues
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("✅ MongoDB connected");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (err) {
    console.error("❌ DB error", err);
    
    // Don't exit process immediately - allow server to run without DB
    // This is useful for development when DB might not be available
    console.log("⚠️ Server will continue running without database connection");
    console.log("💡 Troubleshooting tips:");
    console.log("   1. Check your internet connection");
    console.log("   2. Verify MongoDB Atlas IP whitelist includes your IP (0.0.0.0/0 for all)");
    console.log("   3. Check MongoDB Atlas cluster status");
    console.log("   4. Verify MONGO_URI in .env file is correct");
    console.log("   5. Try using IPv4 DNS servers (8.8.8.8 or 1.1.1.1)");
    
    // Uncomment the line below if you want server to exit on DB error
    // process.exit(1);
  }
};

module.exports = connectDB;
