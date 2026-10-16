import express from "express";
import auth from "../middleware/auth.js";
import {
  listBookings,
  updateBookingStatus,
  rescheduleBooking,
} from "../controllers/bookingController.js";

const bookingRouter = express.Router();


bookingRouter.use(auth);

bookingRouter.get("/", listBookings);
bookingRouter.put("/:id/status", updateBookingStatus);
bookingRouter.put("/:id/reschedule", rescheduleBooking);

export default bookingRouter;
