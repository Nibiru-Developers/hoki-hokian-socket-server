import http from "http";
import express, { Express, Request, Response } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import socketController from "../socket/socketController";
import socketRoomController from "../socket/socketRoomController";
import UsersInLobby from "../models/UsersInLobby";
import UsersInRoom from "../models/UsersInRoom";

const createServer: Express = express();

createServer.get("/", (req: Request, res: Response): Response<string> => {
  return res.status(200).send("Server Online!");
});

createServer.use((req: Request, res: Response): Response<string> => {
  return res.status(404).send("404 - Not Found");
});

const mainServer = http.createServer(createServer);
const io = new SocketServer(mainServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", async (socket: Socket) => {
  try {
    const username = socket.handshake.query.username! as string;

    const user = new UsersInLobby({
      socketId: socket.id,
      username: username,
    });

    await user.save();
    refreshUserList();
    sendLog(io, `${user.username} joined lobby`);

    socket.on("disconnect", async () => {
      const user = await UsersInLobby.findOneAndDelete({ socketId: socket.id });
      refreshUserList();
      sendLog(io, `${user?.username} left lobby`);
    });

    socketController(io, socket);
  } catch (error) {
    socket.emit("error", "Critical " + error);
    socket.disconnect();
  }
});

io.of("/room").on("connection", async (socket: Socket) => {
  try {
    const username = socket.handshake.query.username! as string;
    const roomId = socket.handshake.query.roomId! as string;
    const roomName = socket.handshake.query.roomId! as string;

    socket.join(roomId);

    const room = await UsersInRoom.findOne({ roomId });
    if (room) {
      await UsersInRoom.findOneAndUpdate(
        { roomId },
        {
          users: [
            ...room.users,
            { socketId: socket.id, username, isLeader: false },
          ],
        }
      );
    } else {
      const newRoom = new UsersInRoom({
        roomId,
        roomName,
        users: [{ socketId: socket.id, username, isLeader: true }],
      });

      await newRoom.save();
      refreshRoomList();
    }

    refreshUserList(roomId);
    sendLog(io, `${username} joined room`, `${roomId}`);

    socket.on("disconnect", async () => {
      const room = await UsersInRoom.findOne(
        { roomId },
      );
      await UsersInRoom.findOneAndUpdate(
        { roomId },
        {
          users: room?.users.filter((user) => user.socketId !== socket.id),
        }
      );
      refreshUserList(roomId);
      sendLog(io, `${room?.users.filter((user) => user.socketId !== socket.id)[0].username} left room`, roomId);
    });

    socketRoomController(io, socket);
  } catch (error) {
    socket.emit("error", "Critical " + error);
    socket.disconnect();
  }
});

export async function refreshUserList(roomId?: string) {
  if (roomId) {
    const users = await UsersInRoom.findOne({ roomId });
    io.of("/room").to(roomId).emit("userList", users);
  } else {
    const users = await UsersInLobby.find();
    io.to("global").emit("userList", users);
  }
}

export async function refreshRoomList() {
  const rooms = await UsersInRoom.find();
  io.to("global").emit("roomList", rooms);
}

export function sendLog(io: SocketServer, message: string, roomId?: string) {
  if (roomId) {
    io.of("/room").to(roomId).emit("log", message);
  } else {
    io.to("global").emit("log", message);
  }
}

export default mainServer;
