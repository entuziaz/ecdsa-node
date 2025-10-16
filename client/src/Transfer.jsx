import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { sha256 } from "ethereum-cryptography/sha256";
import { utf8ToBytes, toHex, hexToBytes } from "ethereum-cryptography/utils";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    if (!privateKey) {
      alert("Please enter your private key in the Wallet first.");
      return;
    }

    const message = JSON.stringify({
      sender: address,
      recipient,
      amount: parseInt(sendAmount),
    });

    // Hash the message
    const messageHash = sha256(utf8ToBytes(message));

    // Convert private key to bytes
    const privateKeyBytes = hexToBytes(privateKey.trim());

    // Sign message hash
    // signSync returns [signature, recovery] when recovered: true
    const [signature, recovery] = secp.signSync(messageHash, privateKeyBytes, {
      recovered: true,
    });

    const signatureHex = toHex(signature);

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        message,
        signature: signatureHex,
        recovery,
      });

      setBalance(balance);
    } catch (ex) {
      alert(ex.response?.data?.message || "Error sending transaction");
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        />
      </label>

      <label>
        Recipient
        <input
          placeholder="Recipient address"
          value={recipient}
          onChange={setValue(setRecipient)}
        />
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
