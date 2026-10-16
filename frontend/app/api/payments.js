import client from "./client.js";

export const getPaymentOverview = () => client.get("/payments");

export const updatePayoutDetails = (data) =>
  client.put("/payments/payout-details", data);

export const requestWithdrawal = (amount) =>
  client.post("/payments/withdrawals", { amount });
