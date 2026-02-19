import express from "express";
import {
  createCoupon,
  getAllCoupons,
  applyCoupon,
} from "../controller/coupon.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, isAdmin, createCoupon);
router.get("/", protect,  getAllCoupons);
router.post("/apply", protect, applyCoupon);

export default router;
