import Availability from "../models/Availability.js";
import { isValidTimeRange, timeToMinutes } from "../utils/time.js";

const MAX_SLOTS_PER_DAY = 50;

const handleError = (res, error) => {
    if (error.name === "ValidationError") {
        const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(", ");
        return res.status(400).json({ message });
    }

    if (error.code === 11000) {
        return res
        .status(409)
        .json({ message: "Availability was just updated. Please try again." });
    }

    console.error(error);
    return res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
};


const validateSlots = (slots) => {
    if (!Array.isArray(slots)) {
        return { error: "slots must be an array" };
    }

    if (slots.length > MAX_SLOTS_PER_DAY) {
        return { error: `A day can have at most ${MAX_SLOTS_PER_DAY} time slots` };
    }

    const cleaned = [];
    for (const slot of slots) {
        if (!slot || !isValidTimeRange(slot.startTime, slot.endTime)) {
            return {
                error:
                "Each slot needs a valid startTime and endTime (HH:mm, 24-hour), with the end after the start",
            };
        }
        cleaned.push({ startTime: slot.startTime, endTime: slot.endTime });
    }

    cleaned.sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );

    for (let i = 1; i < cleaned.length; i += 1) {
        if (
            timeToMinutes(cleaned[i].startTime) <
            timeToMinutes(cleaned[i - 1].endTime)
        ) {
            return { error: "Time slots cannot overlap" };
        }
    }

    return { slots: cleaned };
};

// LIST AVAILABILITY
export const listAvailability = async (req, res) => {
    try {
        const availability = await Availability.find({
            userId: req.user.id,
        }).sort({ dayOfWeek: 1 });

        res.json({ availability });
    } catch (error) {
        return handleError(res, error);
    }
};

// SAVE AVAILABILITY FOR ONE WEEKDAY 
export const saveAvailability = async (req, res) => {
    try {
        const rawDay = req.body.dayOfWeek;
        const dayOfWeek = Number(rawDay);

        if (
            rawDay === undefined ||
            rawDay === null ||
            rawDay === "" ||
            !Number.isInteger(dayOfWeek) ||
            dayOfWeek < 0 ||
            dayOfWeek > 6
        ) {
            return res.status(400).json({
                message:
                "Valid day of the week is required (0 = Sunday to 6 = Saturday)",
            });
        }

        const { error, slots } = validateSlots(req.body.slots ?? []);
        if (error) {
            return res.status(400).json({ message: error });
        }

        const availability = await Availability.findOneAndUpdate(
            { userId: req.user.id, dayOfWeek },
            { $set: { slots } },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            }
        );

        res.json({
            message: "Availability saved",
            availability,
        });

    } catch (error) {
        return handleError(res, error);
    }
};
