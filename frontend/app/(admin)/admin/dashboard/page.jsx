'use client'

import { useEffect, useState } from "react";
import { useRouter, Link } from "next/navigation";
import { getAdminDashboard, updateWithdrawalStatus } from "@/app/api/admin.js";
import {
    User,
    Wallet,
    TrendingUp,
    Landmark,
    CheckCircle,
    XOctagon,
    Clock,
    UserCircle,
    ShieldCheck,
    Users,
    DollarSign,
} from 'lucide-react';
import logo from '@/app/assets/logo.png';
import { adminDashboardPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const formatMoney = (amount = 0, currency = "NGN") =>
    new Intl.NumberFormat("en-NG", { styles: "currency", currency }).format(
        amount / 100,
    );

    const withdrawalStatuses = ["processing", "paid", "rejected"];
    const terminalWithdrawalStatuses = ["paid", "rejected"];

    const isTerminalWithdrawalStatus = (status) =>
        terminalWithdrawalStatuses.includes(status)

    const formatStatusLabel = (item) =>
        item
            ? `${item.slice(0, 1).toUpperCase()}${item.slice(1)}`
            : "";


const page = () => {
    const router = useRouter();
    const [dashboard, setDashboard] = useState(null);
    const [message, setMessage] = useState("");
    const [updatingWithdrawalId, setUpdatingWithdrawalId] = useState("");
    const [pendingWithdrawalAction, setPendingWithdrawalAction] = useState(null);

    useEffect(() => {
        if (!localStorage.getItem("adminToken")) {
            router.push("/admin/login");
            return undefined;
        };

        let isActive =- true;

        getAdminDashboard()
        .then(({data}) => {
            if (isActive) {
                setDashboard(data);
            };
        })
        .catch((error) => {
            if (isActive) {
                error.response?.data?.message || "Could not load admin dashboard"
            }
        });

        return () => {
            isActive = false;
        };
    }, [router]);

    const requestWithdrawalStatusChange = (withdrawal, status) => {
        if (
            withdrawal.status === status || isTerminalWithdrawalStatus(withdrawal.status)
        ) {
            return ;
        }

        setPendingWithdrawalAction({ withdrawal, status})
    };

    const closeWithdrawalConfirm = () => {
        if (updatingWithdrawalId)  return;
        setPendingWithdrawalAction(null);
    };

    const changeWithdrawalStatus = async () => {
        if (!pendingWithdrawalAction) return;

        const { withdrawal, status } = pendingWithdrawalAction;
        setUpdatingWithdrawalId(withdrawal._id);

        try {
            const { data } = await updateWithdrawalStatus(withdrawal._id, { status });
            setDashboard((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    summary: data.summary || prev.summary,
                    withdrawals: prev.withdrawals.map((withdrawal) =>
                        withdrawal._id === data.withdrawal._id
                            ? data.withdrawal
                            : withdrawal,
                    ),
                };
            });
            setMessage(data.message || `Withdrawal marked as ${status}`);
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Could not update withdrawal",
            );
        } finally {
            setUpdatingWithdrawalId("");
            setPendingWithdrawalAction(null);
        }
    };

    const logout = () => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    const summary = dashboard?.summary || {};
    const pendingWithdrawal = pendingWithdrawalAction?.withdrawal;
    const WithdrawalConfirmIcon =
        pendingWithdrawalAction?.status === "rejected" ? XOctagon : ShieldCheck;
    const isConfirmingWithdrawal =
        pendingWithdrawal && updatingWithdrawalId === pendingWithdrawal._id;

    const getPayoutStatusClass = (isComplete) =>
        isComplete ? s.userPayoutReady : s.userPayoutPending;

    const getWithdrawalStatusClass = (status) =>
        s.withdrawalStatusColors[status] || s.withdrawalStatusDefault;

    const statCards = [
        {
            label: "Total Users",
            value: summary.users || 0,
            icon: Users,
            bg: s.statBg1,
            c: s.statColor1,
        },
        {
            label: "Paid Bookings",
            value: summary.paidBookings || 0,
            icon: CheckCircle,
            bg: s.statBg2,
            c: s.statColor2,
        },
        {
            label: "Gross Revenue",
            value: formatMoney(summary.grossRevenue),
            icon: TrendingUp,
            bg: s.statBg3,
            c: s.statColor3,
        },
        {
            label: "Platform Fees",
            value: formatMoney(summary.platformFees),
            icon: DollarSign,
            bg: s.statBg4,
            c: s.statColor4,
        },
        {
            label: "Provider Payouts",
            value: formatMoney(summary.providerPayouts),
            icon: Wallet,
            bg: s.statBg5,
            c: s.statColor5,
        },
        {
            label: "Withdrawal Hold",
            value: formatMoney(summary.withdrawalHolds),
            icon: Landmark,
            bg: s.statBg6,
            c: s.statColor6,
        },
    ];



    return (
        <div>page</div>
    )
}

export default page