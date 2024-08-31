import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
  name: string;
  users: mongoose.Types.ObjectId[];
}

const roomSchema = new Schema<IRoom>({
  name: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const Room = mongoose.model<IRoom>('Room', roomSchema)
export default Room;