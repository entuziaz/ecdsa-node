import server from "./server";
import { useState } from "react";
import * as secp from "ethereum-cryptography/secp256k1";
import { toHex, hexToBytes } from "ethereum-cryptography/utils";


function Wallet({ address, setAddress, balance, setBalance, privateKey, setPrivateKey }) {
  async function onAddressChange(evt) {
    const address = evt.target.value;
    setAddress(address);
    if (address) {
      const {
        data: { balance },
      } = await server.get(`balance/${address}`);
      setBalance(balance);
    } else {
      setBalance(0);
    }
  }

  async function onPrivateKeyChange(evt) {
    const pk = evt.target.value;
    setPrivateKey(pk);

    if (pk) {
      try {
        // convert hex string to bytes
        const privateKeyBytes = hexToBytes(pk.trim());
        // drop the first byte (0x04) so address is 64-byte hex to match server balances
        const publicKey = secp.getPublicKey(privateKeyBytes);
        const addressHex = toHex(publicKey.slice(1));
        setAddress(addressHex);

        // fetch balance
        const {
          data: { balance },
        } = await server.get(`balance/${addressHex}`);
        setBalance(balance);
      } catch (err) {
        console.error("Invalid private key:", err);
        setBalance(0);
        setAddress("");
      }
    } else {
      setAddress("");
      setBalance(0);
    }
  }


  return (
    <div className="container wallet">
      <h1>Your Wallet</h1>

      <label>
        Private Key (for testing)
        <input
          placeholder="Paste your private key"
          value={privateKey}
          onChange={onPrivateKeyChange}
        />
      </label>

      <label>
        Wallet Address
        <input
          placeholder="0x1..."
          value={address}
          onChange={onAddressChange}
        />
      </label>

      <div className="balance">Balance: {balance}</div>
    </div>
  );
}

export default Wallet;
