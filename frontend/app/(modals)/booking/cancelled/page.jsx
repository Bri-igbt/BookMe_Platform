'use client'

import { useEffect } from "react"
import { useSearchParams } from "next/navigation";
import Link from "next/link.js";
import { cancelPublicBookingPayments } from "@/app/api/public.js";
import { XCircle, ArrowLeft } from "lucide-react";
import { bookingCancelledPageStyles as s } from "@/app/assets/dummyStyles.jsx";

const page = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const bookingId = searchParams.get("booking_id");
    if (bookingId) {
      cancelPublicBookingPayments(bookingId).catch(() => {});
    };
  }, [searchParams]);

  return (
    <div className={s.container}>
      <main className={s.card}>
        <div className={s.iconCircle}>
          <XCircle className={s.icon} />
        </div>

        <p className={s.statusLabel}>Payment cancelled</p>
        <p className={s.heading}>
          Your booking was not confimed
        </p>
        <p className={s.description}>
          No payment was completed. You can return to the booking page and choose a slot again.
        </p>

        <Link 
          href={searchParams.get('slug') ? `/book/${searchParams.get('slug')}` : "" } 
          className={s.homeLink}
        >
          <ArrowLeft className={s.homeLinkIcon} />
          Back to Booking Page
        </Link>
      </main>
    </div>
  )
}

export default page;