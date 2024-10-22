// routes/receiver.js
import express from "express";
import { verifyDocument } from "../controller/verifyController.js";

const verifyRouter = express.Router();

// Route to handle verifying the document signature
verifyRouter.post("/verify", verifyDocument);

export default verifyRouter;
