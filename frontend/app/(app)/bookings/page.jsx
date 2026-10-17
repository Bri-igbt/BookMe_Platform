'use client'

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import p7Image from '@/app/assets/P7.png';
import {
  listBookings,
  rescheduleBookings,
  updateBookingsStatus,
} from '@/app/api/bookings.js';
import {
  CalendarDays,
  Clock,
  XCircle,
  CreditCard,
  ExternalLink,
  Filter,
  Calendar,
  Info,
  RefreshCcw,
  Check
} from 'lucide-react';
import A1 from '@/app/assets/avatars/A1.png';
import A2 from '@/app/assets/avatars/A2.png';
import A3 from '@/app/assets/avatars/A3.png';
import A4 from '@/app/assets/avatars/A4.png';
import A5 from '@/app/assets/avatars/A5.png';
import A6 from '@/app/assets/avatars/A6.png';
import A7 from '@/app/assets/avatars/A7.png';
import A8 from '@/app/assets/avatars/A8.png';
import A9 from '@/app/assets/avatars/A9.png';
import A10 from '@/app/assets/avatars/A10.png';
import A11 from '@/app/assets/avatars/A11.png';
import A12 from '@/app/assets/avatars/A12.png';
import A13 from '@/app/assets/avatars/A13.png';
import A15 from '@/app/assets/avatars/A15.png';
import A16 from '@/app/assets/avatars/A16.png';
import { bookingsPageStyles as s } from "@/app/assets/dummyStyles.jsx";

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

const statuses = [
  "",
  "pending",
  "confirmed",
  "rescheduled",
  "cancelled"
];

const formatStatus = (value) => (value ? value.replace(/_/g, " ") : "");

