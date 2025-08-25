import React, { useState } from "react";
import { stellarService } from "@/lib/stellar";

export const FreighterTest: React.FC = () => {
  const [status, setStatus] = useState<string>("Ready to test");
  const [publicKey, setPublicKey] = useState<string>("");

  const testConnection = async () => {
    try {
      setStatus("Testing connection...");
      const isConnected = await stellarService.isWalletConnected();
      setStatus(`Connection test: ${isConnected ? "SUCCESS" : "FAILED"}`);
    } catch (error) {
      setStatus(`Connection error: ${error}`);
    }
  };

  const testGetPublicKey = async () => {
    try {
      setStatus("Getting public key...");
      const key = await stellarService.getPublicKey();
      if (key) {
        setPublicKey(key);
        setStatus(`Public key retrieved: ${key.substring(0, 8)}...`);
      } else {
        setStatus("No public key available");
      }
    } catch (error) {
      setStatus(`Public key error: ${error}`);
    }
  };

  const testAccountLoad = async () => {
    if (!publicKey) {
      setStatus("Please get public key first");
      return;
    }

    try {
      setStatus("Loading account...");
      const account = await stellarService.getAccount(publicKey);
      setStatus(`Account loaded: ${account.accountId}`);
    } catch (error) {
      setStatus(`Account load error: ${error}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Freighter API Test
      </h2>

      <div className="space-y-4">
        <div>
          <button
            onClick={testConnection}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Test Connection
          </button>
        </div>

        <div>
          <button
            onClick={testGetPublicKey}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Get Public Key
          </button>
        </div>

        <div>
          <button
            onClick={testAccountLoad}
            disabled={!publicKey}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            Load Account
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Status:</p>
          <p className="text-sm font-mono text-gray-800">{status}</p>
        </div>

        {publicKey && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Public Key:</p>
            <p className="text-sm font-mono text-blue-800 break-all">
              {publicKey}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

