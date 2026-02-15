import AppError from "../errors/AppError.js";
import { createToken, verifyToken } from "../utils/authToken.js";
import catchAsync from "../utils/catch.Async.js";
import httpStatus from "http-status";
import sendResponse from "../utils/sendResponse.js";
import { sendEmail } from "../utils/sendEmail.js";
import { User } from "../model/user.model.js";
import crypto from "crypto";

const normalizeEmail = (email) => email.trim().toLowerCase();
const hashValue = (value) => crypto.createHash("sha256").update(value).digest("hex");

export const register = catchAsync(async (req, res) => {
  let { email, password, confirmPassword, name } = req.body;

  if (!email || !password || !confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please fill in all required fields");
  }
  if (password !== confirmPassword) {
    throw new AppError(httpStatus.BAD_REQUEST, "Password and confirm password do not match");
  }

  email = normalizeEmail(email);
  const isExist = await User.findOne({ email });
  if (isExist) throw new AppError(httpStatus.BAD_REQUEST, "Email already exists");

  const user = await User.create({ email, password, name, role: "user" });

  const otp = crypto.randomInt(100000, 1000000).toString();
  user.emailVerifyOtpHash = hashValue(otp);
  user.emailVerifyOtpExpiry = Date.now() + 10 * 60 * 1000; 
  await user.save();

  await sendEmail(user.email, "Verify Your Email", `Your verification OTP is ${otp}`);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User registered successfully. Please verify your email using OTP sent to your inbox.",
    data: user.toObject(),
  });
});

export const verifyEmail = catchAsync(async (req, res) => {
  let { email, otp } = req.body;
  email = normalizeEmail(email);

  const user = await User.findOne({ email }).select("+emailVerifyOtpHash +emailVerifyOtpExpiry");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (!user.emailVerifyOtpHash || user.emailVerifyOtpExpiry < Date.now()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or invalid");
  }

  if (hashValue(otp) !== user.emailVerifyOtpHash) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  user.isEmailVerified = true;
  user.emailVerifyOtpHash = undefined;
  user.emailVerifyOtpExpiry = undefined;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});

export const resendVerificationOtp = catchAsync(async (req, res) => {
  let { email } = req.body;
  email = normalizeEmail(email);

  const user = await User.findOne({ email });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  if (user.isEmailVerified) throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");

  const otp = crypto.randomInt(100000, 1000000).toString();
  user.emailVerifyOtpHash = hashValue(otp);
  user.emailVerifyOtpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmail(user.email, "Verify Your Email", `Your verification OTP is ${otp}`);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent successfully",
    data: null,
  });
});

export const login = catchAsync(async (req, res) => {
  let { email, password } = req.body;
  email = normalizeEmail(email);

  const user = await User.isUserExistsByEmail(email);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (!user.isEmailVerified) {
    throw new AppError(httpStatus.FORBIDDEN, "Please verify your email before logging in");
  }

  const isMatch = await User.isPasswordMatched(password, user.password);
  if (!isMatch) throw new AppError(httpStatus.FORBIDDEN, "Password is incorrect");

  const payload = { _id: user._id, email: user.email, role: user.role };
  const accessToken = createToken(payload, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = createToken(payload, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);

  user.refreshTokenHash = hashValue(refreshToken);
  await user.save();

  res.cookie("refreshToken", refreshToken, {
    secure: true,
    httpOnly: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: { accessToken, user: user.toObject() },
  });
});

export const forgetPassword = catchAsync(async (req, res) => {
  let { email } = req.body;
  email = normalizeEmail(email);

  const user = await User.isUserExistsByEmail(email);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const otp = crypto.randomInt(100000, 1000000).toString();
  user.passwordResetOtpHash = hashValue(otp);
  user.passwordResetOtpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendEmail(user.email, "Reset Password", `Your OTP is ${otp}`);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP sent to your email successfully",
    data: null,
  });
});

export const verifyOTP = catchAsync(async (req, res) => {
  let { email, otp } = req.body;
  email = normalizeEmail(email);

  const user = await User.findOne({ email }).select("+passwordResetOtpHash +passwordResetOtpExpiry");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (!user.passwordResetOtpHash || user.passwordResetOtpExpiry < Date.now()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or invalid");
  }

  if (hashValue(otp) !== user.passwordResetOtpHash) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiry = undefined;
  user.isEmailVerified = true;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: { email },
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  let { email, otp, password } = req.body;
  email = normalizeEmail(email);

  const user = await User.isUserExistsByEmail(email);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  if (!user.passwordResetOtpHash || user.passwordResetOtpExpiry < Date.now()) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or invalid");
  }

  if (hashValue(otp) !== user.passwordResetOtpHash) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  user.password = password;
  user.passwordResetOtpHash = undefined;
  user.passwordResetOtpExpiry = undefined;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: null,
  });
});

export const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id).select("+password");
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const isMatch = await User.isPasswordMatched(oldPassword, user.password);
  if (!isMatch) throw new AppError(httpStatus.FORBIDDEN, "Old password incorrect");

  user.password = newPassword;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded._id);

  if (!user || user.refreshTokenHash !== hashValue(refreshToken)) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const payload = { _id: user._id, email: user.email, role: user.role };
  const accessToken = createToken(payload, process.env.JWT_ACCESS_SECRET, process.env.JWT_ACCESS_EXPIRES_IN);
  const newRefreshToken = createToken(payload, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);

  user.refreshTokenHash = hashValue(newRefreshToken);
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: { accessToken },
  });
});

export const logout = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user?._id, {
    refreshTokenHash: undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});