const page = () => {
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState({ date: "", status: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState(null);
  const [draft, setDraft] = useState({ date: "", startTime: "", endTime: "" });
  const [rescheduleError, setRescheduleError] = useState("");
  const latestRequest = useRef(0);

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  const formatTimestamp = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return new Intl.DateTimeFormat("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const fetchBookings = useCallback(async () => {
    const requestId = ++latestRequest.current;

    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;

      const { data } = await listBookings(params);

      if (requestId === latestRequest.current) {
        setBookings(data.bookings || []);
        setLoaded(true);
      }
    } catch (error) {
      if (requestId === latestRequest.current) {
        showMessage(
          error.response?.data?.message || "Could not load bookings",
          "error",
        );
        setLoaded(true);
      }
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const changeStatus = async (booking, status) => {
    setActionLoading(true);

    try {
      await updateBookingsStatus(booking._id, status);
      showMessage(
        status === "cancelled"
          ? "Booking cancelled. The customer is being notified."
          : "Booking updated.",
        "success",
      );
      await fetchBookings();
    } catch (error) {
      showMessage(
        error.response?.data?.message || "Could not update booking",
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openReschedule = (booking) => {
    setDraft({
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
    setRescheduleError("");
    setRescheduleModalBooking(booking);
  };

  const closeReschedule = () => {
    setRescheduleModalBooking(null);
    setRescheduleError("");
  };

  const submitReschedule = async () => {
    if (!rescheduleModalBooking) return;

    if (!draft.date || !draft.startTime || !draft.endTime) {
      setRescheduleError("Choose a date, a start time and an end time");
      return;
    }

    if (draft.endTime <= draft.startTime) {
      setRescheduleError("End time must be after the start time");
      return;
    }

    setActionLoading(true);
    setRescheduleError("");

    try {
      await rescheduleBookings(rescheduleModalBooking._id, draft);
      showMessage(
        "Booking rescheduled. The customer is being notified and your calendar is updated.",
        "success",
      );
      closeReschedule();
      await fetchBookings();
    } catch (error) {
      setRescheduleError(
        error.response?.data?.message || "Could not reschedule booking",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const getBannerVariant = () =>
    messageType === "success" ? s.messageBannerSuccess : s.messageBannerInfo;

  return (
    <div>
      <section className={s.headerSection}>
        <div className={s.headerLeftArea}>
          <div>
            <p className={s.bookingLabel}>
              Bookings
            </p>

            <h1 className={s.mainHeading}>
              Manage customer {" "}
              <span className={s.mainHeadingGradient}>appointments</span>
            </h1>

            <p className={s.subText}>
              Review payments, calendar sync and appointment status from one calm workspace.
            </p>
          </div>

          <div className={s.illustrationContainer}>
            <Image
              src={p7Image}
              className={s.illustrationImg}
              alt="Bookings illustration"
            />
          </div>
        </div>

        <div className={s.filterRow}>
          <div className={s.filterDateContainer}>
            <CalendarDays className={s.filterIcon} />
            <input
              type="date"
              aria-label="Filter by date"
              value={filters.date}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, date: event.target.value }))
              }
              className={s.filterDateInput}
              placeholder="Select Date"
            />
          </div>

          <div className={s.filterStatusContainer}>
            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className={s.filterStatusSelect}
            >
              {statuses.map((status) => (
                <option value={status} key={status}>
                  {status ? formatStatus(status) : "All Statuses"}
                </option>
              ))}
            </select>
            <Filter className={s.filterSelectIcon} />
          </div>
        </div>
      </section>

      {message && (
        <div
          role={messageType === "error" ? "alert" : "status"}
          className={`${s.messageBanner} ${getBannerVariant()}`}
        >
          <Info className='w-4 h-4' />
          {message}
        </div>
      )}

      <section className={s.bookingListSection}>
        {!loaded && (
          <div className={s.emptyStateContainer}>
            <p className={s.emptyStateText}>Loading bookings...</p>
          </div>
        )}

        {loaded && bookings.length === 0 && (
          <div className={s.emptyStateContainer}>
            <CalendarDays className={s.emptyStateIcon} />
            <p className={s.emptyStateText}>No bookings match these filters.</p>
          </div>
        )}

        {bookings.map((booking) => (
          <article key={booking._id} className={s.cardContainer}>
            <div className={s.cardInnerLayout}>
              <div className={s.cardLeftBlock}>
                <div className={s.badgesContainer}>
                  <span
                    className={`${s.statusBadgeBase} ${s.statusBadgeClassMap[booking.status] || s.statusBadgeClassMap.default}`}
                  >
                    <Check className={s.badgeIcon} />
                    {formatStatus(booking.status)}
                  </span>
                  <span
                    className={`${s.paymentBadgeBase} ${s.paymentBadgeClassMap[booking.paymentStatus] || s.paymentBadgeClassMap.default}`}
                  >
                    <CreditCard className={s.badgeIcon} />
                    Payment:{" "}
                    {formatStatus(booking.paymentStatus) || "Not Required"}
                  </span>
                  {booking.rescheduleCount > 0 && (
                    <span
                      className={`${s.paymentBadgeBase} bg-orange-100 text-orange-700 ml-2`}
                    >
                      <RefreshCcw className={s.badgeIcon} />
                      Rescheduled ({booking.rescheduleCount})
                    </span>
                  )}
                </div>

                <div className={s.customerInfoRow}>
                  <div className={s.customerAvatarContainer}>
                    <Image
                      src={AVATAR_MAP[booking.customerAvatar] || A1}
                      alt={booking.customerName || "Customer"}
                      className={s.customerAvatarImg}
                    />
                  </div>
                  <div>
                    <h2 className={s.customerName}>{booking.customerName}</h2>
                    <p className={s.customerEmail}>{booking.customerEmail}</p>
                  </div>
                </div>

                <div className={s.bookingDetailsRow}>
                  <div className={s.bookingDetailsIconContainer}>
                    <CalendarDays className={s.bookingDetailsIcon} />
                  </div>
                  <div className={s.bookingDetailsTextContainer}>
                    <p className={s.bookingDateTimeText}>
                      {booking.date} • {booking.startTime} - {booking.endTime}
                    </p>
                    <div className={s.bookingServiceRow}>
                      <div className={s.bookingServiceDot}></div>
                      <p className={s.bookingServiceText}>
                        {booking.serviceId?.name || "Meeting"}
                        {booking.notes ? ` • ${booking.notes}` : ""}
                      </p>
                    </div>
                  </div>
                </div>

                <div className={s.timestampsContainer}>
                  <span className={s.timestampSpan}>
                    <Clock className={s.timestampIcon} />
                    Created: {formatTimestamp(booking.createdAt)}
                  </span>
                  <span className={s.timestampSpan}>
                    <RefreshCcw className={s.timestampIcon} />
                    Last updated: {formatTimestamp(booking.updatedAt)}
                  </span>
                </div>

                <div className={s.calendarSyncRow}>
                  <Calendar className={s.timestampIcon} />
                  Calendar:{" "}
                  {booking.googleEventId ? "Synced to Google" : "Not synced"}
                </div>

                {booking.customerCalendarUrl ? (
                  <a
                    href={booking.customerCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={s.calendarLinkButton}
                  >
                    Customer calendar link
                    <ExternalLink className={s.calendarLinkIcon} />
                  </a>
                ) : (
                  <span className={s.calendarLinkUnavailable}>
                    Calendar link unavailable
                    <ExternalLink className={s.calendarLinkIcon} />
                  </span>
                )}
              </div>

              <div className={s.cardRightBlock}>
                <div className={s.actionButtonsContainer}>
                  {booking.status !== "cancelled" &&
                    booking.status !== "payment_failed" && (
                      <>
                        <button
                          type="button"
                          onClick={() => openReschedule(booking)}
                          disabled={actionLoading}
                          className={s.rescheduleButton}
                        >
                          <CalendarDays className={s.actionIcon} />
                          Reschedule
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelModalBooking(booking)}
                          disabled={actionLoading}
                          className={s.cancelButton}
                        >
                          <XCircle className={s.actionIcon} />
                          Cancel
                        </button>
                      </>
                    )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {cancelModalBooking && (
        <div className={s.modalOverlay}>
          <div
            className={s.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
          >
            <div className={s.modalHeader}>
              <h2 id="cancel-booking-title" className={s.modalTitle}>
                Cancel Booking
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCancelModalBooking(null)}
                className={s.modalCloseBtn}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className={s.modalBody}>
              <p className={s.modalMessage}>
                Are you sure you want to cancel this booking? The customer
                will be notified.
              </p>
              {cancelModalBooking.paymentStatus === "paid" && (
                <p className="mt-3 text-sm font-medium text-amber-700">
                  This booking was paid online. Cancelling does not refund the
                  customer automatically, so arrange the refund separately.
                </p>
              )}
            </div>
            <div className={s.modalFooter}>
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className={s.modalButtonSecondary}
              >
                Keep Booking
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  const booking = cancelModalBooking;
                  setCancelModalBooking(null);
                  changeStatus(booking, "cancelled");
                }}
                className={s.modalButtonDanger}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleModalBooking && (
        <div className={s.modalOverlay}>
          <div
            className={s.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-booking-title"
          >
            <div className={s.modalHeader}>
              <h2 id="reschedule-booking-title" className={s.modalTitle}>
                Reschedule Booking
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={closeReschedule}
                className={s.modalCloseBtn}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className={s.modalBody}>
              <div className={s.rescheduleGrid}>
                <div className={s.rescheduleInputContainer}>
                  <CalendarDays className={s.rescheduleInputIcon} />
                  <input
                    type="date"
                    aria-label="New date"
                    value={draft.date}
                    onChange={(event) =>
                      setDraft((prev) => ({ ...prev, date: event.target.value }))
                    }
                    className={s.rescheduleInputField}
                  />
                </div>
                <div className={s.rescheduleInputContainer}>
                  <Clock className={s.rescheduleInputIcon} />
                  <input
                    type="time"
                    aria-label="New start time"
                    value={draft.startTime}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                    className={s.rescheduleInputField}
                  />
                </div>
                <div className={s.rescheduleInputContainer}>
                  <Clock className={s.rescheduleInputIcon} />
                  <input
                    type="time"
                    aria-label="New end time"
                    value={draft.endTime}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        endTime: event.target.value,
                      }))
                    }
                    className={s.rescheduleInputField}
                  />
                </div>
              </div>
              {rescheduleError && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-600">
                  {rescheduleError}
                </p>
              )}
            </div>
            <div className={s.modalFooter}>
              <button
                type="button"
                onClick={closeReschedule}
                className={s.modalButtonSecondary}
              >
                Discard
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={submitReschedule}
                className={s.modalButtonPrimary}
              >
                {actionLoading ? "Saving..." : "Confirm Reschedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default page