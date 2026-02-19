import httpStatus from "http-status";
import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catch.Async.js";
import sendResponse from "../utils/sendResponse.js";
import { Coupon } from "../model/coupon.model.js";
import { generateCouponCode } from "../utils/generate.CouponCode.js";


export const createCoupon = catchAsync(async (req, res) => {
  const { couponName, discountPercentage, expiresAt } = req.body;

  if (!couponName || !discountPercentage) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Coupon name and discount percentage are required"
    );
  }

  if (discountPercentage < 1 || discountPercentage > 100) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Discount must be between 1 and 100"
    );
  }

  try {
    const coupon = await Coupon.create({
      couponName,
      couponCode: generateCouponCode(),
      discountPercentage,
      expiresAt,
    });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });

  } catch (error) {

    
    if (error.code === 11000) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Coupon code already exists. Please try again."
      );
    }

    throw error;
  }
});

export const getAllCoupons = catchAsync(async (req, res) => {

  const coupons = await Coupon.find().sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupons retrieved successfully",
    data: coupons,
  });
});

export const applyCoupon = catchAsync(async (req, res) => {

  const { couponCode } = req.body;

  if (!couponCode) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Coupon code is required"
    );
  }

  const coupon = await Coupon.findOne({
    couponCode: couponCode.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid coupon code");
  }

  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Coupon has expired");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Coupon applied successfully",
    data: {
      discountPercentage: coupon.discountPercentage,
    },
  });
});
