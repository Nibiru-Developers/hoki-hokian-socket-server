import createServer from "./server/createServer";
import Env from "./utils/Env";

createServer.listen(Env.PORT, async () => {
  try {
    process.on('exit', () => {
      console.log("Shutting down server and quitting Redis...");
    });

    process.on('SIGINT', () => {
      console.log("Received SIGINT. Shutting down gracefully...");
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log("Received SIGTERM. Shutting down gracefully...");
      process.exit(0);
    });

    console.log(`Server started on port ${Env.PORT} with ${Env.NODE_ENV} environment`);
    console.log(`Visit http://localhost:${Env.PORT}`);
    console.log("Developed by Andry Pebrianto");
  } catch (error) {
    console.error("Error during server startup: ", error);
    process.exit(1);
  }
});
