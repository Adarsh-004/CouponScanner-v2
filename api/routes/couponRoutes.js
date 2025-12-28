import { Router } from "express";
import Coupon from "../models/Coupon.js";

const router = Router();

function parseAmount(value) {
  if (!value) return null;
  const match = value.toString().replace(/[,\s]/g, "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : null;
}

router.post("/add", async (req, res) => {
  const { code, amount, rawText } = req.body || {};

  if (!code) {
    return res.status(400).json({ error: "Coupon code is required" });
  }

  const amountValue = parseAmount(amount);
  const normalizedAmount = amount?.trim?.() || (amountValue ? `₹${amountValue}` : "Unknown");

  try {
    const coupon = new Coupon({
      code: code.trim(),
      amount: normalizedAmount,
      amountValue,
      rawText: rawText || "",
    });

    await coupon.save();

    const amountCount = await Coupon.countDocuments({ amount: normalizedAmount });

    res.status(201).json({
      message: "Coupon added",
      amount: normalizedAmount,
      amountValue,
      amountCount,
      id: coupon._id,
    });
  } catch (err) {
    console.error("Failed to add coupon", err);
    res.status(500).json({ error: "Failed to add coupon" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const stats = await Coupon.aggregate([
      {
        $group: {
          _id: "$amount",
          count: { $sum: 1 },
          amountValue: { $first: { $ifNull: ["$amountValue", 0] } },
        },
      },
      { $sort: { amountValue: -1, count: -1, _id: 1 } },
    ]);

    const items = stats.map((stat) => ({
      amount: stat._id,
      amountValue: stat.amountValue ?? 0,
      count: stat.count,
    }));

    res.json({ items });
  } catch (err) {
    console.error("Failed to fetch stats", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.delete("/delete/:amount", async (req, res) => {
  const amountParam = decodeURIComponent(req.params.amount);

  try {
    const deleted = await Coupon.findOneAndDelete({ amount: amountParam }).sort({ createdAt: -1 });

    if (!deleted) {
      return res.status(404).json({ error: "No coupon found for that amount" });
    }

    const remainingCount = await Coupon.countDocuments({ amount: amountParam });

    res.json({
      message: `Deleted one coupon for ${amountParam}`,
      remainingCount,
    });
  } catch (err) {
    console.error("Failed to delete coupon", err);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
});

router.delete("/clear-all", async (_req, res) => {
  try {
    const result = await Coupon.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} coupons` });
  } catch (err) {
    console.error("Failed to clear coupons", err);
    res.status(500).json({ error: "Failed to clear coupons" });
  }
});

export default router;
