import { Server as SocketServer, Socket } from "socket.io";
import { refreshUserList, sendLog } from "../server/createServer";
import UsersInLobby from "../models/UsersInLobby";

export default function socketController(
  io: SocketServer,
  socket: Socket
): void {
  socket.on("changeUsername", async (username: string) => {
    const user = await UsersInLobby.findOneAndUpdate(
      { socketId: socket.id },
      { username }
    );
    refreshUserList();

    socket.emit("usernameChanged", "Username Changed");
    sendLog(io, `${user?.username} change username to ${username}`);
  });
}
