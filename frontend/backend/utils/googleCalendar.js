import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { buildCustomerCalendarUrl } from "./calendarLink.js";

const DEFAULT_TIMEZONE = "Africa/Lagos";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

const getStateSecret = () => `${process.env.JWT_SECRET}:google-calendar-state`;

export const getGoogleAuthUrl = (userId) => {
  const state = jwt.sign({ userId: String(userId) }, getStateSecret(), {
    expiresIn: "10m",
  });

  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [CALENDAR_SCOPE],
    state,
  });
};

export const verifyGoogleState = (state) => {
  const decoded = jwt.verify(state, getStateSecret());
  return decoded.userId;
};

export const getGoogleToken = async (code) => {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  return tokens;
};

const isConnected = (business) =>
  Boolean(business.googleCalendarConnected && business.googleRefreshToken);

const getCalendarId = (business) => business.googleCalendarId || "primary";

const getTimeZone = (business) =>
  business.timeZone || business.timezone || DEFAULT_TIMEZONE;

const getCalendarClient = (business) => {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: business.googleRefreshToken });

  return google.calendar({ version: "v3", auth: oauth2Client });
};

const getErrorStatus = (error) =>
  Number(error?.response?.status || error?.code) || 0;

const isMissingEvent = (error) => [404, 410].includes(getErrorStatus(error));

const describeError = (error) => {
  const message = String(error?.message || "Google Calendar request failed");
  const needsReconnect = message.includes("invalid_grant");

  return {
    calendarError: needsReconnect
      ? "Google Calendar access was revoked or expired. Please reconnect Google Calendar."
      : message,
    needsReconnect,
  };
};

const buildEvent = ({ business, service, booking }) => {
  const timeZone = getTimeZone(business);

  const description = [
    `Customer: ${booking.customerName}`,
    `Email: ${booking.customerEmail}`,
    booking.notes ? `Notes: ${booking.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    summary: `${service.name} - ${booking.customerName}`,
    description,
    start: {
      dateTime: `${booking.date}T${booking.startTime}:00`,
      timeZone,
    },
    end: {
      dateTime: `${booking.date}T${booking.endTime}:00`,
      timeZone,
    },
    attendees: [{ email: booking.customerEmail }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };
};

export const createBookingCalendarEvent = async ({
  business,
  service,
  booking,
}) => {
  const customerCalendarUrl = buildCustomerCalendarUrl({
    business,
    service,
    booking,
  });

  if (!isConnected(business)) {
    return { customerCalendarUrl };
  }

  try {
    const calendar = getCalendarClient(business);
    const { data } = await calendar.events.insert({
      calendarId: getCalendarId(business),
      requestBody: buildEvent({ business, service, booking }),
      sendUpdates: "all",
    });

    return { googleEventId: data.id, customerCalendarUrl };
  } catch (error) {
    console.error("Google Calendar create failed:", error.message);
    return { customerCalendarUrl, ...describeError(error) };
  }
};

export const updateBookingCalendarEvent = async ({
  business,
  service,
  booking,
}) => {
  const customerCalendarUrl = buildCustomerCalendarUrl({
    business,
    service,
    booking,
  });

  if (!isConnected(business)) {
    return { customerCalendarUrl };
  }

  if (!booking.googleEventId) {
    return createBookingCalendarEvent({ business, service, booking });
  }

  try {
    const calendar = getCalendarClient(business);
    const { data } = await calendar.events.patch({
      calendarId: getCalendarId(business),
      eventId: booking.googleEventId,
      requestBody: buildEvent({ business, service, booking }),
      sendUpdates: "all",
    });

    return { googleEventId: data.id, customerCalendarUrl };
  } catch (error) {
    if (isMissingEvent(error)) {
      return createBookingCalendarEvent({
        business,
        service,
        booking: { ...booking, googleEventId: "" },
      });
    }

    console.error("Google Calendar update failed:", error.message);
    return {
      googleEventId: booking.googleEventId,
      customerCalendarUrl,
      ...describeError(error),
    };
  }
};

export const cancelBookingCalendarEvent = async ({ business, booking }) => {
  if (!isConnected(business) || !booking.googleEventId) {
    return false;
  }

  try {
    const calendar = getCalendarClient(business);
    await calendar.events.delete({
      calendarId: getCalendarId(business),
      eventId: booking.googleEventId,
      sendUpdates: "all",
    });

    return true;
  } catch (error) {
    if (isMissingEvent(error)) return true;
    console.error("Google Calendar cancel failed:", error.message);
    return false;
  }
};
