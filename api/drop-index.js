import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/coupons";

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    
    const db = mongoose.connection.db;
    const indexes = await db.collection('coupons').indexes();
    console.log("Existing indexes:", JSON.stringify(indexes, null, 2));
    
    // Try to drop all indexes except _id
    for (const idx of indexes) {
      if (idx.name !== '_id_') {
        try {
          await db.collection('coupons').dropIndex(idx.name);
          console.log(`✅ Dropped index: ${idx.name}`);
        } catch (e) {
          console.log(`⚠️ Could not drop ${idx.name}: ${e.message}`);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

dropIndex();
