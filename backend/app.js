import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import availabilityRouter from "./routes/availabilityRoutes.js";
import integrationRouter from "./routes/integrationRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

app.set("trust proxy", 1);

const toOrigin = (value) => {
  try {
    return new URL(value.trim()).origin;
  } catch (error) {
    return value.trim().replace(/\/+$/, "");
  }
};

const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
  ...(process.env.ALLOWED_ORIGINS || "").split(","),
]
  .filter(Boolean)
  .map(toOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/+$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.warn(
        "CORS blocked origin:",
        origin,
        "Allowed origins:",
        allowedOrigins
      );

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use((req, res, next) => {
  res.on("finish", () =>
    console.log(req.method, req.originalUrl, res.statusCode)
  );
  next();
});

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    clientUrlSet: Boolean(process.env.CLIENT_URL),
    emailKeySet: Boolean(process.env.BREVO_API_KEY),
    emailSenderSet: Boolean(
      process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM
    ),
    allowedOrigins,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/services", serviceRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/integrations", integrationRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/public", publicRouter);

export default app;
