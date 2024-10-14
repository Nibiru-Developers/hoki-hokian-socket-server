import { Server as SocketServer, Socket } from "socket.io";

export default function socketController(
  io: SocketServer,
  socket: Socket
): void {
  console.log(`Client with ID ${socket.id} connected!`);

  socket.on("disconnect", () => {
    console.log(`Client with ID ${socket.id} disconnected!`);
  });
}
