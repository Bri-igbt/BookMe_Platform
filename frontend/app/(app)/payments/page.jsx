'use client'

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import p3Image from '@/app/assets/P3.png';
import {
  getPaymentOverview,
  requestWithdrawal,
  updatePayoutDetails,
} from '@/app/api/payments.js'
import {
  Wallet,
  TrendingUp,
  Clock,
  ArrowDownToLine,
  Building2,
  CreditCard,
  Save,
  ExternalLink,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { paymentsPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const MIN_WITHDRAWAL_NAIRA = 1000;

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format((Number(amount) || 0) / 100);

const transactionLabel = (transaction) => {
  if (transaction.type === "booking_payout") {
    return transaction.description || "Booking payment received";
  }

  if (transaction.type === "withdrawal_hold") return "Withdrawal requested";
  if (transaction.type === "withdrawal_reversal") return "Withdrawal returned";

  return transaction.description || transaction.type;
};

const transactionAmount = (transaction) => {
  if (transaction.type === "withdrawal_hold")
    return -Math.abs(transaction.amount || 0);
  return transaction.amount || 0;
};

const page = () => {
  const [overview, setOverview] = useState(null);
  const [payoutMessage, setPayoutMessage] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [form, setForm] = useState({
    accountHolderName: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
  });

  const wallet = overview?.wallet || {};
  const payoutDetails = overview?.payoutDetails || {};
  const availableNaira = useMemo(
    () => ((wallet.available || 0) / 100).toFixed(2),
    [wallet.available]
  );

  const loadOverview = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setPayoutMessage("Please log in to manage payment details");
      return;
    }

    const { data } = await getPaymentOverview();
    setOverview(data);
    setForm((prev) => ({
      ...prev,
      accountHolderName: data.payoutDetails?.accountHolderName || "",
      bankName: data.payoutDetails?.bankName || "",
      bankCode: data.payoutDetails?.bankCode || "",
    }));
  }, []);

  useEffect(() => {
    loadOverview().catch((error) => {
      setPayoutMessage(
        error.response?.data?.message || "Could not load payment details"
      );
    });
  }, [loadOverview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === "accountNumber") nextValue = value.replace(/\D/g, "").slice(0, 10);
    if (name === "bankCode") nextValue = value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const savePayoutDetails = async (e) => {
    e.preventDefault();

    if (!/^\d{3,6}$/.test(form.bankCode)) {
      setPayoutMessage("Enter your bank code (3 to 6 digits)");
      return;
    }
    if (!/^\d{10}$/.test(form.accountNumber)) {
      setPayoutMessage("Account number must be 10 digits");
      return;
    }

    setSavingDetails(true);
    setPayoutMessage("");

    try {
      const { data } = await updatePayoutDetails({
        accountHolderName: form.accountHolderName.trim(),
        bankName: form.bankName.trim(),
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
      });
      setOverview((prev) => ({ ...prev, payoutDetails: data.payoutDetails }));
      setForm((prev) => ({ ...prev, accountNumber: "" }));
      setPayoutMessage(data.message);

    } catch (error) {
      setPayoutMessage(
        error.response?.data?.message || "Could not save payout details"
      )
    } finally {
      setSavingDetails(false)
    }
  };

  const submitWithdrawal = async (e) => {
    e.preventDefault();

    const naira = Number(withdrawAmount);
    if (!Number.isFinite(naira) || naira < MIN_WITHDRAWAL_NAIRA) {
      setWithdrawMessage(
        `The minimum withdrawal is ${formatMoney(MIN_WITHDRAWAL_NAIRA * 100)}`
      );
      return;
    }

    const amount = Math.round(naira * 100);
    if (amount > (wallet.available || 0)) {
      setWithdrawMessage("The amount is more than your available balance");
      return;
    }

    setWithdrawing(true);
    setWithdrawMessage("");

    try {
      const { data } = await requestWithdrawal(amount);
      setWithdrawMessage(data.message);
      setWithdrawAmount("");
      await loadOverview();

    } catch (error) {
      setWithdrawMessage(
        error.response?.data?.message || "Could not request withdrawal"
      )
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <section className={s.mainGrid}>
      <div className={s.leftColumn}>
        <div className={s.leftTopArea}>
          <div>
            <p className={s.pageLabel}>Payments</p>
            <h1 className={s.mainHeading}>
              Track <span className={s.gradientEarnings}>earnings</span>
              <br />
              and request withdrawals.
            </h1>
            <p className={s.subText}>
              Customer payments land with the platform first. A 10% platform
              fee is deducted, then the remaining balance becomes available
              here.
            </p>
          </div>
          <div className={s.illustrationContainer}>

            <Image
              src={p3Image}
              alt="Illustration"
              className={s.illustrationImg}
            />
          </div>
        </div>

        <div className={s.walletCardsGrid}>
          <div className={s.walletCard}>
            <div className={s.walletCardHeader}>
              <div className={s.walletIconBoxAvailable}>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <span className={s.walletCardLabel}>Available</span>
            </div>
            <h2 className={s.walletAmount}>
              {formatMoney(wallet.available)}
            </h2>
          </div>
          <div className={s.walletCard}>
            <div className={s.walletCardHeader}>
              <div className={s.walletIconBoxEarned}>
                <TrendingUp className="h-4 w-4 text-[#7D57F5]" />
              </div>
              <span className={s.walletCardLabel}>Total earned</span>
            </div>
            <h2 className={s.walletAmount}>{formatMoney(wallet.earned)}</h2>
          </div>
          <div className={s.walletCard}>
            <div className={s.walletCardHeader}>
              <div className={s.walletIconBoxPending}>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className={s.walletCardLabel}>Pending payouts</span>
            </div>
            <h2 className={s.walletAmount}>
              {formatMoney(wallet.pendingWithdrawals)}
            </h2>
            <p className={s.paidOutText}>
              Paid out: {formatMoney(wallet.paidWithdrawals)}
            </p>
          </div>
        </div>

        <section className={s.withdrawSection}>
          <h2 className={s.withdrawTitle}>
            <ArrowDownToLine className={s.withdrawIcon} />
            Withdraw balance
          </h2>
          <form onSubmit={submitWithdrawal} className={s.withdrawForm}>
            <div className={s.withdrawInputContainer}>
              <span className={s.withdrawInputIcon} aria-hidden="true">₦</span>
              <input
                type="number"
                min={MIN_WITHDRAWAL_NAIRA}
                step="0.01"
                aria-label="Withdrawal amount in naira"
                value={withdrawAmount}
                onChange={(event) => setWithdrawAmount(event.target.value)}
                placeholder={availableNaira}
                className={s.withdrawInput}
              />
            </div>
            <button
              type="submit"
              disabled={withdrawing || !payoutDetails.isComplete}
              className={s.requestButton}
            >
              <ArrowDownToLine className={s.requestButtonIcon} />
              {withdrawing ? "Requesting..." : "Request"}
            </button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Minimum withdrawal: {formatMoney(MIN_WITHDRAWAL_NAIRA * 100)}
          </p>
          {!payoutDetails.isComplete && (
            <p className={s.withdrawWarning}>
              Save payout details before requesting a withdrawal.
            </p>
          )}
          {withdrawMessage && (
            <p className={s.messageBox} role="status">
              {withdrawMessage}
            </p>
          )}
        </section>
      </div>

      <div className={s.rightColumn}>
        <section className={s.payoutDetailsSection}>
          <h2 className={s.payoutTitle}>
            <Building2 className={s.payoutTitleIcon} />
            Payout details
          </h2>
          <p className={s.payoutDescription}>
            We store only the last 4 digits of your account number. Enter the
            full number each time you save your details.
          </p>
          <form onSubmit={savePayoutDetails} className={s.payoutForm}>
            <label className={s.inputLabel}>
              Account holder
              <input
                name="accountHolderName"
                value={form.accountHolderName}
                onChange={handleChange}
                autoComplete="name"
                required
                className={s.textInput}
              />
            </label>
            <label className={s.inputLabel}>
              Bank name
              <input
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                required
                className={s.textInput}
              />
            </label>
            <div className={s.payoutGridTwoCol}>
              <label className={s.inputLabel}>
                Bank code
                <input
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 058"
                  required
                  className={s.textInput}
                />
              </label>
              <label className={s.inputLabel}>
                Account number
                <input
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="off"
                  placeholder={
                    payoutDetails.accountLast4
                      ? `Saved ending ${payoutDetails.accountLast4}`
                      : "10 digits"
                  }
                  required
                  className={s.textInput}
                />
              </label>
            </div>
            <button type="submit" disabled={savingDetails} className={s.saveButton}>
              <Save className={s.saveIcon} />
              {savingDetails ? "Saving..." : "Save payout details"}
            </button>
            {payoutMessage && (
              <p className={s.messageBox} role="status">
                {payoutMessage}
              </p>
            )}
          </form>
        </section>

        <section className={s.recentActivitySection}>
          <div className={s.recentActivityHeader}>
            <h2 className={s.recentActivityTitle}>
              <CreditCard className={s.recentActivityTitleIcon} />
              Recent activity
            </h2>
            
            <Link href="/bookings" className={s.bookingsLink}>
              Bookings
              <ExternalLink className={s.bookingsLinkIcon} />
            </Link>
          </div>
          <div className={s.transactionList}>
            {(overview?.transactions || []).map((transaction) => {
              const amount = transactionAmount(transaction);
              const isNegative = amount < 0;
              return (
                <div key={transaction._id} className={s.transactionItem}>
                  <div className={s.transactionLeft}>
                    <div
                      className={
                        isNegative
                          ? s.transactionIconBoxNegative
                          : s.transactionIconBoxPositive
                      }
                    >
                      {isNegative ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4" />
                      )}
                    </div>
                    <span className={s.transactionLabel}>
                      {transactionLabel(transaction)}
                    </span>
                  </div>
                  <strong
                    className={
                      isNegative
                        ? s.transactionAmountNegative
                        : s.transactionAmountPositive
                    }
                  >
                    {formatMoney(amount)}
                  </strong>
                </div>
              );
            })}
            {overview && overview.transactions?.length === 0 && (
              <p className={s.emptyText}>No wallet activity yet.</p>
            )}
          </div>
        </section>
      </div>
    </section>
  )
}

export default page