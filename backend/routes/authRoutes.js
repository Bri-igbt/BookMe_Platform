import express from "express";
import rateLimit from "express-rate-limit";
import auth from "../middleware/auth.js";
import {
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  loginUser,
  getMe,
  updateProfile,
} from "../controllers/authController.js";

const authRouter = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

authRouter.post("/request-otp", otpLimiter, requestRegistrationOtp);
authRouter.post("/verify-otp", loginLimiter, verifyRegistrationOtp);
authRouter.post("/register/request-otp", otpLimiter, requestRegistrationOtp);
authRouter.post("/register/verify-otp", loginLimiter, verifyRegistrationOtp);
authRouter.post("/register", loginLimiter, registerUser);
authRouter.post("/login", loginLimiter, loginUser);

authRouter.get("/me", auth, getMe);
authRouter.put("/profile", auth, updateProfile);

export default authRouter;
