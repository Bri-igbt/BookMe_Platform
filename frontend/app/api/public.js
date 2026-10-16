import client from "./client.js";

export const getPublicBusiness = (slug) => client.get(`/public/${slug}`);

export const getPublicSlots = (slug, params) =>
  client.get(`/public/${slug}/slots`, { params });

export const requestPublicBookingOtp = (slug, customerEmail) =>
  client.post(`/public/${slug}/request-otp`, { customerEmail });

export const verifyPublicBookingOtp = (slug, data) =>
  client.post(`/public/${slug}/verify-otp`, data);

export const createPublicBooking = (slug, data) =>
  client.post(`/public/${slug}/book`, data);

export const getPublicBookingStatus = (params) =>
  client.post(`/public/booking/status`, { params });

export const cancelPublicBookingPayments = (bookingId) =>
  client.post(`/public/${slug}/cancel-payment`, { booking_id: bookingId });
