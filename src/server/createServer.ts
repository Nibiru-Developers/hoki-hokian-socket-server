import http from "http";
import express, { Express, Request, Response } from "express";
import { Server as SocketServer, Socket } from "socket.io";
import socketController from "../socket/socketController";
import User from "../models/User";
import { generateAutoIncrementNumber } from "../utils/helperFunction";

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
  console.log(`Client with ID ${socket.id} connected!`);
  const user = new User({
    username: socket.handshake.query.username || `Guest ${generateAutoIncrementNumber().next().value}`,
    socketId: socket.id,
  });
  await user.save();

  socket.on("disconnect", async () => {
    console.log(`Client with ID ${socket.id} disconnected!`);
    await User.findOneAndDelete({ socketId: socket.id });
  });

  socketController(io, socket);
});

export default mainServer;
