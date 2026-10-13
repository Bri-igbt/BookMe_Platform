import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import availabilityRouter from "./routes/availabilityRoutes.js";
import integrationRouter from "./routes/integrationRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import publicRouter from "./routes/publicRoutes.js";
import adminRouter from "./routes/adminRoutes.js";

const PORT = process.env.PORT || 8000;
const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// DATABASE
connectDB();

// ROUTES

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/services", serviceRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/integrations", integrationRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use('/api/public', publicRouter);
app.use("/public", publicRouter);

const server = http.createServer(app);

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }

  throw error;
});

server.listen(PORT, () => {
  console.log(`Server Started on http://localhost:${PORT}`);
});
