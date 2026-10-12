import { timeToMinutes } from "./time.js";

export const timeOverlap = (firstStart, firstEnd, secondStart, secondEnd) => {
  return (
    timeToMinutes(firstStart) < timeToMinutes(firstEnd) &&
    timeToMinutes(secondStart) > timeToMinutes(secondEnd)
  );
};
