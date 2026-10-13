// import Booking from "../models/Booking.js";
// import Service from "../models/Service.js";
// import User from "../models/User.js";
// import { buildCustomerCalendarUrl } from "../utils/calendarLink.js";
// import { createBookingCalendarEvent } from "../utils/googleCalendar.js";
// import { sendBookingNotification } from "../utils/bookingNotification.js";
// import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
// import { generateSlots } from "../utils/slotGenerator.js";
// import { getStripe, toStripeAmount } from "../utils/stripe.js";
// import { calculatePlatformSplit } from "../utils/money.js";
// import { timesOverlap } from "../utils/overlap.js";
// import { createBookingPayoutTransaction } from "../utils/wallet.js";

// const getBusinessBySlug = async (slug) => {
//   return User.findOne({ slug }).select("-password");
// };

// const toPublicBusiness = (business) => ({
//   id: business._id,
//   name: business.name,
//   slug: business.slug,
//   businessName: business.businessName,
//   businessDescription: business.businessDescription,
//   brandTheme: business.brandTheme,
//   brandAccent: business.brandAccent,
//   timeZone: business.timeZone,
//   googleCalendarConnected: business.googleCalendarConnected,
// });

// const holdWindowStart = () => new Date(Date.now() - 30 * 60 * 1000);

// const findActiveSlotBookings = ({ userId, date }) => {
//   return Booking.find({
//     userId,
//     date,
//     $or: [
//       { status: "confirmed" },
//       {
//         status: "pending_payment",
//         createdAt: { $gte: holdWindowStart() },
//       },
//     ],
//   });
// };

// // GET PUBLIC BUSINESS
// export const getPublicBusiness = async (req, res) => {
//   try {
//     const business = await getBusinessBySlug(req.params.slug);

//     if (!business) {
//       return res.status(404).json({
//         message: "Business not found",
//       });
//     }

//     const services = await Service.find({
//       userId: business._id,
//       isActive: true,
//       isDeleted: { $ne: true },
//     }).sort({ name: "" });

//     res.json({
//       business: toPublicBusiness(business),
//       services,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// // GET PUBLIC SLOTS
// export const getPublicSlots = async (req, res) => {
//   try {
//     const { date, serviceId } = req.query;

//     if (!date || !serviceId) {
//       return res.status(400).json({
//         message: "Date and service are required",
//       });
//     }

//     const business = await getBusinessBySlug(req.params.slug);
//     if (!business) {
//       return res.status(500).json({
//         message: "Business not found",
//       });
//     }

//     const service = await Service.findOne({
//       _id: serviceId,
//       userId: business._id,
//       isActive: true,
//       isDeleted: { $ne: true },
//     });

//     if (!service) {
//       return res.status(500).json({
//         message: "Service not found",
//       });
//     }

//     const slots = await generateSlots({
//       userId: business._id,
//       service,
//       date,
//     });

//     res.json({ slots });
//   } catch (error) {
//     return res.status(500).json({
//       message: "Server error",
//       error: error.message,
//     });
//   }
// };

// // REQUEST PUBLIC BOOKING OTP
// export const requestPublicBookingOtp = async (req, res) => {
//     try {
//         const { customerEmail } = req.body;
//         const normalizedEmail = customerEmail?.toLowerCase().trim();

//         if (!normalizedEmail) {
//             return res.status(500).json({
//               message: "Customer email is required",
//             });
//         };

//         const business = await getBusinessBySlug(req.params.slug);
//         if (!business) {
//             return res.status(500).json({
//               message: "Business not found",
//             });
//         };

//         const result = await requestEmailOtp({
//             email: normalizedEmail,
//             purpose: 'booking',
//         });

//         res.json({
//             message: 'Verification code sent',
//             result,
//         });
        
//     } catch (error) {
//         return res.status(500).json({
//           message: "Server error",
//           error: error.message,
//         });
//     }
// };

// // VERIFY PUBLIC BOOKING OTP
// export const verifyPublicBookingOtp = async (req, res) => {
//   try {
//     const { customerEmail, emailOtp } = req.body;

//     if (!customerEmail || !emailOtp) {
//       return res.status(400).json({ message: "Email and OTP are required" });
//     }

//     const otpResult = await verifyEmailOtp({
//       email: customerEmail,
//       purpose: "booking",
//       code: emailOtp,
//       consume: false,
//     });

//     if (!otpResult.verified) {
//       return res
//         .status(400)
//         .json({ message: otpResult.reason || "Invalid OTP" });
//     }

