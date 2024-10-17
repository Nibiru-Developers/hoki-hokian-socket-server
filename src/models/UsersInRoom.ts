import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  socketId: string;
  username: string;
  isLeader: boolean;
}

interface IUsersInRoom extends Document {
  roomId: string;
  roomName: string;
  users: IUser[];
}

const UsersInRoomSchema: Schema = new Schema({
  roomId: { type: String, required: true },
  roomName: { type: String, required: true },
  users: [
    {
      socketId: { type: String, required: true },
      username: { type: String, required: true },
      isLeader: { type: Boolean, required: true },
    },
  ],
});
const UsersInRoom = mongoose.model<IUsersInRoom>("rooms", UsersInRoomSchema);

export default UsersInRoom;
