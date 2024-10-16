import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  socketId: string;
  username: string;
  roomId?: string;
}

const UserSchema: Schema = new Schema({
  socketId: { type: String, required: true },
  username: { type: String, required: true },
  roomId: { type: String, required: false },
});

const User = mongoose.model<IUser>("users", UserSchema);
export default User;
