import crypto from "crypto";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString(); // 6 digit
};

export const generateUniqueId = () => {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `BK${random}`;
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const uniqueTransactionId = () => {
  return uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase();
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (email, code) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verification Code",
    text: `Your verification code is: ${code}`,
  });
};
