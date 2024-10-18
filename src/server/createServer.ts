import http from "http";
import express, { Express, Request, Response } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import socketController from "../socket/socketController";
import socketRoomController from "../socket/socketRoomController";
import UsersInLobby from "../models/UsersInLobby";
import UsersInRoom from "../models/UsersInRoom";
import { generateAutoIncrementNumber } from "../utils/helperFunction";

const createServer: Express = express();

createServer.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Server Online!");
});

createServer.get("/create-room", async (req: Request, res: Response) => {
  try {
    const { username, roomName } = req.body;
    const roomId = `room_${generateAutoIncrementNumber().next().value}`;

    const room = new UsersInRoom({
      roomId,
      roomName,
      users: [],
    });
    await room.save();

    refreshRoomList();

    return res.status(200).json({
      statusCode: 200,
      message: "Success",
      data: {
        username: username,
        roomId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: error,
      error: "Internal Server Error",
    });
  }
});

createServer.use((req: Request, res: Response) => {
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

    const room = await UsersInRoom.findOne({ roomId });
    if (!room) {
      throw new Error("Room not found");
    } else if (room.alreadyPlaying) {
      throw new Error("Room already playing");
    } else {
      socket.join(roomId);

      await UsersInRoom.findOneAndUpdate(
        { roomId },
        {
          users: [
            ...room.users,
            { socketId: socket.id, username, isLeader: false },
          ],
        }
      );

      refreshUserList(roomId);
      sendLog(io, `${username} joined room`, `${roomId}`);
    }

    socket.on("disconnect", async () => {
      const room = await UsersInRoom.findOne({ roomId });
      await UsersInRoom.findOneAndUpdate(
        { roomId },
        {
          users: room?.users.filter((user) => user.socketId !== socket.id),
        }
      );
      refreshUserList(roomId);
      sendLog(io, `${room?.users.filter((user) => user.socketId !== socket.id)[0].username } left room`, roomId);
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
    io.emit("userList", users);
  }
}

export async function refreshRoomList() {
  const rooms = await UsersInRoom.find();
  io.emit("roomList", rooms);
}

export function sendLog(io: SocketServer, message: string, roomId?: string) {
  if (roomId) {
    io.of("/room").to(roomId).emit("log", message);
  } else {
    io.emit("log", message);
  }
}

export default mainServer;
