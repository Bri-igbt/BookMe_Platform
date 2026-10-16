'use client'

import { useEffect, useMemo, useState } from "react";
import { getMe } from "@/app/api/auth.js";
import { listBookings } from "@/app/api/bookings.js";
import { getPaymentOverview } from "@/app/api/payments.js";
import { listServices } from "@/app/api/services.js";
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Wallet,
  Copy,
  RefreshCcw,
} from "lucide-react";
import p1Image from "@/app/assets/P1.png";
import whatsappLogo from "@/app/assets/WhatsApp-Logo.wine.png";
import instaLogo from "@/app/assets/Instagram-Glyph-Color-Logo.wine.png";
import facebookLogo from "@/app/assets/Facebook-f_Logo-Blue-Logo.wine.png";
import gmailLogo from "@/app/assets/gmail.webp";
import googleCalendarLogo from "@/app/assets/Google_Calendar-Logo.wine.png";
import p5Image from "@/app/assets/P5.png";
import C1 from "@/app/assets/icons/C1.png";
import C2 from "@/app/assets/icons/C2.png";
import C3 from "@/app/assets/icons/C3.png";
import C4 from "@/app/assets/icons/C4.png";
import C5 from "@/app/assets/icons/C5.png";
import C6 from "@/app/assets/icons/C6.png";
import C7 from "@/app/assets/icons/C7.png";
import C8 from "@/app/assets/icons/C8.png";
import A1 from "@/app/assets/avatars/A1.png";
import A2 from "@/app/assets/avatars/A2.png";
import A3 from "@/app/assets/avatars/A3.png";
import A4 from "@/app/assets/avatars/A4.png";
import A5 from "@/app/assets/avatars/A5.png";
import A6 from "@/app/assets/avatars/A6.png";
import A7 from "@/app/assets/avatars/A7.png";
import A8 from "@/app/assets/avatars/A8.png";
import A9 from "@/app/assets/avatars/A9.png";
import A10 from "@/app/assets/avatars/A10.png";
import A11 from "@/app/assets/avatars/A11.png";
import A12 from "@/app/assets/avatars/A12.png";
import A13 from "@/app/assets/avatars/A13.png";
import A15 from "@/app/assets/avatars/A15.png";
import A16 from "@/app/assets/avatars/A16.png";
import { dashboardPageStyles as s } from "@/app/assets/dummyStyles.jsx";
import Link from "next/link";
import Image from "next/image";

const ICON_MAP = {
  "C1.png": C1,
  "C2.png": C2,
  "C3.png": C3,
  "C4.png": C4,
  "C5.png": C5,
  "C6.png": C6,
  "C7.png": C7,
  "C8.png": C8,
};

const AVATAR_MAP = {
  "A1.png": A1,
  "A2.png": A2,
  "A3.png": A3,
  "A4.png": A4,
  "A5.png": A5,
  "A6.png": A6,
  "A7.png": A7,
  "A8.png": A8,
  "A9.png": A9,
  "A10.png": A10,
  "A11.png": A11,
  "A12.png": A12,
  "A13.png": A13,
  "A15.png": A15,
  "A16.png": A16,
};

const formatMoney = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format((amount || 0) / 100);

const formatCompact = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return value;
};

const formatLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseBookingDateValue = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getBookingDate = (booking, fallbackDate) =>
  parseBookingDateValue(booking.date || booking.createdAt) || fallbackDate;

const getBookingDateTime = (booking, fallbackDate) => {
  const date = new Date(getBookingDate(booking, fallbackDate));
  const match = /^(\d{2}):(\d{2})$/.exec(booking.startTime || "");

  if (match) {
    date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  }

  return date;
};

const isCancelled = (booking) =>
  booking.status === "cancelled" || booking.status === "payment_failed";

const countItems = (list) => list.length;

const sumEarnings = (list) =>
  list.reduce((sum, booking) => sum + (booking.providerPayoutAmount || 0), 0) /
  100;

const buildGmailShareUrl = (publicLink) => {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    su: "Book a session with me",
    body: `Here is my booking link: ${publicLink}`,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
};

const buildPath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

