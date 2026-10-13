import express from "express";
import rateLimit from "express-rate-limit";
import { cancelPublicBookingPayment, createPublicBooking, getBookingStatus, getPublicBusiness, getPublicSlots, requestPublicBookingOtp, verifyPublicBookingOtp } from "../controllers/publicController.js";


const publicRouter = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Please try again later." },
});

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

const bookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many booking attempts. Please try again later." },
});

publicRouter.get("/booking/status", getBookingStatus);
publicRouter.post("/booking/cancel-payment", cancelPublicBookingPayment);
publicRouter.get("/:slug", getPublicBusiness);
publicRouter.get("/:slug/slots", getPublicSlots);
publicRouter.post("/:slug/request-otp", otpLimiter, requestPublicBookingOtp);
publicRouter.post("/:slug/verify-otp", verifyLimiter, verifyPublicBookingOtp);
publicRouter.post("/:slug/book", bookLimiter, createPublicBooking);

export default publicRouter;
