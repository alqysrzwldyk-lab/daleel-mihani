import { Schema, model, models } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    lastMessage: { type: String, default: "" },
    lastSenderId: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessageAt: { type: Date },
    unreadCount: { type: Map, of: Number, default: {} },
    refType: { type: String, enum: ["ad", "professional"] },
    refId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true }
);

export const Conversation = models.Conversation || model("Conversation", ConversationSchema);