//     res.json({ message: "OTP verified" });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // CREATE PUBLIC BOOKING
// export const createPublicBooking = async (req, res) => {
//   try {
//     const {
//       serviceId,
//       customerName,
//       customerEmail,
//       customerAvatar,
//       date,
//       startTime,
//       endTime,
//       notes,
//       emailOtp,
//     } = req.body;

//     if (
//       !serviceId ||
//       !customerName ||
//       !customerEmail ||
//       !date ||
//       !startTime ||
//       !endTime
//     ) {
//       return res
//         .status(400)
//         .json({ message: "All booking fields are required" });
//     }

//     const normalizedCustomerEmail = customerEmail.toLowerCase().trim();

//     const business = await getBusinessBySlug(req.params.slug);
//     if (!business) {
//       return res.status(404).json({ message: "Business not found" });
//     }

//     const service = await Service.findOne({
//       _id: serviceId,
//       userId: business._id,
//       isActive: true,
//       isDeleted: { $ne: true },
//     });
//     if (!service) {
//       return res.status(404).json({ message: "Service not found" });
//     }

//     const bookings = await findActiveSlotBookings({
//       userId: business._id,
//       date,
//     });

//     const hasConflict = bookings.some((booking) =>
//       timesOverlap(startTime, endTime, booking.startTime, booking.endTime)
//     );

//     if (hasConflict) {
//       return res
//         .status(409)
//         .json({ message: "That slot is no longer available" });
//     }

//     const otpResult = await verifyEmailOtp({
//       email: normalizedCustomerEmail,
//       purpose: "booking",
//       code: emailOtp,
//       consume: true,
//     });

//     if (!otpResult.verified) {
//       return res
//         .status(400)
//         .json({
//           message: otpResult.reason || "Email verification is required",
//         });
//     }

//     const amount = toStripeAmount(service.price);
//     const { platformFeeAmount, providerPayoutAmount } =
//       calculatePlatformSplit(amount);
//     const currency = "ngn";
//     const stripe = amount > 0 ? getStripe() : null;

//     if (amount > 0 && !stripe) {
//       return res
//         .status(503)
//         .json({ message: "Stripe payments are not configured yet" });
//     }

//     const customerCalendarUrl = buildCustomerCalendarUrl({
//       business,
//       service,
//       booking: {
//         date,
//         startTime,
//         endTime,
//         customerName,
//         customerEmail: normalizedCustomerEmail,
//         notes,
//       },
//     });

//     const booking = await Booking.create({
//       userId: business._id,
//       serviceId,
//       customerName,
//       customerEmail: normalizedCustomerEmail,
//       customerAvatar: customerAvatar || "A1.png",
//       date,
//       startTime,
//       endTime,
//       notes: notes || "",
//       amount,
//       platformFeeAmount,
//       providerPayoutAmount,
//       payoutStatus: amount > 0 ? "pending" : "not_required",
//       currency,
//       paymentStatus: amount > 0 ? "pending" : "not_required",
//       status: amount > 0 ? "pending_payment" : "confirmed",
//       customerCalendarUrl,
//     });

//     if (amount === 0) {
//       try {
//         const calendarResult = await createBookingCalendarEvent({
//           business,
//           service,
//           booking,
//         });
//         booking.googleEventId = calendarResult.googleEventId || "";
//         booking.customerCalendarUrl = calendarResult.customerCalendarUrl;
//         await booking.save();
//       } catch (calendarError) {
//         booking.customerCalendarUrl = customerCalendarUrl;
//         await booking.save();
//       }

//       let emailResult = { sent: "processing" };
//       sendBookingNotification({
//         business,
//         service,
//         booking,
//         type: "confirmed",
//       }).catch((emailError) =>
//         console.error("Booking confirmation email failed:", emailError.message)
//       );

//       return res.status(201).json({
//         message: "Booking confirmed",
//         booking,
//         customerCalendarUrl: booking.customerCalendarUrl,
//         email: emailResult,
//       });
//     }

//     const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
//     const session = await stripe.checkout.sessions.create({
//       mode: "payment",
//       payment_method_types: ["card"],
//       customer_email: normalizedCustomerEmail,
//       line_items: [
//         {
//           quantity: 1,
//           price_data: {
//             currency,
//             unit_amount: amount,
//             product_data: {
//               name: service.name,
//               description: `${date} ${startTime}-${endTime}`,
//             },
//           },
//         },
//       ],
//       metadata: {
//         bookingId: String(booking._id),
//       },
//       success_url: `${clientUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&slug=${business.slug}`,
//       cancel_url: `${clientUrl}/booking/cancelled?booking_id=${booking._id}&slug=${business.slug}`,
//     });

