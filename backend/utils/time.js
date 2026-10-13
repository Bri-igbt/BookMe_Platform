const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MINUTES_IN_DAY = 24 * 60;

export const isValidTime = (time) =>
  typeof time === "string" && TIME_REGEX.test(time);

export const isValidDate = (date) => {
  if (typeof date !== "string" || !DATE_REGEX.test(date)) return false;

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
};

export const timeToMinutes = (time) => {
  if (!isValidTime(time)) {
    throw new Error(`Invalid time "${time}". Expected HH:mm (24-hour).`);
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes) => {
  if (
    !Number.isInteger(totalMinutes) ||
    totalMinutes < 0 ||
    totalMinutes >= MINUTES_IN_DAY
  ) {
    throw new RangeError(
      `Minutes must be a whole number from 0 to ${
        MINUTES_IN_DAY - 1
      }, got ${totalMinutes}`
    );
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
};

export const isValidTimeRange = (startTime, endTime) =>
  isValidTime(startTime) &&
  isValidTime(endTime) &&
  timeToMinutes(startTime) < timeToMinutes(endTime);

export const getDayOfWeek = (date) => {
  if (!isValidDate(date)) {
    throw new Error(`Invalid date "${date}". Expected YYYY-MM-DD.`);
  }

  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};
