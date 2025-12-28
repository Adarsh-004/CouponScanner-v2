import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import couponRoutes from "./routes/couponRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

const { MONGO_URI, PORT = 5000 } = process.env;

let mongoConnected = false;

async function connectDB() {
  if (mongoConnected) return;
  
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    throw new Error("MONGO_URI is not set");
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
    mongoConnected = true;
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    throw err;
  }
}

app.use("/api/coupons", couponRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

// For local development
if (process.env.NODE_ENV !== "production") {
  const PORT_NUM = parseInt(PORT);
  app.listen(PORT_NUM, async () => {
    await connectDB();
    console.log(`Server running on port ${PORT_NUM}`);
  });
}

// For Vercel (serverless)
export default async (req, res) => {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
