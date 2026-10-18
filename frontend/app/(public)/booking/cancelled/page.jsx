
"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";
import { cancelPublicBookingPayments } from "@/app/api/public.js";
import { bookingCancelledPageStyles as s } from "@/app/assets/dummyStyles.jsx";

function CancelledContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("booking_id");
  const slug = searchParams.get("slug");

  useEffect(() => {
    if (bookingId) {
      cancelPublicBookingPayments(bookingId).catch(() => { });
    }
  }, [bookingId]);

  return (
    <div className={s.container}>
      <main className={s.card}>
        <div className={s.iconCircle}>
          <XCircle className={s.icon} />
        </div>

        <p className={s.statusLabel}>Payment cancelled</p>

        <p className={s.heading}>
          Your booking was not confirmed
        </p>

        <p className={s.description}>
          No payment was completed. You can return to the booking
          page and choose a slot again.
        </p>

        <Link
          href={slug ? `/book/${slug}` : "/"}
          className={s.homeLink}
        >
          <ArrowLeft className={s.homeLinkIcon} />
          Back to Booking Page
        </Link>
      </main>
    </div>
  );
}

export default function BookingCancelledPage() {
  return (
    <Suspense
      fallback={
        <div className={s.container}>
          <main className={s.card}>
            <p className={s.description}>
              Loading booking information...
            </p>
          </main>
        </div>
      }
    >
      <CancelledContent />
    </Suspense>
  );
}
