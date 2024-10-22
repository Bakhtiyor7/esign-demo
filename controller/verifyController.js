import Web3 from "web3";
import crypto from "crypto"; // For SHA-256 hashing
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url"; // Import to convert import.meta.url to a file path

dotenv.config();

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { RPC_URL, CONTRACT_ADDRESS } = process.env;

// Initialize Web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

// Load contract ABI
const contractPath = path.join(__dirname, "../contract/DocumentSigner.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

// Function to hash a document using SHA-256
function hashDocumentSHA256(document) {
  return crypto.createHash("sha256").update(document).digest("hex");
}

// Controller for verifying the document signature
export const verifyDocument = async (req, res) => {
  try {
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: "No document provided" });
    }

    // Hash the document with SHA-256
    const documentHash = hashDocumentSHA256(document);
    console.log("SHA-256 Document Hash:", documentHash);

    // Check if the document exists on the blockchain
    const exists = await contract.methods.documentExists(documentHash).call();

    if (!exists) {
      return res
        .status(404)
        .json({ message: "Document not found on blockchain" });
    }

    // Retrieve document details
    const { sender, signature } = await contract.methods
      .getDocument(documentHash)
      .call();

    // Recover the address from the document hash and signature
    const recoveredAddress = web3.eth.accounts.recover(documentHash, signature);

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
    console.error("Error in verifyDocument:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};