const buildTrend = (items, filter, getValue) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  let periods = [];

  if (filter === "daily") {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    periods = Array.from({ length: daysInMonth }, (_, i) => {
      const start = new Date(year, month, i + 1);
      return {
        start,
        end: new Date(year, month, i + 2),
        label: formatLocalDateKey(start),
        short: `${i + 1}`,
      };
    });
  } else if (filter === "weekly") {
    const monthEnd = new Date(year, month + 1, 1);
    let start = new Date(year, month, 1);
    let weekNum = 1;

    while (start < monthEnd) {
      const nextStart = new Date(start);
      nextStart.setDate(nextStart.getDate() + 7);
      periods.push({
        start: new Date(start),
        end: nextStart < monthEnd ? nextStart : monthEnd,
        label: `Week ${weekNum}`,
        short: `W${weekNum}`,
      });
      start = nextStart;
      weekNum += 1;
    }
  } else if (filter === "monthly") {
    periods = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(year, i, 1);
      return {
        start,
        end: new Date(year, i + 1, 1),
        label: start.toLocaleDateString("en-US", { month: "long" }),
        short: start.toLocaleDateString("en-US", { month: "short" }),
      };
    });
  } else {
    periods = Array.from({ length: 5 }, (_, i) => {
      const y = year - (4 - i);
      return {
        start: new Date(y, 0, 1),
        end: new Date(y + 1, 0, 1),
        label: `${y}`,
        short: `${y}`,
      };
    });
  }

  return periods.map(({ start, end, label, short }) => ({
    label,
    short,
    value: getValue(
      items.filter((item) => {
        const itemDate = getBookingDate(item, today);
        return itemDate >= start && itemDate < end;
      }),
    ),
  }));
};

