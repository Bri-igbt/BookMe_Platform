import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    duration: {
      type: Number,
      required: true,
      min: 5,
      max: 480,
      validate: {
        validator: Number.isInteger,
        message: "Duration must be a whole number of minutes",
      },
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    icon: {
      type: String,
      default: "C1.png",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

serviceSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
serviceSchema.index({ userId: 1, isDeleted: 1, isActive: 1 });

const Service =
  mongoose.models.Service || mongoose.model("Service", serviceSchema);
export default Service;
