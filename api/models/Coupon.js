import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true },
    amount: { type: String, default: "Unknown" },
    amountValue: { type: Number, default: null },
    rawText: { type: String, default: "" },
  },
  { timestamps: true }
);

// Remove indexes - they're causing duplicate key errors
// couponSchema.index({ amount: 1 });
// couponSchema.index({ createdAt: -1 });

export default mongoose.model("Coupon", couponSchema);
