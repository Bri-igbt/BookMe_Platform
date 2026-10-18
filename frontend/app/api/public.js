import client from "./client.js";

export const getPublicBusiness = (slug) =>
  client.get(`/public/${encodeURIComponent(slug)}`);

export const getPublicSlots = (slug, params) =>
  client.get(`/public/${encodeURIComponent(slug)}/slots`, { params });

export const requestPublicBookingOtp = (slug, customerEmail) =>
  client.post(`/public/${encodeURIComponent(slug)}/request-otp`, {
    customerEmail,
  });

export const verifyPublicBookingOtp = (slug, data) =>
  client.post(`/public/${encodeURIComponent(slug)}/verify-otp`, data);

export const createPublicBooking = (slug, data) =>
  client.post(`/public/${encodeURIComponent(slug)}/book`, data);

export const getPublicBookingStatus = (params) =>
  client.get("/public/booking/status", { params });

export const cancelPublicBookingPayment = (bookingId) =>
  client.post("/public/booking/cancel-payment", { booking_id: bookingId });

export const cancelPublicBookingPayments = cancelPublicBookingPayment;
