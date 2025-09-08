"use client";

import { useWallet } from "@/providers/WalletProvider";

export default function WalletConnect() {
  const {
    isConnected,
    publicKey,
    isLoading,
    error,
    connect,
    disconnect,
    isFreighterInstalled,
  } = useWallet();

  if (!isFreighterInstalled) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-400">
          Please install{" "}
          <a
            href="https://freighter.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Freighter Wallet
          </a>{" "}
          to connect to Stellar
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center space-x-2 text-white p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
        <span>Checking wallet connection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <p className="text-red-400 mb-3 text-sm">Error: {error}</p>
        <button
          onClick={connect}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-400 font-medium">Wallet Connected</p>
            <p className="text-sm text-gray-400 mt-1 font-mono">
              {`${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`}
            </p>
          </div>
          <button
            onClick={disconnect}
            className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-gray-400 mb-4">
        Connect your Stellar wallet to start trading
      </p>
      <button
        onClick={connect}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all font-medium"
      >
        Connect Freighter Wallet
      </button>
    </div>
  );
}
