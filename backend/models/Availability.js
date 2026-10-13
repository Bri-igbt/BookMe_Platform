import mongoose from "mongoose";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const slotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [TIME_REGEX, "Time must be in HH:mm (24-hour) format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [TIME_REGEX, "Time must be in HH:mm (24-hour) format"],
    },
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      validate: {
        validator: Number.isInteger,
        message: "dayOfWeek must be a whole number from 0 to 6",
      },
    },
    slots: {
      type: [slotSchema],
      default: [],
      validate: {
        validator(slots) {
          const sorted = [...slots].sort(
            (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)
          );

          for (let i = 0; i < sorted.length; i += 1) {
            const start = toMinutes(sorted[i].startTime);
            const end = toMinutes(sorted[i].endTime);

            if (end <= start) return false;
            if (i > 0 && start < toMinutes(sorted[i - 1].endTime)) return false;
          }

          return true;
        },
        message: "Each slot must end after it starts, and slots cannot overlap",
      },
    },
  },
  { timestamps: true }
);

availabilitySchema.index({ userId: 1, dayOfWeek: 1 }, { unique: true });

const Availability =
  mongoose.models.Availability ||
  mongoose.model("Availability", availabilitySchema);

export default Availability;
