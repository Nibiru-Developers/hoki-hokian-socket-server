import mongoose, { Document, Schema } from "mongoose";

export interface IPlayer extends Document {
  socketId: string;
  name: string;
  isLeader: boolean;
}

interface IRoom extends Document {
  roomId: string;
  roomName: string;
  alreadyPlaying: boolean;
  players: IPlayer[];
  password: string;
}

const RoomSchema: Schema = new Schema({
  roomId: { type: String, required: true },
  roomName: { type: String, required: true },
  alreadyPlaying: { type: Boolean, required: false },
  players: [
    {
      socketId: { type: String, required: true },
      name: { type: String, required: true },
      isLeader: { type: Boolean, required: true },
    },
  ],
  password: { type: String },
});
const Room = mongoose.model<IRoom>("rooms", RoomSchema);

export default Room;
