import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import AppError from "../errors/AppError.js";
import { User } from "../model/user.model.js";
import catchAsync from "../utils/catch.Async.js";

export const protect = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Token not found");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token");
  }

  const user = await User.findById(decoded._id);
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User not found");
  }

  if (!user.isEmailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "User not verified");
  }

  req.user = user;
  next();
});

export const isAdmin = catchAsync(async (req, res, next) => {
  if (req.user?.role !== "admin") {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied. Admin only.");
  }
  next();
});

export const isProvider = catchAsync(async (req, res, next) => {
  if (req.user?.role !== "provider") {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied. Provider only.");
  }
  next();
});
