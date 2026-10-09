import bcrypt from "bcryptjs";
import crypto from "crypto";
import EmailOtp from "../models/EmailOtp.js";
import { sendOtpNotification } from "./bookingNotification.js";

const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const VALID_PURPOSES = ["registration", "booking"];

const normalizeEmail = (email = "") => String(email).toLowerCase().trim();
const createCode = () => crypto.randomInt(100000, 1000000).toString();

const createError = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });

export const requestEmailOtp = async ({ email, purpose }) => {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) {
    throw createError("Email is required");
  }
  if (!VALID_PURPOSES.includes(purpose)) {
    throw createError("Invalid OTP purpose");
  }

  const now = new Date();
  const latest = await EmailOtp.findOne({
    email: cleanEmail,
    purpose,
    consumedAt: null,
    expireAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (latest) {
    const secondsSince = (now - latest.createdAt) / 1000;
    if (secondsSince < RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSince);
      throw createError(
        `Please wait ${wait} seconds before requesting a new code`,
        429
      );
    }
  }

  const code = createCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expireAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await EmailOtp.deleteMany({
    email: cleanEmail,
    purpose,
    consumedAt: null,
  });

  const record = await EmailOtp.create({
    email: cleanEmail,
    purpose,
    codeHash,
    expireAt,
  });

  try {
    await sendOtpNotification({
      email: cleanEmail,
      code,
      purpose,
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (error) {
    await EmailOtp.deleteOne({ _id: record._id });
    console.error("Failed to send OTP email:", error.message);
    throw createError(
      "Could not send the verification email. Please try again.",
      502
    );
  }

  return {
    sent: true,
    email: cleanEmail,
    expiresInMinutes: OTP_TTL_MINUTES,
  };
};

export const verifyEmailOtp = async ({ email, purpose, code, consume = false }) => {
  const cleanEmail = normalizeEmail(email);
  const cleanCode = String(code ?? "").trim();

  if (!cleanEmail || !cleanCode) {
    return {
      verified: false,
      reason: "Email and OTP are required",
    };
  }

  const record = await EmailOtp.findOneAndUpdate(
    {
      email: cleanEmail,
      purpose,
      consumedAt: null,
      expireAt: { $gt: new Date() },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    { $inc: { attempts: 1 } },
    { sort: { createdAt: -1 }, new: true }
  );

  if (!record) {
    return {
      verified: false,
      reason:
        "OTP expired, not found, or too many attempts. Please request a new code.",
    };
  }

  const isMatch = await bcrypt.compare(cleanCode, record.codeHash);
  if (!isMatch) {
    return {
      verified: false,
      reason: "Invalid OTP",
    };
  }

  if (consume) {
    const result = await EmailOtp.updateOne(
      { _id: record._id, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );
    if (result.modifiedCount !== 1) {
      return {
        verified: false,
        reason: "This OTP has already been used",
      };
    }
  }

  return {
    verified: true,
    email: cleanEmail,
  };
};