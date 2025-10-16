import * as secp from "ethereum-cryptography/secp256k1.js";
import { toHex } from "ethereum-cryptography/utils.js";

const privateKey = secp.utils.randomPrivateKey();

console.log("Private key:", toHex(privateKey));
console.log("Public key (compressed):", toHex(secp.getPublicKey(privateKey, true)));
console.log("Public key (uncompressed):", toHex(secp.getPublicKey(privateKey, false)));
