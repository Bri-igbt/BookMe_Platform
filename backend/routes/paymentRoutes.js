import express from "express";
import auth from "../middleware/auth.js";
import {
  getPaymentOverview,
  requestWithdrawal,
  updatePayoutDetails,
} from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.get("/", auth, getPaymentOverview);
paymentRouter.get("/payout-details", auth, updatePayoutDetails);
paymentRouter.get("/withdrawal", auth, requestWithdrawal);

export default paymentRouter;
