import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Web3 from "web3";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { PRIVATE_KEY, RPC_URL, CONTRACT_ADDRESS } = process.env;

// Initialize Web3 instance
const web3 = new Web3(new Web3.providers.HttpProvider(RPC_URL));

// Load contract ABI
const contractPath = path.join(__dirname, "../contract/DocumentSigner.json");
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const contractABI = contractJson.abi;
const contract = new web3.eth.Contract(contractABI, CONTRACT_ADDRESS);

// Get account from private key
const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

// Function to hash a document using SHA-256
function hashDocumentSHA256(document) {
  const hash = crypto.createHash("sha256").update(document).digest("hex");
  return "0x" + hash;
}

// Controller for uploading and signing document
export const uploadDocument = async (req, res) => {
  try {
    const { document } = req.body;

    if (!document) {
      return res.status(400).json({ error: "No document provided" });
    }

    // Hash the document with SHA-256
    const documentHash = hashDocumentSHA256(document);
    console.log("SHA-256 Document Hash:", documentHash);

    // Sign the document hash with the private key
    const signature = account.sign(documentHash);
    console.log("Signature:", signature.signature);

    // Send transaction to store the document hash on the blockchain
    const tx = await contract.methods
      .signDocument(documentHash, signature.signature)
      .send({ from: account.address, gas: 500000 });

    res.json({
      message: "Document hash stored on blockchain",
      transactionHash: tx.transactionHash,
      documentHash,
      signature: signature.signature,
    });
  } catch (error) {
    console.error("Error in uploadDocument:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your request." });
  }
};
