import mongoose, { Document, Schema } from "mongoose";

interface IUser extends Document {
  socketId: string;
  username: string;
}

const UsersInLobbySchema: Schema = new Schema({
  socketId: { type: String, required: true },
  username: { type: String, required: true },
});
const UsersInLobby = mongoose.model<IUser>("users_in_lobbies", UsersInLobbySchema);

export default UsersInLobby;
