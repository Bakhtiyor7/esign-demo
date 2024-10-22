// routes/sender.js
import express from "express";
import { uploadDocument } from "../controller/uploadController.js";

const sendRouter = express.Router();

// Route to handle uploading and signing the document
sendRouter.post("/upload", uploadDocument);

export default sendRouter;
