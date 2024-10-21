// server.js
import express from "express";
import bodyParser from "body-parser";
import senderRoutes from "./routes/sender.js";
import receiverRoutes from "./routes/receiver.js";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/sender", senderRoutes);
app.use("/receiver", receiverRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
