import httpStatus from "http-status";
import { Booking } from "../model/booking.model.js";
import AppError from "../errors/AppError.js";
import catchAsync from "../utils/catch.Async.js";
import sendResponse from "../utils/sendResponse.js";
import { Coupon } from "../model/coupon.model.js";
import { User } from "../model/user.model.js";

export const createBooking = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const {
    provider,
    service,
    price,
    couponCode,
    address,
    bookingDate,
    payment,
    postalCode,
  } = req.body;

  if (
    !provider ||
    !service ||
    !price ||
    !address ||
    !bookingDate ||
    !payment ||
    !postalCode
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Missing required booking fields",
    );
  }

  const washer = await User.findById(provider);

  if (!washer || washer.role !== "provider") {
    throw new AppError(httpStatus.NOT_FOUND, "Washer not found");
  }

  if (!washer.isOnline) {
    throw new AppError(httpStatus.BAD_REQUEST, "Washer is offline");
  }

  if (washer.isBusy) {
    throw new AppError(httpStatus.BAD_REQUEST, "Washer is currently busy");
  }

  if (washer.dailyWashLimit <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Washer daily limit completed");
  }

  let discountPrice = 0;
  let finalPrice = price;
  let appliedCoupon = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      couponCode: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid coupon code");
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new AppError(httpStatus.BAD_REQUEST, "Coupon has expired");
    }

    const normalizedPostalCode = postalCode.toUpperCase().trim();

    const isAllowed = coupon.allowedPostalCodes.includes(normalizedPostalCode);

    if (!isAllowed) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Coupon is not available in your area",
      );
    }

    discountPrice = (price * coupon.discountPercentage) / 100;
    finalPrice = price - discountPrice;
    if (finalPrice < 0) finalPrice = 0;

    appliedCoupon = coupon._id;
  }

  const booking = await Booking.create({
    user: userId,
    provider,
    service,
    price,
    coupon: appliedCoupon,
    discountPrice,
    finalPrice,
    address,
    bookingDate,
    postalCode: postalCode.toUpperCase().trim(),
    payment,
    status: "pending",
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Booking created successfully",
    data: booking,
  });
});

export const getSingleBooking = catchAsync(async (req, res) => {
  const { id } = req.params;

  const booking = await Booking.findById(id)
    .populate("user", "name email")
    .populate("provider", "name email")
    .populate("service", "title price");

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: booking,
  });
});

export const getUserBookings = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const bookings = await Booking.find({ user: userId })
    .populate("provider", "name email")
    .populate("service", "title price")
    .sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: bookings,
  });
});

export const getProviderBookings = catchAsync(async (req, res) => {
  const providerId = req.user._id;
  const bookings = await Booking.find({ provider: providerId })
    .populate("user", "name email")
    .populate("service", "title price")
    .sort({ createdAt: -1 });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    data: bookings,
  });
});

export const updateBookingStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatus = ["accepted", "ongoing", "completed", "cancelled"];

  if (!allowedStatus.includes(status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid booking status");
  }

  const booking = await Booking.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking status updated",
    data: booking,
  });
});

export const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const booking = await Booking.findOne({ _id: id, user: userId });

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.status === "completed") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Completed booking cannot be cancelled",
    );
  }

  booking.status = "cancelled";
  await booking.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking cancelled successfully",
    data: booking,
  });
});
