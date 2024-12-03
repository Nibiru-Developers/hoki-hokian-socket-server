import http from "http";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { Server as SocketServer, Socket } from "socket.io";
import bcrypt from "bcrypt";
import socketRoomController from "../socket/socketRoomController";
import Guest from "../models/Guest";
import Room from "../models/Room";
import { generateAutoIncrementNumber } from "../utils/helperFunction";

const createServer: Express = express();

createServer.use(express.json());
createServer.use(helmet());
createServer.use(cors());

createServer.get("/", (req: Request, res: Response) => {
  return res.status(200).send("Server Online!");
});

createServer.post("/create-room", async (req: Request, res: Response) => {
  try {
    const { roomName, password } = req.body;
    const roomId = `room_${generateAutoIncrementNumber().next().value}`;

    let passwordHash = "";
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const room = new Room({
      roomId,
      roomName,
      alreadyPlaying: false,
      players: [],
      password: password ? passwordHash : "",
    });
    await room.save();

    refreshRoomList();

    return res.status(200).json({
      statusCode: 200,
      message: "Success",
      data: {
        roomId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      message: `${error}`,
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

io.of("/lobby").on("connection", async (socket: Socket) => {
  try {
    const name = socket.handshake.query.name;
    if(!name ||  typeof name !== "string") throw new Error("Name Is Required");

    const guest = new Guest({
      socketId: socket.id,
      name: name,
    });

    await guest.save();
    refreshUserList();
    refreshRoomList();
    sendLog(`${guest.name} joined lobby`);

    socket.on("disconnect", async () => {
      const guest = await Guest.findOneAndDelete({ socketId: socket.id });
      refreshUserList();
      sendLog(`${guest?.name} left lobby`);
    });
  } catch (error) {
    socket.emit("error", "Critical " + error);
    socket.disconnect();
  }
});

io.of("/room").on("connection", async (socket: Socket) => {
  try {
    const name = socket.handshake.query.name;
    if(!name ||  typeof name !== "string") throw new Error("Name Is Required");

    const roomId = socket.handshake.query.roomId;
    if(!roomId ||  typeof roomId !== "string") throw new Error("Room Id Is Required");

    const password = socket.handshake.query.password;
    if(!password ||  typeof password !== "string") throw new Error("Password Is Required");

    const room = await Room.findOne({ roomId });
    if (!room) {
      throw new Error("Room Not Found");
    } else if (room.alreadyPlaying) {
      throw new Error("Room Already Playing");
    } else if (await bcrypt.compare(password, room.password)) {
      throw new Error("Wrong Room Password");
    } else {
      socket.join(roomId);

      const isLeader = room.players.length === 0;
      await Room.findOneAndUpdate(
        { roomId },
        {
          $push: {
            players: {
              socketId: socket.id,
              name: name,
              isLeader: isLeader,
            },
          },
        }
      );

      refreshUserList(roomId);
      sendLog(`${name} joined room`, roomId);
    }

    socket.on("disconnect", async () => {
      const room = await Room.findOne({ roomId });
      if (room?.players.length === 1) {
        await Room.findOneAndDelete({ roomId });
      } else {
        await Room.findOneAndUpdate(
          { roomId },
          { $pull: { players: { socketId: socket.id } } }
        );
        refreshUserList(roomId);
        sendLog(`${room?.players.filter((player) => player.socketId !== socket.id)[0].name} left room`, roomId);
      }
    });

    socketRoomController(io, socket);
  } catch (error) {
    socket.emit("error", "Critical " + error);
    socket.disconnect();
  }
});

export async function refreshUserList(roomId?: string) {
  if (!roomId) {
    const players = await Guest.find();
    io.of("/lobby").emit("userList", players);
  } else {
    const players = await Room.findOne({ roomId });
    io.of("/room").to(roomId).emit("userList", players);
  }
}

export async function refreshRoomList() {
  const rooms = await Room.find();
  io.of("/lobby").emit("roomList", rooms);
}

export function sendLog(message: string, roomId?: string) {
  if (!roomId) {
    io.of("/lobby").emit("log", message);
  } else {
    io.of("/room").to(roomId).emit("log", message);
  }
}

export default mainServer;
