import User from "../models/User.js";
import {
  getGoogleAuthUrl,
  getGoogleToken,
  verifyGoogleState,
} from "../utils/googleCalendar.js";

const getClientUrl = () =>
  (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, "");

const redirectToProfile = (res, status) =>
  res.redirect(`${getClientUrl()}/profile?calendar=${status}`);

export const getGoogleConnectUrl = (req, res) => {
  try {
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.GOOGLE_REDIRECT_URI
    ) {
      return res.status(503).json({
        message: "Google Calendar is not configured yet",
      });
    }

    res.json({ url: getGoogleAuthUrl(req.user.id) });
  } catch (error) {
    console.error("Google connect failed:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const handleGoogleCallback = async (req, res) => {
  try {
    const { code, state, error: googleError } = req.query;
    if (googleError) {
      return redirectToProfile(res, "denied");
    }

    if (typeof code !== "string" || typeof state !== "string") {
      return redirectToProfile(res, "failed");
    }

    let userId;
    try {
      userId = verifyGoogleState(state);
    } catch (e) {
      return redirectToProfile(res, "failed");
    }

    const tokens = await getGoogleToken(code);
    if (!tokens.refresh_token) {
      return redirectToProfile(res, "missing-refresh-token");
    }

    const user = await User.findByIdAndUpdate(userId, {
      googleRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleCalendarId: "primary",
    });

    if (!user) {
      return redirectToProfile(res, "failed");
    }

    return redirectToProfile(res, "connected");
  } catch (error) {
    console.error("Google callback failed:", error.message);
    return redirectToProfile(res, "failed");
  }
};

export const disconnectGoogleCalendar = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      googleRefreshToken: "",
      googleCalendarConnected: false,
    });

    res.json({ message: "Google Calendar disconnected" });
  } catch (error) {
    console.error("Google disconnect failed:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
