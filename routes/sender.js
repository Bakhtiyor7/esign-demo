// routes/sender.js
import express from "express";
import {
  JsonRpcProvider,
  Wallet,
  Contract,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import { arrayify } from "@ethersproject/bytes";

dotenv.config();

const router = express.Router();

const { PRIVATE_KEY, RPC_URL, CONTRACT_ADDRESS } = process.env;

// Reconstruct __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load contract ABI
const contractPath = path.join(__dirname, "../contract/DocumentSigner.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;

// Set up provider and wallet
const provider = new JsonRpcProvider(RPC_URL);
const wallet = new Wallet(PRIVATE_KEY, provider);

// Create contract instance
const contract = new Contract(CONTRACT_ADDRESS, contractABI, wallet);

// Endpoint to hash and send document hash to smart contract
router.post("/upload", async (req, res) => {
  try {
    console.log("ABI:", contract.abi);
    // console.log(CONTRACT_ADDRESS);
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: "No document provided" });
    }

    // Hash the document
    const documentHash = keccak256(toUtf8Bytes(document));

    // sign the document with public key
    const signature = await wallet.signMessage(arrayify(documentHash));
    console.log("signature:", signature);

    // Send transaction to store the document hash
    const tx = await contract.signDocument(documentHash, signature);
    await tx.wait();

    res.json({
      message: "Document hash stored on blockchain",
      transactionHash: tx.hash,
      documentHash,
      signature,
    });
  } catch (error) {
    console.error("Error in /sender/upload:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
});

export default router;
