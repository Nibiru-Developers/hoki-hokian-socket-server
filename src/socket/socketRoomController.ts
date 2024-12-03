import { Server as SocketServer, Socket } from "socket.io";

export default function socketRoomController(
  io: SocketServer,
  socket: Socket
): void {
  console.log(socket.id);
}
