import dotenv from "dotenv";

dotenv.config();

class Env {
  static NODE_ENV: string = process.env.NODE_ENV || "prod";
  static PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  static MONGO_URI: string = process.env.MONGO_URI || "localhost";
}

export default Env;
