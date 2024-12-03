import mongoose, { Document, Schema } from "mongoose";

interface IGuest extends Document {
  socketId: string;
  name: string;
}

const GuestSchema: Schema = new Schema({
  socketId: { type: String, required: true },
  name: { type: String, required: true },
});
const Guest = mongoose.model<IGuest>("guests", GuestSchema);

export default Guest;
