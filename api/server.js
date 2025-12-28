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

async function start() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Add it to your .env file.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }

  app.use("/api/coupons", couponRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start();