//     booking.stripeSessionId = session.id;
//     await booking.save();

//     res.status(201).json({
//       message: "Continue to payment",
//       bookingId: booking._id,
//       checkoutUrl: session.url,
//     });
//   } catch (error) {
//     const errorMsg = error.type?.includes("Stripe")
//       ? error.raw?.message || error.message
//       : "Server error: " + error.message;
//     res
//       .status(error.statusCode || 500)
//       .json({ message: errorMsg, error: error.message });
//   }
// };

// const confirmPaidBooking = async ({ booking, business, service, session }) => {
//   if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
//     return booking;
//   }

//   const conflictingBookings = await Booking.find({
//     _id: { $ne: booking._id },
//     userId: booking.userId,
//     date: booking.date,
//     status: "confirmed",
//   });

//   const hasConflict = conflictingBookings.some((candidate) =>
//     timesOverlap(
//       booking.startTime,
//       booking.endTime,
//       candidate.startTime,
//       candidate.endTime
//     )
//   );

//   if (hasConflict) {
//     booking.status = "payment_failed";
//     booking.paymentStatus = "failed";
//     await booking.save();
//     throw new Error(
//       "This slot is no longer available. No booking was created."
//     );
//   }

//   booking.status = "confirmed";
//   booking.paymentStatus = "paid";
//   booking.payoutStatus =
//     booking.providerPayoutAmount > 0 ? "available" : "not_required";

//   try {
//     const calendarResult = await createBookingCalendarEvent({
//       business,
//       service,
//       booking,
//     });
//     booking.googleEventId = calendarResult.googleEventId || "";
//     booking.customerCalendarUrl =
//       calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
//   } catch (calendarError) {
//     console.error(
//       "Google Calendar confirmation failed:",
//       calendarError.message
//     );
//   }

//   await booking.save();
//   await createBookingPayoutTransaction({
//     booking,
//     description: `Booking payment from ${booking.customerName || "Customer"}`,
//   });

//   sendBookingNotification({
//     business,
//     service,
//     booking,
//     type: "confirmed",
//   }).catch((emailError) =>
//     console.error("Booking confirmation email failed:", emailError.message)
//   );

//   return booking;
// };

// // GET BOOKING STATUS
// export const getBookingStatus = async (req, res) => {
//   try {
//     const { session_id: sessionId, booking_id: bookingId } = req.query;
//     const query = sessionId
//       ? { stripeSessionId: sessionId }
//       : { _id: bookingId };

//     if (!sessionId && !bookingId) {
//       return res
//         .status(400)
//         .json({ message: "Booking identifier is required" });
//     }

//     let booking = await Booking.findOne(query).populate(
//       "serviceId",
//       "name duration price"
//     );
//     if (!booking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     if (sessionId && booking.status === "pending_payment") {
//       const stripe = getStripe();
//       if (!stripe) {
//         return res
//           .status(503)
//           .json({ message: "Stripe payments are not configured yet" });
//       }

//       const session = await stripe.checkout.sessions.retrieve(sessionId);
//       if (session.payment_status !== "paid") {
//         booking.status = "payment_failed";
//         booking.paymentStatus = "failed";
//         await booking.save();
//         return res
//           .status(402)
//           .json({
//             message: "Payment was not successful. No booking was created.",
//             booking,
//           });
//       }

//       const [business, service] = await Promise.all([
//         User.findById(booking.userId),
//         Service.findById(booking.serviceId),
//       ]);

//       if (!business || !service) {
//         return res
//           .status(404)
//           .json({ message: "Booking business or service was not found" });
//       }

//       await confirmPaidBooking({ booking, business, service, session });
//       booking = await Booking.findById(booking._id).populate(
//         "serviceId",
//         "name duration price"
//       );
//     }

//     res.json({ booking });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // CANCEL PUBLIC BOOKING PAYMENT
// export const cancelPublicBookingPayment = async (req, res) => {
//   try {
//     const { booking_id: bookingId } = req.body;

//     if (!bookingId) {
//       return res
//         .status(400)
//         .json({ message: "Booking identifier is required" });
//     }

//     const booking = await Booking.findOne({
//       _id: bookingId,
//       status: "pending_payment",
//     });
//     if (!booking) {
//       return res.json({ message: "No pending booking to cancel" });
//     }

