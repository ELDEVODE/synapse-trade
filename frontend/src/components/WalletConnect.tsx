'use client';

import { useWallet } from '@/hooks/useWallet';

export default function WalletConnect() {
  const { 
    isConnected, 
    publicKey, 
    isLoading, 
    error, 
    connect, 
    disconnect, 
    isFreighterInstalled 
  } = useWallet();

  if (!isFreighterInstalled) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Please install{' '}
          <a 
            href="https://freighter.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Freighter Wallet
          </a>
          {' '}to connect to Stellar
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Checking wallet connection...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 mb-2">Error: {error}</p>
        <button
          onClick={connect}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (isConnected && publicKey) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-800 font-medium">Wallet Connected</p>
            <p className="text-sm text-gray-600 mt-1">
              {`${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`}
            </p>
          </div>
          <button
            onClick={disconnect}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-center">
        <p className="text-blue-800 mb-3">Connect your Stellar wallet to get started</p>
        <button
          onClick={connect}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
}
