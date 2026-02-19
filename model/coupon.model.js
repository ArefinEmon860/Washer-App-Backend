import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    couponCode: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 6,
      maxlength: 6,
    },

    discountPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


couponSchema.index({ couponCode: 1 }, { unique: true });

couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Coupon = mongoose.model("Coupon", couponSchema);
