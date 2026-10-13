import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import slugify from "../utils/slug.js";

const MIN_PASSWORD_LENGTH = 8;
const DEFAULT_TIMEZONE = "Africa/Lagos";

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const normalizeEmail = (email) =>
  typeof email === "string" ? email.toLowerCase().trim() : "";

const isValidTimeZone = (timeZone) => {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return true;
  } catch (e) {
    return false;
  }
};

const toUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  slug: user.slug,
  businessName: user.businessName,
  businessDescription: user.businessDescription,
  brandTheme: user.brandTheme,
  brandAccent: user.brandAccent,
  timeZone: user.timeZone,
  googleCalendarConnected: user.googleCalendarConnected,
  googleCalendarId: user.googleCalendarId,
  payoutDetails: user.payoutDetails,
  stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
});

const generateUniqueSlug = async (source, excludeId) => {
  const base = slugify(source) || "business";
  let finalSlug = base;
  let counter = 1;

  const filterFor = (slug) =>
    excludeId ? { slug, _id: { $ne: excludeId } } : { slug };

  while (await User.exists(filterFor(finalSlug))) {
    finalSlug = `${base}-${counter}`;
    counter += 1;
  }

  return finalSlug;
};

const handleError = (res, error) => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  if (error.code === 11000) {
    if (error.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }
    return res.status(409).json({
      message: "That business name is already taken. Please try again.",
    });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      businessName,
      businessDescription,
      timeZone,
      emailOtp,
    } = req.body;

    const cleanName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = normalizeEmail(email);

    if (
      !cleanName ||
      !normalizedEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      });
    }

    if (timeZone && !isValidTimeZone(timeZone)) {
      return res.status(400).json({ message: "Invalid time zone" });
    }

    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const otpResult = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
      code: emailOtp,
      consume: true,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Email verification is required",
      });
    }

    const cleanBusinessName =
      typeof businessName === "string" ? businessName.trim() : "";
    const finalSlug = await generateUniqueSlug(cleanBusinessName || cleanName);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: cleanName,
      email: normalizedEmail,
      password: hashedPassword,
      slug: finalSlug,
      businessName: cleanBusinessName,
      businessDescription:
        typeof businessDescription === "string" ? businessDescription : "",
      timeZone: timeZone || DEFAULT_TIMEZONE,
    });

    const token = createToken(user._id);

    res.status(201).json({
      message: "Registered Successfully",
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// REQUEST REGISTRATION OTP
export const requestRegistrationOtp = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    const result = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
    });

    res.json({
      message: "Verification code sent",
      result,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// VERIFY REGISTRATION OTP
export const verifyRegistrationOtp = async (req, res) => {
  try {
    const { emailOtp } = req.body;
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail || !emailOtp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists.",
      });
    }

    const otpResult = await verifyEmailOtp({
      email: normalizedEmail,
      purpose: "registration",
      code: emailOtp,
      consume: false,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Invalid OTP",
      });
    }

    res.json({
      message: "OTP verified",
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!normalizedEmail || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = createToken(user._id);
    res.json({
      message: "Logged in successfully",
      token,
      user: toUserResponse(user),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// GET MY PROFILE
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      user: toUserResponse(user),
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { businessName, businessDescription, brandTheme, brandAccent } =
      req.body;
    const timeZone = req.body.timeZone ?? req.body.timezone;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (timeZone !== undefined) {
      if (!isValidTimeZone(timeZone)) {
        return res.status(400).json({ message: "Invalid time zone" });
      }
      user.timeZone = timeZone;
    }

    if (businessDescription !== undefined)
      user.businessDescription = businessDescription;
    if (brandTheme !== undefined) user.brandTheme = brandTheme;
    if (brandAccent !== undefined) user.brandAccent = brandAccent;

    if (typeof businessName === "string") {
      const cleanBusinessName = businessName.trim();
      if (cleanBusinessName !== user.businessName) {
        user.businessName = cleanBusinessName;
        user.slug = await generateUniqueSlug(
          cleanBusinessName || user.name,
          user._id
        );
      }
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: toUserResponse(user),
    });
  } catch (error) {
    return handleError(res, error);
  }
};