//     booking.status = "payment_failed";
//     booking.paymentStatus = "failed";
//     await booking.save();

//     res.json({ message: "Payment was not completed. No booking was created." });
//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";
import { buildCustomerCalendarUrl } from "../utils/calendarLink.js";
import { createBookingCalendarEvent } from "../utils/googleCalendar.js";
import { sendBookingNotification } from "../utils/bookingNotification.js";
import { requestEmailOtp, verifyEmailOtp } from "../utils/emailOtp.js";
import { generateSlots } from "../utils/slotGenerator.js";
import { getStripe, toStripeAmount } from "../utils/stripe.js";
import { calculatePlatformSplit } from "../utils/money.js";
import { timesOverlap } from "../utils/overlap.js";
import { createBookingPayoutTransaction } from "../utils/wallet.js";
import { isValidDate, isValidTimeRange } from "../utils/time.js";

const isObjectId = (value) =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

const getBusinessBySlug = async (slug) => {
  return User.findOne({ slug }).select("+googleRefreshToken");
};

const toPublicBusiness = (business) => ({
  id: business._id,
  name: business.name,
  slug: business.slug,
  businessName: business.businessName,
  businessDescription: business.businessDescription,
  brandTheme: business.brandTheme,
  brandAccent: business.brandAccent,
  timeZone: business.timeZone,
  googleCalendarConnected: business.googleCalendarConnected,
});

const toPublicBooking = (booking) => {
  const {
    platformFeeAmount,
    providerPayoutAmount,
    payoutStatus,
    googleEventId,
    customerEmail,
    notes,
    ...safeBooking
  } = booking.toObject ? booking.toObject() : booking;

  return safeBooking;
};

const holdWindowStart = () => new Date(Date.now() - 30 * 60 * 1000);

const findActiveSlotBookings = ({ userId, date }) => {
  return Booking.find({
    userId,
    date,
    $or: [
      { status: "confirmed" },
      {
        status: "pending_payment",
        createdAt: { $gte: holdWindowStart() },
      },
    ],
  });
};

// GET PUBLIC BUSINESS
export const getPublicBusiness = async (req, res) => {
  try {
    const business = await getBusinessBySlug(req.params.slug);

    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const services = await Service.find({
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    }).sort({ name: 1 }); 

    res.json({
      business: toPublicBusiness(business),
      services,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// GET PUBLIC SLOTS
export const getPublicSlots = async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    if (!isValidDate(date) || !isObjectId(serviceId)) {
      return res.status(400).json({
        message: "Date and service are required",
      });
    }

    const business = await getBusinessBySlug(req.params.slug);
    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });

    if (!service) {
      return res.status(404).json({
        message: "Service not found",
      });
    }

    const slots = await generateSlots({
      userId: business._id,
      service,
      date,
      timeZone: business.timeZone,
    });

    res.json({ slots });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// REQUEST PUBLIC BOOKING OTP
export const requestPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail } = req.body;
    const normalizedEmail =
      typeof customerEmail === "string"
        ? customerEmail.toLowerCase().trim()
        : "";

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Customer email is required",
      });
    }

    const business = await getBusinessBySlug(req.params.slug);
    if (!business) {
      return res.status(404).json({
        message: "Business not found",
      });
    }

    const result = await requestEmailOtp({
      email: normalizedEmail,
      purpose: "booking",
    });

    res.json({
      message: "Verification code sent",
      result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error",
      error: error.message,
    });
  }
};

