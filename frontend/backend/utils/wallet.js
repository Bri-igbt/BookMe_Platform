// import WalletTransaction from "../models/WalletTransaction.js";
// import Withdrawal from "../models/Withdrawal.js";

// export const createBookingPayoutTransaction = async ({
//   booking,
//   description,
// }) => {
//   if (!booking?.providerPayoutAmount) return null;

//   try {
//     return await WalletTransaction.create({
//       userId: booking.userId,
//       bookingId: booking._id,
//       type: "booking_payout",
//       amount: booking.providerPayoutAmount,
//       currency: booking.currency,
//       status: "available",
//       description: description || "Booking payout after platform fee",
//     });

//   } catch (error) {
//     if (error.code === 11000) {
//       return WalletTransaction.findOne({
//         bookingId: booking._id,
//         type: "booking_payout",
//       });
//     }

//     throw error;
//   }
// };

// export const getWalletSummary = async (userId) => {
//     const [rows, withdrawalRows] = await Promise.all([
//         WalletTransaction.aggregate([
//             {$match: { user }},
//             {
//                 $group: {
//                     _id: '$type',
//                     total: { $sum: '$amount' }
//                 },
//             },
//         ]),

//         Withdrawal.aggregate([
//             { $match: { user }},
//             {
//                 $group: {
//                     _id: '$status',
//                     total: { $sum: '$amount' }
//                 },
//             },
//         ]),
//     ]);

//     const totals = rows.reduce((acc, row) => ({ ...acc, [row._id]: row.total }), {});
//     const withdrawalTotals = withdrawalRows.reduce((acc, row) => ({ ...acc, [row._id]: row.total }), {});
//     const earned = totals.booking_payout || 0;
//     const held = totals.booking_hold || 0;
//     const reversed = totals.withdrawal_reversal || 0;
//     const pendingWithdrawals = (withdrawalTotals.pending || 0) + (withdrawalTotals.processing || 0);
//     const paidWithdrawals = withdrawalTotals.paid || 0;

//     return {
//         earned,
//         withdrawOrPending: held - reversed,
//         pendingWithdrawals,
//         paidWithdrawals,
//         available: Math.max(0, earned - held + reversed),
//     };
// }

import mongoose from "mongoose";
import WalletTransaction from "../models/WalletTransaction.js";
import Withdrawal from "../models/Withdrawal.js";

export const createBookingPayoutTransaction = async ({
  booking,
  description,
}) => {
  if (!booking?.providerPayoutAmount) return null;

  try {
    return await WalletTransaction.create({
      userId: booking.userId,
      bookingId: booking._id,
      type: "booking_payout",
      amount: booking.providerPayoutAmount,
      currency: booking.currency,
      status: "available",
      description: description || "Booking payout after platform fee",
    });
  } catch (error) {
    if (error.code === 11000) {
      return WalletTransaction.findOne({
        bookingId: booking._id,
        type: "booking_payout",
      });
    }

    throw error;
  }
};

const sumByKey = (rows) =>
  Object.fromEntries(rows.map((row) => [row._id, row.total]));

export const getWalletSummary = async (userId) => {
  const userObjectId = new mongoose.Types.ObjectId(String(userId));

  const [rows, withdrawalRows] = await Promise.all([
    WalletTransaction.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
        },
      },
    ]),

    Withdrawal.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$status",
          total: { $sum: "$amount" },
        },
      },
    ]),
  ]);

  const totals = sumByKey(rows);
  const withdrawalTotals = sumByKey(withdrawalRows);

  const earned = totals.booking_payout || 0;
  const held = totals.booking_hold || 0;
  const reversed = totals.withdrawal_reversal || 0;
  const pendingWithdrawals =
    (withdrawalTotals.pending || 0) + (withdrawalTotals.processing || 0);
  const paidWithdrawals = withdrawalTotals.paid || 0;

  return {
    earned,
    withdrawOrPending: held - reversed,
    pendingWithdrawals,
    paidWithdrawals,
    available: Math.max(0, earned - held + reversed),
  };
};
