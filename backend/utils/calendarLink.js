import { isValidDate, isValidTime } from "./time.js";

const DEFAULT_TIMEZONE = "Africa/Lagos";

const toGoogleDateTime = (date, time) => {
  return `${date.replaceAll("-", "")}T${time.replace(":", "")}00`;
};

export const buildCustomerCalendarUrl = ({ business, service, booking }) => {
  if (
    !isValidDate(booking.date) ||
    !isValidTime(booking.startTime) ||
    !isValidTime(booking.endTime)
  ) {
    return "";
  }

  const businessName = business.businessName || business.name || "BookMe";
  const serviceName = service.name || "Appointment";

  const details = [
    `Booking with ${businessName}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${serviceName} with ${businessName}`,
    dates: `${toGoogleDateTime(
      booking.date,
      booking.startTime
    )}/${toGoogleDateTime(booking.date, booking.endTime)}`,
    details,
    ctz: business.timeZone || business.timezone || DEFAULT_TIMEZONE,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildCustomerCalenderUrl = buildCustomerCalendarUrl;