// VERIFY PUBLIC BOOKING OTP
export const verifyPublicBookingOtp = async (req, res) => {
  try {
    const { customerEmail, emailOtp } = req.body;

    if (!customerEmail || !emailOtp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpResult = await verifyEmailOtp({
      email: customerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: false,
    });

    if (!otpResult.verified) {
      return res
        .status(400)
        .json({ message: otpResult.reason || "Invalid OTP" });
    }

    res.json({ message: "OTP verified" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// CREATE PUBLIC BOOKING
export const createPublicBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerName,
      customerEmail,
      customerAvatar,
      date,
      startTime,
      endTime,
      notes,
      emailOtp,
    } = req.body;

    if (
      !isObjectId(serviceId) ||
      typeof customerName !== "string" ||
      !customerName.trim() ||
      typeof customerEmail !== "string" ||
      !customerEmail.trim() ||
      !date ||
      !startTime ||
      !endTime
    ) {
      return res
        .status(400)
        .json({ message: "All booking fields are required" });
    }

    if (!isValidDate(date) || !isValidTimeRange(startTime, endTime)) {
      return res.status(400).json({
        message:
          "Use YYYY-MM-DD for the date and HH:mm for the times (the end must be after the start)",
      });
    }

    const normalizedCustomerEmail = customerEmail.toLowerCase().trim();

    const business = await getBusinessBySlug(req.params.slug);
    if (!business) {
      return res.status(404).json({ message: "Business not found" });
    }

    const service = await Service.findOne({
      _id: serviceId,
      userId: business._id,
      isActive: true,
      isDeleted: { $ne: true },
    });
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    const offeredSlots = await generateSlots({
      userId: business._id,
      service,
      date,
      timeZone: business.timeZone,
    });
    const slotOffered = offeredSlots.some(
      (slot) => slot.startTime === startTime && slot.endTime === endTime
    );
    if (!slotOffered) {
      return res
        .status(409)
        .json({ message: "That slot is no longer available" });
    }

    const bookings = await findActiveSlotBookings({
      userId: business._id,
      date,
    });

    const hasConflict = bookings.some((booking) =>
      timesOverlap(startTime, endTime, booking.startTime, booking.endTime)
    );

    if (hasConflict) {
      return res
        .status(409)
        .json({ message: "That slot is no longer available" });
    }

    const amount = toStripeAmount(service.price);
    const { platformFeeAmount, providerPayoutAmount } =
      calculatePlatformSplit(amount);
    const currency = "ngn";
    const stripe = amount > 0 ? getStripe() : null;

    if (amount > 0 && !stripe) {
      return res
        .status(503)
        .json({ message: "Stripe payments are not configured yet" });
    }

    const otpResult = await verifyEmailOtp({
      email: normalizedCustomerEmail,
      purpose: "booking",
      code: emailOtp,
      consume: true,
    });

    if (!otpResult.verified) {
      return res.status(400).json({
        message: otpResult.reason || "Email verification is required",
      });
    }

    const customerCalendarUrl = buildCustomerCalendarUrl({
      business,
      service,
      booking: {
        date,
        startTime,
        endTime,
        customerName,
        customerEmail: normalizedCustomerEmail,
        notes,
      },
    });

    const booking = await Booking.create({
      userId: business._id,
      serviceId,
      customerName,
      customerEmail: normalizedCustomerEmail,
      customerAvatar: customerAvatar || "A1.png",
      date,
      startTime,
      endTime,
      notes: notes || "",
      amount,
      platformFeeAmount,
      providerPayoutAmount,
      payoutStatus: amount > 0 ? "pending" : "not_required",
      currency,
      paymentStatus: amount > 0 ? "pending" : "not_required",
      status: amount > 0 ? "pending_payment" : "confirmed",
      customerCalendarUrl,
    });

    if (amount === 0) {
      try {
        const calendarResult = await createBookingCalendarEvent({
          business,
          service,
          booking,
        });
        booking.googleEventId = calendarResult.googleEventId || "";
        booking.customerCalendarUrl = calendarResult.customerCalendarUrl;
        await booking.save();
      } catch (calendarError) {
        booking.customerCalendarUrl = customerCalendarUrl;
        await booking.save();
      }

      let emailResult = { sent: "processing" };
      sendBookingNotification({
        business,
        service,
        booking,
        type: "confirmed",
      }).catch((emailError) =>
        console.error("Booking confirmation email failed:", emailError.message)
      );

      return res.status(201).json({
        message: "Booking confirmed",
        booking: toPublicBooking(booking), 
        customerCalendarUrl: booking.customerCalendarUrl,
        email: emailResult,
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: normalizedCustomerEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: service.name,
                description: `${date} ${startTime}-${endTime}`,
              },
            },
          },
        ],
        metadata: {
          bookingId: String(booking._id),
        },
        success_url: `${clientUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&slug=${business.slug}`,
        cancel_url: `${clientUrl}/booking/cancelled?booking_id=${booking._id}&slug=${business.slug}`,
      });
    } catch (stripeError) {
      booking.status = "payment_failed";
      booking.paymentStatus = "failed";
      await booking.save();
      throw stripeError;
    }

    booking.stripeSessionId = session.id;
    await booking.save();

    res.status(201).json({
      message: "Continue to payment",
      bookingId: booking._id,
      checkoutUrl: session.url,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "That slot is no longer available" });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    const isStripeError = error.type?.includes("Stripe");
    res.status(isStripeError ? 502 : error.statusCode || 500).json({
      message: isStripeError
        ? "Payment provider error. Please try again."
        : "Server error",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const confirmPaidBooking = async ({ booking, business, service, session }) => {
  if (booking.status === "confirmed" && booking.paymentStatus === "paid") {
    return booking;
  }

  const conflictingBookings = await Booking.find({
    _id: { $ne: booking._id },
    userId: booking.userId,
    date: booking.date,
    status: "confirmed",
  });

  const hasConflict = conflictingBookings.some((candidate) =>
    timesOverlap(
      booking.startTime,
      booking.endTime,
      candidate.startTime,
      candidate.endTime
    )
  );

  if (hasConflict) {
    booking.status = "payment_failed";
    booking.paymentStatus = "failed";
    await booking.save();

    try {
      await getStripe().refunds.create({
        payment_intent: session.payment_intent,
      });
    } catch (refundError) {
      console.error(
        `MANUAL REFUND NEEDED for Stripe session ${session.id}:`,
        refundError.message
      );
    }

    throw Object.assign(
      new Error("This slot is no longer available. No booking was created."),
      { statusCode: 409 }
    );
  }

  booking.status = "confirmed";
  booking.paymentStatus = "paid";
  booking.payoutStatus =
    booking.providerPayoutAmount > 0 ? "available" : "not_required";

  try {
    const calendarResult = await createBookingCalendarEvent({
      business,
      service,
      booking,
    });
    booking.googleEventId = calendarResult.googleEventId || "";
    booking.customerCalendarUrl =
      calendarResult.customerCalendarUrl || booking.customerCalendarUrl;
  } catch (calendarError) {
    console.error(
      "Google Calendar confirmation failed:",
      calendarError.message
    );
  }

  await booking.save();
  await createBookingPayoutTransaction({
    booking,
    description: `Booking payment from ${booking.customerName || "Customer"}`,
  });

  sendBookingNotification({
    business,
    service,
    booking,
    type: "confirmed",
  }).catch((emailError) =>
    console.error("Booking confirmation email failed:", emailError.message)
  );

  return booking;
};

// GET BOOKING STATUS
export const getBookingStatus = async (req, res) => {
  try {
    const { session_id: sessionId, booking_id: bookingId } = req.query;

    if (sessionId !== undefined && typeof sessionId !== "string") {
      return res.status(400).json({ message: "Invalid session identifier" });
    }
    if (bookingId !== undefined && !isObjectId(bookingId)) {
      return res.status(400).json({ message: "Invalid booking identifier" });
    }

    const query = sessionId
      ? { stripeSessionId: sessionId }
      : { _id: bookingId };

    if (!sessionId && !bookingId) {
      return res
        .status(400)
        .json({ message: "Booking identifier is required" });
    }

    let booking = await Booking.findOne(query).populate(
      "serviceId",
      "name duration price"
    );
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (sessionId && booking.status === "pending_payment") {
      const stripe = getStripe();
      if (!stripe) {
        return res
          .status(503)
          .json({ message: "Stripe payments are not configured yet" });
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        if (session.status !== "expired") {
          return res.json({ booking: toPublicBooking(booking) });
        }

        booking.status = "payment_failed";
        booking.paymentStatus = "failed";
        await booking.save();
        return res.status(402).json({
          message: "Payment was not successful. No booking was created.",
          booking: toPublicBooking(booking),
        });
      }

      const [business, service] = await Promise.all([
        User.findById(booking.userId).select("+googleRefreshToken"),
        Service.findById(booking.serviceId),
      ]);

      if (!business || !service) {
        return res
          .status(404)
          .json({ message: "Booking business or service was not found" });
      }

      await confirmPaidBooking({ booking, business, service, session });
      booking = await Booking.findById(booking._id).populate(
        "serviceId",
        "name duration price"
      );
    }

    res.json({ booking: toPublicBooking(booking) }); 
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Server error",
      error: error.message,
    });
  }
};

// CANCEL PUBLIC BOOKING PAYMENT
export const cancelPublicBookingPayment = async (req, res) => {
  try {
    const { booking_id: bookingId } = req.body;
    if (!isObjectId(bookingId)) {
      return res
        .status(400)
        .json({ message: "Booking identifier is required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      status: "pending_payment",
    });
    if (!booking) {
      return res.json({ message: "No pending booking to cancel" });
    }

    booking.status = "payment_failed";
    booking.paymentStatus = "failed";
    await booking.save();

    res.json({ message: "Payment was not completed. No booking was created." });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};