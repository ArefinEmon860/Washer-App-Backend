import httpStatus from "http-status";
import { User } from "../model/user.model.js";
import AppError from "../errors/AppError.js";
import sendResponse from "../utils/sendResponse.js";
import catchAsync from "../utils/catch.Async.js";

export const getProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshTokenHash -passwordResetOtpHash -passwordResetOtpExpiry"
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { name } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (name !== undefined) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new AppError(httpStatus.BAD_REQUEST, "Name cannot be empty");
    }

    if (trimmedName.length > 50) {
      throw new AppError(httpStatus.BAD_REQUEST, "Name is too long");
    }

    user.name = trimmedName;
  }

  await user.save();

  const safeUser = user.toObject();
  delete safeUser.password;
  delete safeUser.refreshTokenHash;
  delete safeUser.passwordResetOtpHash;
  delete safeUser.passwordResetOtpExpiry;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: safeUser,
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "All password fields are required"
    );
  }

  if (newPassword !== confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, "Passwords do not match");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const isMatch = await User.isPasswordMatched(
    currentPassword,
    user.password
  );

  if (!isMatch) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Current password is incorrect");
  }

  user.password = newPassword; 
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});
