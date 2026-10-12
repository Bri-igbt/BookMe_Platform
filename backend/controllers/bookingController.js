// import Booking from "../models/Booking.js";
// import Service from "../models/Service.js";
// import User from "../models/User.js";
// import { buildCustomerCalendarUrl } from "../utils/calendarLink.js";
// import {
//   cancelBookingCalendarEvent,
//   updateBookingCalendarEvent,
// } from "../utils/googleCalendar.js";
// import { sendBookingNotification } from "../utils/bookingNotifications.js";
// import { timesOverlap } from "../utils/overlap.js";

// /**
//  * Retrieves a list of bookings for the authenticated user based on query parameters.
//  * Filters can include booking status and date.
//  * Populates service details and appends a customer Google Calendar URL if available.
//  *
//  * @param {Object} req - Express request object containing user ID and query parameters.
//  * @param {Object} res - Express response object.
//  */
// export const listBookings = async (req, res) => {
//   try {
//     const query = { userId: req.user.id };

//     if (req.query.status) {
//       if (req.query.status === "rescheduled") {
//         query.isRescheduled = true;
//       } else {
//         query.status = req.query.status;
//       }
//     }
//     if (!req.query.status || req.query.status === "rescheduled") {
//       query.status = { $nin: ["pending_payment", "payment_failed"] };
//     }
//     if (req.query.date) query.date = req.query.date;

//     const [bookings, business] = await Promise.all([
//       Booking.find(query)
//         .populate("serviceId", "name duration price")
//         .sort({ createdAt: -1 })
//         .lean(),
//       User.findById(req.user.id).select("name businessName").lean(),
//     ]);

//     const bookingsWithCalendarUrls = bookings.map((booking) => {
//       if (booking.customerCalendarUrl || !business || !booking.serviceId) {
//         return booking;
//       }

//       return {
//         ...booking,
//         customerCalendarUrl: buildCustomerCalendarUrl({
//           business,
//           service: booking.serviceId,
//           booking,
//         }),
//       };
//     });

//     res.json({ bookings: bookingsWithCalendarUrls });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// /**
//  * Updates the status of a specific booking (e.g., confirmed, cancelled).
//  * Handles sending email notifications to the customer about the status change.
//  * If the booking is cancelled, it also removes the event from Google Calendar.
//  *
//  * @param {Object} req - Express request object containing booking ID in params and new status in body.
//  * @param {Object} res - Express response object.
//  */
// export const updateBookingStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const allowed = [
//       "pending",
//       "pending_payment",
//       "confirmed",
//       "cancelled",
//       "payment_failed",
//     ];

//     if (!allowed.includes(status)) {
//       return res.status(400).json({ message: "Invalid booking status" });
//     }

//     const booking = await Booking.findOneAndUpdate(
//       { _id: req.params.id, userId: req.user.id },
//       { status },
//       { new: true }
//     ).populate("serviceId", "name duration price");

//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     const business = await User.findById(req.user.id);
//     if (business && status === "cancelled") {
//       try {
//         await cancelBookingCalendarEvent({ business, booking });
//       } catch (calendarError) {
//         console.error(
//           "Google Calendar cancellation failed:",
//           calendarError.message
//         );
//       }
//     }

//     let emailResult = null;
//     if (business && booking.serviceId) {
//       emailResult = { sent: "processing" };
//       sendBookingNotification({
//         business,
//         service: booking.serviceId,
//         booking,
//         type: status === "cancelled" ? "cancelled" : "status",
//       }).catch((emailError) =>
//         console.error("Booking status email failed:", emailError.message)
//       );
//     }

//     res.json({ message: "Booking updated", booking, email: emailResult });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// /**
//  * Reschedules an existing booking to a new date and time slot.
//  * Validates for conflicting bookings to prevent double-booking.
//  * Updates the existing Google Calendar event and sends a reschedule notification email.
//  *
//  * @param {Object} req - Express request object containing booking ID in params and new date/time in body.
//  * @param {Object} res - Express response object.
//  */
// export const rescheduleBooking = async (req, res) => {
//   try {
//     const { date, startTime, endTime } = req.body;

//     if (!date || !startTime || !endTime) {
//       return res
//         .status(400)
//         .json({ message: "Date, start time, and end time are required" });
//     }

//     const booking = await Booking.findOne({
//       _id: req.params.id,
//       userId: req.user.id,
//     });
//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     const conflictingBookings = await Booking.find({
//       _id: { $ne: booking._id },
//       userId: req.user.id,
//       date,
//       status: { $nin: ["cancelled", "payment_failed"] },
//     });

