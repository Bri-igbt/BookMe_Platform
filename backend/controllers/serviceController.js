import Service from "../models/Service.js";

const MIN_DURATION = 5; // minutes
const MAX_DURATION = 480; // minutes

const handleError = (res, error) => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  if (error.name === "CastError") {
    return res.status(404).json({ message: "Service not found" });
  }

  console.error(error);
  return res.status(500).json({
    message: "Server error",
    error: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
};

const validateServiceFields = (input) => {
  const values = {};

  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) return { error: "Service name cannot be empty" };
    values.name = name;
  }

  if (input.duration !== undefined) {
    const duration = Number(input.duration);
    if (
      !Number.isInteger(duration) ||
      duration < MIN_DURATION ||
      duration > MAX_DURATION
    ) {
      return {
        error: `Duration must be a whole number of minutes between ${MIN_DURATION} and ${MAX_DURATION}`,
      };
    }
    values.duration = duration;
  }

  if (input.price !== undefined) {
    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0) {
      return { error: "Price must be a number that is 0 or more" };
    }
    values.price = price;
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      return { error: "Description must be text" };
    }
    values.description = input.description.trim();
  }

  if (input.icon !== undefined) {
    if (typeof input.icon !== "string" || !input.icon.trim()) {
      return { error: "Icon must be a non-empty string" };
    }
    values.icon = input.icon.trim();
  }

  if (input.isActive !== undefined) {
    if (typeof input.isActive !== "boolean") {
      return { error: "isActive must be true or false" };
    }
    values.isActive = input.isActive;
  }

  return { values };
};

// LIST SERVICES
export const listServices = async (req, res) => {
  try {
    const services = await Service.find({
      userId: req.user.id,
      isDeleted: { $ne: true },
    }).sort({ createdAt: -1 });

    res.json({ services });
  } catch (error) {
    return handleError(res, error);
  }
};

// CREATE SERVICE
export const createService = async (req, res) => {
  try {
    const { name, duration } = req.body;

    if (!name || duration === undefined || duration === "") {
      return res.status(400).json({
        message: "Service name and duration are required",
      });
    }

    const { error, values } = validateServiceFields(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    const service = await Service.create({
      price: 0,
      description: "",
      icon: "C1.png",
      ...values,
      userId: req.user.id,
    });

    res.status(201).json({
      message: "Service created",
      service,
    });
  } catch (error) {
    return handleError(res, error);
  }
};

// UPDATE SERVICE
export const updateService = async (req, res) => {
  try {
    const { error, values } = validateServiceFields(req.body);
    if (error) {
      return res.status(400).json({ message: error });
    }

    if (Object.keys(values).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, isDeleted: { $ne: true } },
      { $set: values },
      { new: true, runValidators: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service updated", service });
  } catch (error) {
    return handleError(res, error);
  }
};

// DELETE SERVICE 
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, isDeleted: { $ne: true } },
      { isDeleted: true, isActive: false },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.json({ message: "Service deleted" });
  } catch (error) {
    return handleError(res, error);
  }
};
