import { Server as SocketServer, Socket } from "socket.io";
import User from "../models/User";

export default function socketController(
  io: SocketServer,
  socket: Socket
): void {
  socket.on("changeUsername", async (username: string) => {
    await User.findOneAndUpdate({ socketId: socket.id }, { username });

    io.emit("usernameChanged", "Username Changed");
  });
}