//     const hasConflict = conflictingBookings.some((candidate) =>
//       timesOverlap(startTime, endTime, candidate.startTime, candidate.endTime)
//     );

//     if (hasConflict) {
//       return res.status(409).json({ message: "That slot is already booked" });
//     }

//     booking.date = date;
//     booking.startTime = startTime;
//     booking.endTime = endTime;
//     booking.status =
//       booking.status === "cancelled" ? "confirmed" : booking.status;
//     booking.isRescheduled = true;
//     booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;

//     const [business, service] = await Promise.all([
//       User.findById(req.user.id),
//       Service.findById(booking.serviceId),
//     ]);

//     if (business && service) {
//       try {
//         const calendarResult = await updateBookingCalendarEvent({
//           business,
//           service,
//           booking,
//         });
//         booking.googleEventId =
//           calendarResult.googleEventId || booking.googleEventId || "";
//         booking.customerCalendarUrl =
//           calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
//       } catch (calendarError) {
//         console.error(
//           "Google Calendar reschedule failed:",
//           calendarError.message
//         );
//       }
//     }

//     await booking.save();

//     const populatedBooking = await Booking.findById(booking._id).populate(
//       "serviceId",
//       "name duration price"
//     );

//     let emailResult = null;
//     if (business && service) {
//       emailResult = { sent: "processing" };
//       sendBookingNotification({
//         business,
//         service,
//         booking: populatedBooking,
//         type: "rescheduled",
//       }).catch((emailError) =>
//         console.error("Booking reschedule email failed:", emailError.message)
//       );
//     }

//     res.json({
//       message: "Booking rescheduled",
//       booking: populatedBooking,
//       email: emailResult,
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };


import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { buildCustomerCalendarUrl } from "../utils/calendarLink.js";
import {
  cancelBookingCalendarEvent,
  updateBookingCalendarEvent,
} from "../utils/googleCalendar.js";
import { sendBookingNotification } from "../utils/bookingNotification.js";
import { isValidDate, isValidTime, timeToMinutes } from "../utils/time.js";

const ALL_STATUSES = [
  "pending",
  "pending_payment",
  "confirmed",
  "cancelled",
  "payment_failed",
];

const ACTIVE_STATUSES = ["pending", "pending_payment", "confirmed"];
const UNPAID_STATUSES = ["pending_payment", "payment_failed"];
const OWNER_SETTABLE_STATUSES = ["pending", "confirmed", "cancelled"];
const SETTLED_PAYMENT_STATUSES = ["paid", "not_required"];

const handleError = (res, error) => {
  if (error.name === "CastError") {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "That slot is already booked" });
  }

  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};

const hasConflict = async ({ booking, date, startTime, endTime }) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const others = await Booking.find({
    _id: { $ne: booking._id },
    userId: booking.userId,
    date,
    status: { $in: ACTIVE_STATUSES },
  })
    .select("startTime endTime")
    .lean();

  return others.some(
    (other) =>
      start < timeToMinutes(other.endTime) &&
      timeToMinutes(other.startTime) < end
  );
};

const loadBusiness = (userId) =>
  User.findById(userId).select("+googleRefreshToken");


