import httpStatus from "http-status";
import catchAsync from "../utils/catch.Async.js";
import sendResponse from "../utils/sendResponse.js";
import { User } from "../model/user.model.js";
import { Booking } from "../model/booking.model.js";
import { WashHistory } from "../model/WashHistory.model.js";
import { isWithinWorkingHours } from "../utils/time.util.js";
import AppError from "../errors/AppError.js";

export const getAllWashers = catchAsync(async (req, res) => {
  const washers = await User.find({ role: "provider" }).select(
    "-password -refreshToken"
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Washers retrieved successfully",
    data: washers,
  });
});

export const getWasherStatus = catchAsync(async (req, res) => {
  const washer = await User.findById(req.user._id).select(
    "dailyWashLimit isOnline isBusy"
  );

  if (!washer) {
    throw new AppError(httpStatus.NOT_FOUND, "Washer not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Washer status fetched",
    data: washer,
  });
});

export const goOnline = catchAsync(async (req, res) => {
  const washer = await User.findById(req.user._id);

  if (!washer || washer.role !== "provider") {
    throw new AppError(httpStatus.NOT_FOUND, "Washer not found");
  }

  if (!isWithinWorkingHours()) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Working hours are 8:00 AM to 5:30 PM"
    );
  }

  if (washer.dailyWashLimit <= 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Daily wash limit completed"
    );
  }

  washer.isOnline = true;
  await washer.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Washer is online",
  });
});

export const goOffline = catchAsync(async (req, res) => {
  const washer = await User.findById(req.user._id);

  if (!washer) {
    throw new AppError(httpStatus.NOT_FOUND, "Washer not found");
  }

  washer.isOnline = false;
  await washer.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Washer is offline",
  });
});

export const acceptBooking = catchAsync(async (req, res) => {
  const washer = await User.findById(req.user._id);

  if (!washer || washer.role !== "provider") {
    throw new AppError(httpStatus.NOT_FOUND, "Washer not found");
  }

  if (!washer.isOnline || washer.isBusy) {
    throw new AppError(httpStatus.BAD_REQUEST, "Washer not available");
  }

  if (washer.dailyWashLimit <= 0) {
    washer.isOnline = false;
    await washer.save();
    throw new AppError(httpStatus.BAD_REQUEST, "Wash limit completed");
  }

  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  booking.status = "ongoing";
  washer.isBusy = true;
  washer.dailyWashLimit -= 1;

  await booking.save();
  await washer.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Car wash started",
  });
});

export const completeWash = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId);

  if (!booking) {
    throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
  }

  booking.status = "completed";
  await booking.save();

  const washer = await User.findById(req.user._id);

  washer.isBusy = false;

  if (washer.dailyWashLimit <= 0) {
    washer.isOnline = false;
  }

  await washer.save();

  await WashHistory.create({
    washer: washer._id,
    booking: booking._id,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Wash completed successfully",
  });
});
