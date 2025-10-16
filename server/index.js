import express from "express";
import cors from "cors";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils.js";
import { sha256 } from "ethereum-cryptography/sha256.js";
import * as secp from "ethereum-cryptography/secp256k1.js";


const app = express();
const port = 3042;

app.use(cors());
app.use(express.json());


// Sample balances (public keys as addresses)
const balances = {
  // from private key 0f8222...
  "07b42c874daddf4bb273d46c3c46f214fe28592fa437e8dc2c12a9c84c7b81613f5898091678f81f4bcd41095cb6587ca76fd8c99498eafc2fa82746f900037c": 100,
  // from private key 8312c2...
  "428b95071b9f925470d4007e745573bef8d707d013ea963ebc0903a1c81f12cc777d7ebe85ad101bb75f8894187238e19236c574f5fa359675fea696ce1796de": 50,
  // from private key 69213d...
  "86111ffe9d8fec1bd35449c9123e810787012035574b0bac1cd606c9d07b2a273f1ed6426b0ec22d4ce46200fb5175524c61aebeaee0c4c0308f83df74f": 75,
};

// Check balance
app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

// Verify and send
app.post("/send", (req, res) => {
  const { message, signature, recovery } = req.body;

  // Parse message
  let tx;
  try {
    tx = JSON.parse(message);
  } catch {
    return res.status(400).send({ message: "Invalid message format" });
  }

  const { sender, recipient, amount } = tx;

  if (!sender || !recipient || typeof amount !== "number") {
    return res.status(400).send({ message: "Invalid transaction data" });
  }

  // Hash the message
  const msgHash = sha256(utf8ToBytes(message));
  const sigBytes = Uint8Array.from(Buffer.from(signature, "hex"));

  // Recover the public key
  let recoveredPubKey;
  try {
    recoveredPubKey = secp.recoverPublicKey(msgHash, sigBytes, recovery);
  } catch (err) {
    return res.status(400).send({ message: "Invalid signature" });
  }

  // match client format (drop first byte 0x04)
  const recoveredAddress = toHex(recoveredPubKey.slice(1));

  // Check that the signature belongs to the claimed sender
  if (recoveredAddress !== sender) {
    return res.status(400).send({ message: "Signature does not match sender" });
  }

  // Ensure balances exist
  setInitialBalance(sender);
  setInitialBalance(recipient);

  // Check funds
  if (balances[sender] < amount) {
    return res.status(400).send({ message: "Not enough funds!" });
  }

  // Perform transaction
  balances[sender] -= amount;
  balances[recipient] += amount;

  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
