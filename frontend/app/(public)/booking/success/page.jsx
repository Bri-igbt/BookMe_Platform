'use client'

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPublicBookingStatus } from "@/app/api/public.js";
import {
  BadgeCheck,
  Calendar,
  CalendarDays,
  ArrowLeft,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { bookingSuccessPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 3000;

const FAILED_MESSAGE =
  "We could not verify the payment. No booking was created.";

const formatStatus = (value) => (value ? value.replace(/_/g, " ") : "");

const SuccessMessage = () => {
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState("verifying"); 
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      setStatus("failed");
      setMessage(FAILED_MESSAGE);
      return undefined;
    }

    let isActive = true;
    let timer = null;
    let attempts = 0;

    const checkBooking = async () => {
      attempts += 1;

      try {
        const { data } = await getPublicBookingStatus({
          session_id: sessionId,
        });

        if (!isActive) return;

        const found = data.booking;
        setBooking(found);

        if (found.status === "confirmed" && found.paymentStatus === "paid") {
          setStatus("confirmed");
          setMessage("Payment received. Your booking is confirmed.");
          return;
        }

        if (found.status === "pending_payment") {
          if (attempts < MAX_ATTEMPTS) {
            timer = setTimeout(checkBooking, POLL_INTERVAL_MS);
            return;
          }

          setStatus("pending");
          setMessage(
            "Your payment is still being processed. We will email you as soon as your booking is confirmed.",
          );
          return;
        }

        setStatus("failed");
        setMessage(FAILED_MESSAGE);
      } catch (error) {
        if (!isActive) return;

        if (!error.response && attempts < MAX_ATTEMPTS) {
          timer = setTimeout(checkBooking, POLL_INTERVAL_MS);
          return;
        }

        setStatus("failed");
        setMessage(error.response?.data?.message || FAILED_MESSAGE);
      }
    };

    checkBooking();

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [searchParams]);

  const slug = searchParams.get("slug");

  let statusIcon = <Loader2 className={`${s.checkIcon} animate-spin`} />;
  if (status === "confirmed") {
    statusIcon = <BadgeCheck className={s.checkIcon} />;
  } else if (status === "pending") {
    statusIcon = <Clock className={s.checkIcon} />;
  } else if (status === "failed") {
    statusIcon = <XCircle className={s.checkIcon} style={{ color: "#dc2626" }} />;
  }

  return (
    <div className={s.container}>
      <main className={s.card}>
        <div className={s.iconCircle}>{statusIcon}</div>

        <p className={s.statusLabel}>
          Payment verification
        </p>
        <h1 className={s.heading} role="status" aria-live="polite">
          {message}
        </h1>

        {booking && (
          <div className={s.bookingDetails}>
            <div className={s.serviceRow}>
              <CalendarDays className={s.calendarDaysIcon} />
              <p className={s.serviceName}>
                {booking.service?.name || booking.serviceId?.name || "Appointment"}
              </p>
            </div>

            <p className={s.detailText}>
              {booking.date} • {booking.startTime}-{booking.endTime}
            </p>
            <p className={s.statusText}>
              Status: {formatStatus(booking.status)}
            </p>
          </div>
        )}

        {status === "confirmed" && booking?.customerCalendarUrl && (
          <a
            href={booking.customerCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.addToCalendarLink}
          >
            <Calendar className={s.calendarIcon} />
            Add to Google Calendar
          </a>
        )}

        <Link
          href={slug ? `/book/${encodeURIComponent(slug)}` : "/"}
          className={s.backLink}
        >
          <ArrowLeft className={s.backIcon} />
          Back to Booking Page
        </Link>
      </main>
    </div>
  )
}

const page = () => (
  <Suspense fallback={null}>
    <SuccessMessage />
  </Suspense>
);

export default page;