const BarChart = ({ data, accent = "#7c3aed" }) => {
  const [tooltip, setTooltip] = useState(null);
  const width = 760;
  const height = 240;
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };
  const values = data.map((item) => item.value);
  const maxValueOrig = Math.max(1, ...values);
  const maxValue = maxValueOrig * 1.2 || 1;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const barWidth = (plotWidth / data.length) * 0.55;
  const spacing = (plotWidth / data.length) * 0.45;

  const ticks = [0, 0.33, 0.66, 1].map((ratio) => ({
    y: padding.top + ratio * plotHeight,
    value: Math.round(maxValue - ratio * maxValue),
  }));

  return (
    <div className={s.barChartWrapper}>
      <svg viewBox={`0 0 ${width} ${height}`} className={s.barChartSvg}>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <text
              x={padding.left - 10}
              y={tick.y + 4}
              textAnchor="end"
              className={s.barChartTickText}
            >
              ₦{formatCompact(tick.value)}
            </text>
          </g>
        ))}
        {data.map((item, index) => {
          const barH = (item.value / maxValue) * plotHeight;
          const x = padding.left + index * (barWidth + spacing) + spacing / 2;
          const y = padding.top + plotHeight - barH;
          const showLabel =
            index % Math.ceil(data.length / 6) === 0 ||
            index === data.length - 1;
          return (
            <g key={item.label}>
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={height}
                fill="transparent"
                className={s.barChartBarInteractive}
                onMouseEnter={() =>
                  setTooltip({
                    x: x + barWidth / 2,
                    y: Math.max(y, padding.top),
                    text: `₦${item.value.toLocaleString("en-NG")} earnings on ${item.label}`,
                  })
                }
                onMouseLeave={() => setTooltip(null)}
              />
              <rect
                x={x}
                y={Math.max(y, padding.top)}
                width={barWidth}
                height={Math.max(barH, 4)}
                fill="url(#barGradient)"
                rx="4"
                className={`${s.barChartBar} ${tooltip?.x === x + barWidth / 2 ? "opacity-100" : "opacity-80"}`}
              />
              {showLabel && (
                <text
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  className={s.barChartLabel}
                >
                  {item.short}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.8" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
      {tooltip && (
        <div
          className={s.barChartTooltip}
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `calc(${(tooltip.y / height) * 100}% - 4px)`,
          }}
        >
          {tooltip.text}
          <div className={s.barChartTooltipArrow}></div>
        </div>
      )}
    </div>
  );
};

const LineChart = ({ data, accent = "#7D57F5" }) => {
  const [tooltip, setTooltip] = useState(null);
  const width = 760;
  const height = 300;
  const padding = { top: 28, right: 26, bottom: 42, left: 42 };
  const values = data.map((item) => item.value);
  const maxValue = Math.max(1, ...values);
  const minValue = Math.min(0, ...values);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const range = Math.max(1, maxValue - minValue);
  const points = data.map((item, index) => {
    const x = padding.left + (index / Math.max(1, data.length - 1)) * plotWidth;
    const y = padding.top + ((maxValue - item.value) / range) * plotHeight;
    return { ...item, x, y };
  });
  const linePath = buildPath(points);
  const areaPath = `${linePath} L ${padding.left + plotWidth} ${padding.top + plotHeight} L ${padding.left} ${padding.top + plotHeight} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    y: padding.top + ratio * plotHeight,
    value: Math.round(maxValue - ratio * range),
  }));

  return (
    <div className={s.lineChartWrapper}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={s.lineChartSvg}
        role="img"
        aria-label="Bookings line graph"
      >
        <defs>
          <linearGradient id="bookingLineFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="8"
              floodColor={accent}
              floodOpacity="0.12"
            />
          </filter>
        </defs>
        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              x1={padding.left}
              x2={padding.left + plotWidth}
              y1={tick.y}
              y2={tick.y}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 12}
              y={tick.y + 4}
              textAnchor="end"
              className={s.lineChartTickText}
            >
              {formatCompact(tick.value)}
            </text>
          </g>
        ))}
        <path d={areaPath} fill="url(#bookingLineFill)" />
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#softShadow)"
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle
              cx={point.x}
              cy={point.y}
              r="18"
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() =>
                setTooltip({
                  x: point.x,
                  y: point.y,
                  text: `${point.value} bookings on ${point.label}`,
                })
              }
              onMouseLeave={() => setTooltip(null)}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={accent}
              strokeWidth="3.5"
              className="pointer-events-none"
            />
            <text
              x={point.x}
              y={height - 14}
              textAnchor="middle"
              className={s.lineChartLabel}
            >
              {point.short}
            </text>
          </g>
        ))}
      </svg>
      {tooltip && (
        <div
          className={s.lineChartTooltip}
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `calc(${(tooltip.y / height) * 100}% - 8px)`,
          }}
        >
          {tooltip.text}
          <div className={s.lineChartTooltipArrow}></div>
        </div>
      )}
    </div>
  );
};

const StatusPanel = ({ confirmed, rescheduled, cancelled }) => {
  const trueTotal = confirmed + rescheduled + cancelled;
  const denominator = Math.max(1, trueTotal);
  const confPct = (confirmed / denominator) * 100;
  const reschPct = (rescheduled / denominator) * 100;

  return (
    <div className={s.statusPanelContainerFlex}>
      <div
        className={s.statusDonutWrapper}
        style={{
          background:
            trueTotal === 0
              ? "#f1f5f9"
              : `conic-gradient(#7D57F5 0% ${confPct}%, #fb923c ${confPct}% ${confPct + reschPct}%, #ef4444 ${confPct + reschPct}% 100%)`,
        }}
      >
        <div className={s.statusDonutInner}>
          <span className={s.statusTotalNumber}>{trueTotal}</span>
          <span className={s.statusTotalLabel}>Total</span>
        </div>
      </div>

      <div className={s.statusLegendList}>
        {[
          {
            label: "Confirmed",
            value: confirmed,
            pct: confPct,
            color: "bg-gradient-to-b from-[#CBB8FF] via-[#9B7BFF] to-[#7D57F5]",
          },
          {
            label: "Rescheduled",
            value: rescheduled,
            pct: reschPct,
            color: "bg-[#fb923c]",
          },
          {
            label: "Cancelled",
            value: cancelled,
            pct: (cancelled / denominator) * 100,
            color: "bg-[#ef4444]",
          },
        ].map((item) => (
          <div key={item.label} className={s.statusLegendItem}>
            <div className={s.statusLegendLeft}>
              <span className={`${s.statusColorSwatch} ${item.color}`}></span>
              <span className={s.statusLegendLabel}>{item.label}</span>
            </div>
            <div className={s.statusLegendRight}>
              <span className={s.statusLegendValue}>{item.value}</span>
              <span className={s.statusLegendPercent}>
                {item.pct.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const page = () => {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [bookingFilter, setBookingFilter] = useState("daily");
  const [earningFilter, setEarningFilter] = useState("daily");

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;

    let isActive = true;

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        getMe(),
        listServices(),
        listBookings(),
        getPaymentOverview(),
      ]);

      if (!isActive) return;

      const [me, servicesResult, bookingsResult, payments] = results;

      if (me.status === "fulfilled") setUser(me.value.data.user);
      if (servicesResult.status === "fulfilled") {
        setServices(servicesResult.value.data.services || []);
      }
      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value.data.bookings || []);
      }
      if (payments.status === "fulfilled") {
        setWallet(payments.value.data.wallet || null);
      }

      const failedCount = results.filter(
        (result) => result.status === "rejected",
      ).length;
      setLoadError(
        failedCount > 0
          ? "Some dashboard data could not be loaded. Please refresh the page."
          : "",
      );
    };

    loadDashboard();

    return () => {
      isActive = false;
    };
  }, []);

  const publicLink = user?.slug
    ? `${window.location.origin}/book/${user.slug}`
    : "";

  const {
    confirmedBookings,
    rescheduledBookings,
    paidBookings,
    statusCounts,
  } = useMemo(
    () => ({
      confirmedBookings: bookings.filter(
        (booking) => booking.status === "confirmed",
      ),
      rescheduledBookings: bookings.filter((booking) => booking.isRescheduled),
      paidBookings: bookings.filter(
        (booking) => booking.paymentStatus === "paid",
      ),
      statusCounts: {
        confirmed: bookings.filter(
          (booking) => booking.status === "confirmed" && !booking.isRescheduled,
        ).length,
        rescheduled: bookings.filter(
          (booking) => booking.isRescheduled && !isCancelled(booking),
        ).length,
        cancelled: bookings.filter(isCancelled).length,
      },
    }),
    [bookings],
  );

  const monthlyEarningsTrend = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const earningsFor = (month, year) =>
      paidBookings
        .filter((booking) => {
          const date = getBookingDate(booking, today);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .reduce((sum, booking) => sum + (booking.providerPayoutAmount || 0), 0);

    const currentEarnings = earningsFor(currentMonth, currentYear);
    const prevEarnings = earningsFor(prevMonth, prevYear);

    if (prevEarnings === 0) return currentEarnings > 0 ? 100 : 0;
    return ((currentEarnings - prevEarnings) / prevEarnings) * 100;
  }, [paidBookings]);

  const bookingTrend = useMemo(
    () => buildTrend(bookings, bookingFilter, countItems),
    [bookings, bookingFilter],
  );

  const earningTrend = useMemo(
    () => buildTrend(paidBookings, earningFilter, sumEarnings),
    [paidBookings, earningFilter],
  );

  const topServices = useMemo(() => {
    return services
      .map((service) => ({
        ...service,
        bookingCount: bookings.filter(
          (booking) =>
            booking.serviceId?._id === service._id ||
            booking.service?._id === service._id,
        ).length,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 4);
  }, [services, bookings]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .map((booking) => ({
        ...booking,
        displayDate: getBookingDateTime(booking, now),
      }))
      .filter((booking) => booking.displayDate >= now && !isCancelled(booking))
      .sort((a, b) => a.displayDate - b.displayDate)
      .slice(0, 3);
  }, [bookings]);

  const copyPublicLink = async () => {
    if (!publicLink) return;

    try {
      await navigator.clipboard.writeText(publicLink);
      setCopyMessage("Copied");
    } catch (error) {
      setCopyMessage("Could not copy");
    }

    window.setTimeout(() => setCopyMessage(""), 1800);
  };

  return (
    <div className={s.mainContainer}>
      <header>
        <h1 className={s.headerTitle}>
          {user ? (
            <>
              Welcome Back,{" "}
              <span className={s.gradientText}>
                {user.businessName || user.name}
              </span>{" "}
              <span className="ml-2">👋</span>
            </>
          ) : (
            "Good morning 👋"
          )}
        </h1>
        <p className={s.headerSubtitle}>
          Here's what's happening with your business today.
        </p>
        <div className={s.headerButtonsContainer}>
          <Link href="/services" className={s.headerButton}>
            Add services
          </Link>
          <Link href="/availability" className={s.headerButton}>
            Set availability
          </Link>
          <Link href="/payments" className={s.headerButton}>
            Payment details
          </Link>
        </div>
        {loadError && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {loadError}
          </p>
        )}
      </header>

      <div className={s.heroGrid}>
        <div className={s.heroCard}>
          <div className={s.heroContent}>
            <h2 className={s.heroTitle}>
              Grow your practice.
              <br />
              Impact more lives.
            </h2>
            {publicLink ? (
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className={s.heroButton}
              >
                View booking page <ArrowRight className={s.arrowIcon} />
              </a>
            ) : (
              <Link href="/profile" className={s.heroButton}>
                Setup booking page <ArrowRight className={s.arrowIcon} />
              </Link>
            )}
          </div>
          <div className={s.heroImageWrapper}>
            <Image src={p1Image} alt="Hero" className={s.heroImage} />
          </div>
        </div>

        <div className={s.publicLinkCard}>
          <h3 className={s.publicLinkTitle}>Public booking link</h3>
          <div className={s.publicLinkInputContainer}>
            <span className={s.publicLinkText}>
              {publicLink || "Save profile to generate..."}
            </span>
            {publicLink && (
              <button
                type="button"
                onClick={copyPublicLink}
                className={s.copyButton}
                aria-label={copyMessage || "Copy booking link"}
                title={copyMessage || "Copy booking link"}
              >
                <Copy className={s.copyIcon} />
              </button>
            )}
          </div>
          <p className={s.publicLinkHelper}>
            Share your link and start getting
            <br />
            bookings instantly.
          </p>

          {publicLink && (
            <>
              <h4 className={s.shareTitle}>Share your link</h4>
              <div className={s.socialIconsContainer}>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Book a session with me: " + publicLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={s.socialIconLink}
                >
                  <Image
                    src={whatsappLogo}
                    alt="WhatsApp"
                    className={s.socialIconImgWhatsapp}
                    width={20}
                    height={20}
                  />
                </a>
                <a
                  href={`https://www.instagram.com/`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => copyPublicLink()}
                  title="Link copied to clipboard for Instagram bio"
                  className={s.socialIconLinkInstagram}
                >
                  <Image
                    src={instaLogo}
                    alt="Instagram"
                    className={s.socialIconImgInstagram}
                    width={20}
                    height={20}
                  />
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicLink)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={s.socialIconLinkInstagram}
                >
                  <Image
                    src={facebookLogo}
                    alt="Facebook"
                    className={s.socialIconImgFacebook}
                    width={20}
                    height={20}
                  />
                </a>
                <a
                  href={buildGmailShareUrl(publicLink)}
                  target="_blank"
                  rel="noreferrer"
                  className={s.socialIconLinkInstagram}
                >
                  <Image
                    src={gmailLogo}
                    alt="Gmail"
                    className={s.socialIconImgGmail}
                    width={20}
                    height={20}
                  />
                </a>
                <button
                  type="button"
                  onClick={copyPublicLink}
                  className={s.copySocialButton}
                  aria-label="Copy booking link"
                >
                  <Copy className={s.copyIcon} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={s.statsGrid}>
        {[
          {
            label: "Total Bookings",
            value: bookings.length,
            icon: Calendar,
            icfg: "text-[#7D57F5]",
            ibg: "bg-[#F4F0FF]",
          },
          {
            label: "Confirmed",
            value: confirmedBookings.length,
            icon: CheckCircle,
            icfg: "text-[#16a34a]",
            ibg: "bg-[#eafbef]",
          },
          {
            label: "Rescheduled",
            value: rescheduledBookings.length,
            icon: RefreshCcw,
            icfg: "text-[#ea580c]",
            ibg: "bg-[#ffedd5]",
          },
          {
            label: "Total Income",
            value: formatMoney(
              paidBookings.reduce(
                (sum, booking) => sum + (booking.providerPayoutAmount || 0),
                0,
              ),
            ),
            icon: Wallet,
            icfg: "text-[#16a34a]",
            ibg: "bg-[#eafbef]",
          },
        ].map((stat, i) => (
          <div key={i} className={s.statCard}>
            <div className={`${s.statIconWrapper} ${stat.ibg} ${stat.icfg}`}>
              <stat.icon className="w-[22px] h-[22px]" />
            </div>
            <div>
              <p className={s.statLabel}>{stat.label}</p>
              <h2 className={s.statValue}>{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <section className={s.chartsGrid}>
        <div className={s.chartCard}>
          <div className={s.chartHeader}>
            <h3 className={s.chartTitle}>Booking Overview</h3>
            <select
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className={s.chartSelect}
              aria-label="Booking overview period"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={s.chartOverflow}>
            <div className={s.chartInnerWrapper}>
              <LineChart data={bookingTrend} accent="#7D57F5" />
            </div>
          </div>
        </div>

        <div className={s.chartCard}>
          <h3 className={s.chartTitle}>Bookings by Status</h3>
          <div className={s.statusPanelContainer}>
            <StatusPanel
              confirmed={statusCounts.confirmed}
              rescheduled={statusCounts.rescheduled}
              cancelled={statusCounts.cancelled}
            />
          </div>
        </div>
      </section>

      <section className={s.bottomGrid}>
        <div className={s.topServicesCard}>
          <div className={s.servicesHeader}>
            <h3 className={s.chartTitle}>Top Services</h3>
            <Link href="/services" className={s.viewAllLink}>
              View all
            </Link>
          </div>
          <div className={s.servicesList}>
            {topServices.map((service, index) => {
              const max = Math.max(
                1,
                ...topServices.map((i) => i.bookingCount),
              );
              const pct = ((service.bookingCount / max) * 100).toFixed(0);
              const truePct = (
                (service.bookingCount / Math.max(1, bookings.length)) *
                100
              ).toFixed(0);
              const barColors = [
                "bg-[#7c3aed]",
                "bg-[#2563eb]",
                "bg-[#16a34a]",
                "bg-[#ea580c]",
              ];
              const barColor = barColors[index % barColors.length];

              return (
                <div
                  key={service._id}
                  className="flex items-center mb-6 last:mb-0"
                >
                  <div className={`${s.serviceIconBox} mr-4`}>
                    <Image
                      src={ICON_MAP[service.icon] || C1}
                      alt={service.name}
                      className={s.serviceIconImg}
                    />
                  </div>
                  <div className="flex-1 pr-6">
                    <p className="text-[14px] font-semibold text-slate-800 leading-tight">
                      {service.name}
                    </p>
                    <p className="text-[12px] font-medium text-slate-500 mt-1 mb-2.5">
                      {service.bookingCount} bookings
                    </p>
                    <div className="w-full h-[4px] bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{
                          width: `${pct}%`,
                          transition: "width 1s ease-out",
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-slate-600 text-right min-w-[36px]">
                    {truePct}%
                  </span>
                </div>
              );
            })}
            {topServices.length === 0 && (
              <p className="text-[13px] font-medium text-slate-500 text-center pt-10">
                Add services to start tracking demand.
              </p>
            )}
          </div>
        </div>

        <div className={s.earningsCard}>
          <div className={s.earningsHeader}>
            <h3 className={s.chartTitle}>Earnings Overview</h3>
            <select
              value={earningFilter}
              onChange={(e) => setEarningFilter(e.target.value)}
              className={s.earningsSelect}
              aria-label="Earnings overview period"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={s.earningsAmountRow}>
            <h2 className={s.earningsAmount}>
              {formatMoney(wallet?.available || 0)}
            </h2>
            <div className={s.earningsTrendContainer}>
              <span
                className={
                  monthlyEarningsTrend >= 0
                    ? s.earningsTrendUp
                    : s.earningsTrendDown
                }
              >
                <ArrowRight
                  className={`${s.trendArrow} ${monthlyEarningsTrend >= 0 ? "-rotate-45" : "rotate-45"} mr-1`}
                />
                {Math.abs(monthlyEarningsTrend).toFixed(1)}%
              </span>
              <span className={s.trendLabel}>from last month</span>
            </div>
          </div>
          <div className={s.chartOverflow}>
            <div className={s.chartInnerWrapper}>
              <BarChart data={earningTrend} accent="#7c3aed" />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Bookings & Integrations */}
      <section className={s.bottomGrid}>
        <div className={s.upcomingCard}>
          <div className={s.upcomingHeader}>
            <h3 className={s.chartTitle}>Upcoming Bookings</h3>
            <Link href="/bookings" className={s.viewAllLink}>
              View all
            </Link>
          </div>
          <div className={s.upcomingList}>
            {upcomingBookings.map((booking) => {
              const isConfirmed = booking.status === "confirmed";
              const badgeColors = isConfirmed
                ? s.badgeConfirmed
                : s.badgePending;
              const date = booking.displayDate;
              return (
                <div key={booking._id} className={s.bookingRow}>
                  <div className={s.bookingLeft}>
                    <div className={s.avatarBox}>
                      <Image
                        src={AVATAR_MAP[booking.customerAvatar] || A1}
                        alt={booking.customerName || "Guest"}
                        className={s.avatarImg}
                      />
                    </div>
                    <div>
                      <p className={s.bookingCustomerName}>
                        {booking.customerName || "Guest"}
                      </p>
                      <p className={s.bookingServiceName}>
                        {booking.serviceId?.name ||
                          booking.service?.name ||
                          "Service"}
                      </p>
                    </div>
                  </div>
                  <div className={s.bookingRight}>
                    <div className={s.bookingDateTimeWrapper}>
                      <div className={s.bookingDate}>
                        <Calendar className={s.calendarIconSmall} />{" "}
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className={s.bookingTime}>
                        <Clock className={s.clockIconSmall} />{" "}
                        {booking.startTime && booking.endTime
                          ? `${booking.startTime} - ${booking.endTime}`
                          : date.toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </div>
                    </div>
                    <span className={`${s.bookingBadgeBase} ${badgeColors}`}>
                      {isConfirmed ? "Confirmed" : "Pending"}
                    </span>
                  </div>
                </div>
              );
            })}
            {upcomingBookings.length === 0 && (
              <p className="text-[13px] font-medium text-slate-500 text-center pt-8">
                No upcoming bookings.
              </p>
            )}
          </div>
        </div>

        <div className={s.integrationsCard}>
          <h3 className={s.integrationsTitle}>Integrations</h3>
          <div className={s.integrationsList}>
            <div className={s.integrationItem}>
              <div className={s.integrationIconBox}>
                <Image
                  src={googleCalendarLogo}
                  alt="Google Calendar"
                  className={s.integrationIconImgDefault}
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <p className={s.integrationName}>Google Calendar</p>
                <div className={s.integrationStatus}>
                  {user?.googleCalendarConnected ? (
                    <>
                      <CheckCircle className={s.checkIcon} />{" "}
                      <span className={s.statusText}>Connected</span>
                    </>
                  ) : (
                    <Link href="/profile" className={s.statusText}>
                      Not connected. Connect in profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className={s.integrationItem}>
              <div className={s.integrationIconBox}>
                <Image
                  src={gmailLogo}
                  alt="Gmail"
                  className={s.integrationIconImgGmail}
                  width={20}
                  height={20}
                />
              </div>
              <div>
                <p className={s.integrationName}>Gmail</p>
                <div className={s.integrationStatus}>
                  <CheckCircle className={s.checkIconSmall} />{" "}
                  <span className={s.statusTextSmall}>Connected</span>
                </div>
              </div>
            </div>
          </div>
          <div className={s.integrationsImageWrapper}>
            <Image
              src={p5Image}
              alt="Integration visual"
              className={s.integrationsImage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default page;