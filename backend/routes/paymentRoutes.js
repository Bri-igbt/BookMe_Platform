import express from "express";
import rateLimit from "express-rate-limit";
import auth from "../middleware/auth.js";
import {
  getPaymentOverview,
  updatePayoutDetails,
  requestWithdrawal,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.use(auth);

const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many withdrawal requests. Please try again later." },
});

paymentRouter.get("/overview", getPaymentOverview);
paymentRouter.get("/", getPaymentOverview); 
paymentRouter.put("/payout-details", updatePayoutDetails);
paymentRouter.post("/withdrawals", withdrawalLimiter, requestWithdrawal);

export default paymentRouter;
