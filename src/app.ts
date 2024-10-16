import mongoose from "mongoose";
import connectDB from "./db/database";
import createServer from "./server/createServer";
import Env from "./utils/Env";

(async () => {
  try {
    await connectDB();

    const server = createServer.listen(Env.PORT, () => {
      console.log(`Server started on port ${Env.PORT} with ${Env.NODE_ENV} environment`);
      console.log(`Visit http://localhost:${Env.PORT}`);
      console.log("Developed by Andry Pebrianto");
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        mongoose.disconnect();
        process.exit(0);
      });
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("Error during server startup: ", error);
    mongoose.disconnect();
    process.exit(1);
  }
})();
