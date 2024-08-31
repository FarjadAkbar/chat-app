import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    room: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}


const chatSchema = new Schema<IChat>({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const Chat = mongoose.model<IChat>("Chat", chatSchema);
export default Chat