export const listBookings = async (req, res) => {
  try {
    const { status, date } = req.query;

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        ![...ALL_STATUSES, "rescheduled"].includes(status))
    ) {
      return res.status(400).json({ message: "Invalid status filter" });
    }

    if (date !== undefined && !isValidDate(date)) {
      return res.status(400).json({ message: "Invalid date filter" });
    }

    const query = { userId: req.user.id };

    if (status === "rescheduled") {
      query.isRescheduled = true;
    } else if (status) {
      query.status = status;
    }

    if (!status || status === "rescheduled") {
      query.status = { $nin: UNPAID_STATUSES };
    }

    if (date) query.date = date;

    const [bookings, business] = await Promise.all([
      Booking.find(query)
        .populate("serviceId", "name duration price")
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(req.user.id).select("name businessName timeZone").lean(),
    ]);

    const bookingsWithCalendarUrls = bookings.map((booking) => {
      if (booking.customerCalendarUrl || !business || !booking.serviceId) {
        return booking;
      }

      return {
        ...booking,
        customerCalendarUrl: buildCustomerCalendarUrl({
          business,
          service: booking.serviceId,
          booking,
        }),
      };
    });

    res.json({ bookings: bookingsWithCalendarUrls });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!OWNER_SETTABLE_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).populate("serviceId", "name duration price");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === status) {
      return res.json({ message: "Booking updated", booking, email: null });
    }

    if (UNPAID_STATUSES.includes(booking.status) && status !== "cancelled") {
      return res.status(400).json({
        message:
          "This booking is waiting for payment and can only be cancelled",
      });
    }

    const reactivating =
      booking.status === "cancelled" && status !== "cancelled";

    if (reactivating) {
      if (!SETTLED_PAYMENT_STATUSES.includes(booking.paymentStatus)) {
        return res.status(400).json({
          message: "This booking was never paid, so it cannot be restored",
        });
      }

      const conflict = await hasConflict({
        booking,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
      });
      if (conflict) {
        return res.status(409).json({ message: "That slot is already booked" });
      }
    }

    // TODO: when a paid booking is cancelled, refund the customer and add a
    // wallet transaction that reverses the provider payout.
    booking.status = status;
    await booking.save();

    const business = await loadBusiness(req.user.id);

    if (business) {
      try {
        if (status === "cancelled") {
          await cancelBookingCalendarEvent({ business, booking });
        } else if (reactivating && booking.serviceId) {
          const calendarResult = await updateBookingCalendarEvent({
            business,
            service: booking.serviceId,
            booking,
          });
          booking.googleEventId =
            calendarResult.googleEventId || booking.googleEventId;
          booking.customerCalendarUrl =
            calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
          await booking.save();
        }
      } catch (calendarError) {
        console.error("Google Calendar sync failed:", calendarError.message);
      }
    }

    let emailResult = null;
    if (business && booking.serviceId) {
      emailResult = { sent: "processing" };
      sendBookingNotification({
        business,
        service: booking.serviceId,
        booking,
        type: status === "cancelled" ? "cancelled" : "status",
      }).catch((emailError) =>
        console.error("Booking status email failed:", emailError.message)
      );
    }

    res.json({ message: "Booking updated", booking, email: emailResult });
  } catch (error) {
    return handleError(res, error);
  }
};

export const rescheduleBooking = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Date, start time, and end time are required" });
    }

    if (
      !isValidDate(date) ||
      !isValidTime(startTime) ||
      !isValidTime(endTime)
    ) {
      return res.status(400).json({
        message: "Use the format YYYY-MM-DD for the date and HH:mm for times",
      });
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (UNPAID_STATUSES.includes(booking.status)) {
      return res.status(400).json({
        message: "Bookings that are waiting for payment cannot be rescheduled",
      });
    }

    if (
      booking.status === "cancelled" &&
      !SETTLED_PAYMENT_STATUSES.includes(booking.paymentStatus)
    ) {
      return res.status(400).json({
        message: "This booking was never paid, so it cannot be rescheduled",
      });
    }

    if (await hasConflict({ booking, date, startTime, endTime })) {
      return res.status(409).json({ message: "That slot is already booked" });
    }

    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.status =
      booking.status === "cancelled" ? "confirmed" : booking.status;
    booking.isRescheduled = true;
    booking.rescheduleCount = (booking.rescheduleCount || 0) + 1;
    // The new time needs its own reminder.
    booking.reminderSent = false;

    // Save first. If this fails (for example a duplicate slot), Google
    // Calendar has not been touched yet.
    await booking.save();

    const [business, service] = await Promise.all([
      loadBusiness(req.user.id),
      Service.findById(booking.serviceId),
    ]);

    if (business && service) {
      try {
        const calendarResult = await updateBookingCalendarEvent({
          business,
          service,
          booking,
        });

        const googleEventId =
          calendarResult.googleEventId || booking.googleEventId || "";
        const customerCalendarUrl =
          calendarResult.customerCalendarUrl || booking.customerCalendarUrl;

        if (
          googleEventId !== booking.googleEventId ||
          customerCalendarUrl !== booking.customerCalendarUrl
        ) {
          booking.googleEventId = googleEventId;
          booking.customerCalendarUrl = customerCalendarUrl;
          await booking.save();
        }
      } catch (calendarError) {
        console.error(
          "Google Calendar reschedule failed:",
          calendarError.message
        );
      }
    }

    const populatedBooking = await Booking.findById(booking._id).populate(
      "serviceId",
      "name duration price"
    );

    let emailResult = null;
    if (business && service) {
      emailResult = { sent: "processing" };
      sendBookingNotification({
        business,
        service,
        booking: populatedBooking,
        type: "rescheduled",
      }).catch((emailError) =>
        console.error("Booking reschedule email failed:", emailError.message)
      );
    }

    res.json({
      message: "Booking rescheduled",
      booking: populatedBooking,
      email: emailResult,
    });
  } catch (error) {
    return handleError(res, error);
  }
};