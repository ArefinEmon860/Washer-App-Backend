
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    finalPrice: {
      type: Number,
      required: true,
    },

    address: {
      addressLine: {
        type: String,
        required: true,
      },
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
    
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    payment: {
      method: {
        type: String,
        enum: ["cash", "online"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "paid"],
        required: true,
      },
      trxId: String,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
