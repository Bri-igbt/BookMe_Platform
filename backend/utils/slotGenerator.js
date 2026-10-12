import Availability from "../models/Availability.js";
import Booking from "../models/Booking.js";
import {
  isValidDate,
  getDayOfWeek,
  minutesToTime,
  timeToMinutes,
} from "./time.js";

const DEFAULT_TIMEZONE = "Africa/Lagos";

export const PENDING_PAYMENT_HOLD_MINUTES = 30;

const getNowInTimeZone = (timeZone) => {
  const format = (zone) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date());

  let parts;
  try {
    parts = format(timeZone || DEFAULT_TIMEZONE);
  } catch (e) {
    parts = format(DEFAULT_TIMEZONE);
  }

  const get = (type) => parts.find((part) => part.type === type).value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
};

export const generateSlots = async ({
  userId,
  service,
  date,
  timeZone = DEFAULT_TIMEZONE,
  minNoticeMinutes = 0,
}) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date. Expected YYYY-MM-DD.");
  }

  const now = getNowInTimeZone(timeZone);
  if (date < now.date) {
    return [];
  }

  const earliestStart = date === now.date ? now.minutes + minNoticeMinutes : 0;

  const availability = await Availability.findOne({
    userId,
    dayOfWeek: getDayOfWeek(date),
  }).lean();

  if (!availability || !availability.slots || availability.slots.length === 0) {
    return [];
  }

  const bookings = await Booking.find({
    userId,
    date,
    $or: [
      { status: { $in: ["pending", "confirmed"] } },
      {
        status: "pending_payment",
        createdAt: {
          $gte: new Date(Date.now() - PENDING_PAYMENT_HOLD_MINUTES * 60 * 1000),
        },
      },
    ],
  })
    .select("startTime endTime")
    .lean();

  const busy = bookings.map((booking) => ({
    start: timeToMinutes(booking.startTime),
    end: timeToMinutes(booking.endTime),
  }));

  const windows = [...availability.slots].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );

  const slots = [];

  for (const window of windows) {
    let cursor = timeToMinutes(window.startTime);
    const windowEnd = timeToMinutes(window.endTime);

    while (cursor + service.duration <= windowEnd) {
      const slotEnd = cursor + service.duration;

      const isPast = cursor < earliestStart;

      const hasConflict = busy.some(
        (booking) => cursor < booking.end && booking.start < slotEnd
      );

      if (!isPast && !hasConflict) {
        slots.push({
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(slotEnd),
        });
      }

      cursor += service.duration;
    }
  }

  return slots;
};

export const isSlotAvailable = async ({
  userId,
  service,
  date,
  startTime,
  timeZone,
  minNoticeMinutes,
}) => {
  const slots = await generateSlots({
    userId,
    service,
    date,
    timeZone,
    minNoticeMinutes,
  });

  return slots.some((slot) => slot.startTime === startTime);
};
