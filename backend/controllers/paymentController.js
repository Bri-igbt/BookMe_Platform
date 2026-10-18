import crypto from "crypto";
import mongoose from "mongoose";
import User from "../models/User.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Withdrawal from "../models/Withdrawal.js";
import { getWalletSummary } from "../utils/wallet.js";

const MIN_WITHDRAWAL_AMOUNT = 100000;

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const cleanText = (value) => (typeof value === "string" ? value.trim() : "");

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

const handleError = (res, error) => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "You already have a withdrawal in progress",
    });
  }

  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};

// GET PAYMENT OVERVIEW
export const getPaymentOverview = async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);
    const [user, summary, transactions, withdrawals] = await Promise.all([
      User.findById(userId).select("payoutDetails"),
      getWalletSummary(userId),
      WalletTransaction.find({ userId }).sort({ createdAt: -1 }).limit(15),
      Withdrawal.find({ userId }).sort({ createdAt: -1 }).limit(10),
    ]);

    res.json({
      payoutDetails: user?.payoutDetails || {},
      wallet: summary,
      transactions,
      withdrawals,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE PAYOUT DETAILS
export const updatePayoutDetails = async (req, res) => {
  try {
    const accountHolderName = cleanText(req.body.accountHolderName);
    const bankName = cleanText(req.body.bankName);
    const bankCode = cleanText(req.body.bankCode);
    const accountNumber = digitsOnly(req.body.accountNumber);

    if (!accountHolderName || !bankName) {
      return res.status(400).json({
        message: "Account holder name and bank name are required",
      });
    }

    if (!/^\d{3,6}$/.test(bankCode)) {
      return res.status(400).json({ message: "A valid bank code is required" });
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return res.status(400).json({
        message: "Account number must be 10 digits",
      });
    }

    const payoutDetails = {
      accountHolderName,
      bankName,
      bankCode,
      accountLast4: accountNumber.slice(-4),
      isComplete: true,
      updatedAt: new Date(),
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { payoutDetails } },
      { new: true, runValidators: true }
    ).select("payoutDetails");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Payout details saved",
      payoutDetails: user.payoutDetails,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// REQUEST WITHDRAWAL
export const requestWithdrawal = async (req, res) => {
  try {
    const userId = toObjectId(req.user.id);

    const rawAmount = Number(req.body.amount);
    if (!Number.isFinite(rawAmount)) {
      return res.status(400).json({ message: "A valid amount is required" });
    }

    const amount = Math.round(rawAmount);
    if (amount < MIN_WITHDRAWAL_AMOUNT) {
      const minimum = (MIN_WITHDRAWAL_AMOUNT / 100).toLocaleString("en-NG");
      return res.status(400).json({
        message: `Withdrawal amount must be at least ₦${minimum}`,
      });
    }

    const user = await User.findById(userId).select("payoutDetails");
    if (!user?.payoutDetails?.isComplete) {
      return res
        .status(400)
        .json({ message: "Add payout details before requesting a withdrawal" });
    }

    const summary = await getWalletSummary(userId);
    if (amount > summary.available) {
      return res
        .status(400)
        .json({ message: "Withdrawal amount exceeds available balance" });
    }

    const { accountHolderName, bankName, bankCode, accountLast4 } =
      user.payoutDetails;

    const withdrawal = await Withdrawal.create({
      userId,
      reference: `WD-${crypto.randomUUID()}`,
      amount,
      currency: "ngn",
      payoutSnapshot: { accountHolderName, bankName, bankCode, accountLast4 },
    });

    try {
      await WalletTransaction.create({
        userId,
        withdrawalId: withdrawal._id,
        type: "withdrawal_hold",
        amount,
        currency: "ngn",
        status: "pending",
        description: "Withdrawal requested",
      });
    } catch (holdError) {
      // Without the hold the balance wouldn't go down, so undo the request.
      await Withdrawal.deleteOne({ _id: withdrawal._id });
      throw holdError;
    }

    res.status(201).json({ message: "Withdrawal requested", withdrawal });
  } catch (error) {
    return handleError(res, error);
  }
};