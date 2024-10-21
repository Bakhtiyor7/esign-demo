// routes/receiver.js
import express from "express";
import {
  JsonRpcProvider,
  Contract,
  keccak256,
  toUtf8Bytes,
  verifyMessage,
} from "ethers";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { arrayify } from "@ethersproject/bytes";

dotenv.config();

const router = express.Router();

const { RPC_URL, CONTRACT_ADDRESS } = process.env;

// Reconstruct __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const contractPath = path.join(__dirname, "../contract/DocumentSigner.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;

// Set up provider
const provider = new JsonRpcProvider(RPC_URL);

// Create contract instance
const contract = new Contract(CONTRACT_ADDRESS, contractABI, provider);

// Endpoint to verify if a document hash exists
router.post("/verify", async (req, res) => {
  try {
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: "No document provided" });
    }

    // Hash the document
    const documentHash = keccak256(toUtf8Bytes(document));

    // Check if the document exists on the blockchain
    const exists = await contract.documentExists(documentHash);

    if (!exists) {
      return res
        .status(404)
        .json({ message: "Document not found on blockchain" });
    }

    // Retrieve document details
    const [sender, signature] = await contract.getDocument(documentHash);

    const recoveredAddress = verifyMessage(arrayify(documentHash), signature);

    if (recoveredAddress !== sender) {
      return res
        .status(400)
        .json({ message: "Signature verification failed. Invalid signature." });
    }

    res.json({
      message: "Document verified on blockchain",
      sender,
      documentHash,
      signature,
    });
  } catch (error) {
    console.error("Error in /receiver/verify:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

export default router;
