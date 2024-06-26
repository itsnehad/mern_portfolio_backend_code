import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderName: {
    type: String,
    minLength: [2, "Name must contain at least 2 characters!"],
  },
  subject: {
    type: String,
    minLength: [2, "Subject must contain at least 2 characters!"],
  },
  phoneOrEmail: {
    type: mongoose.SchemaTypes.Mixed,
    validate: {
      validator: function (value) {
        // Check if the value is a number or matches the email format
        return typeof value === "Number" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: "Enter a valid Email !",
    },
    required: true,
  },
  message: {
    type: String,
    minLength: [2, "Message must contain at least 2 characters!"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Message = mongoose.model("Message", messageSchema);
