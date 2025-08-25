"use client";

import WalletConnect from "@/components/WalletConnect";
import { TradingDashboard } from "@/components/TradingDashboard";
import { useWallet } from "@/hooks/useWallet";

function HomeContent() {
  const { isConnected } = useWallet();

  if (isConnected) {
    return <TradingDashboard />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Synapse Trade
          </h1>
          <div className="text-sm text-gray-400">Stellar Testnet</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              Decentralized Perpetual Futures
            </h2>
            <p className="text-gray-400 text-lg">
              Trade leveraged crypto positions on Stellar with real-time oracle
              pricing
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <WalletConnect />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-semibold">Up to 10x</div>
              <div className="text-sm text-gray-400">Leverage</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-semibold">Real-time</div>
              <div className="text-sm text-gray-400">Oracle Prices</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-4">
              <div className="text-purple-400 font-semibold">Low Cost</div>
              <div className="text-sm text-gray-400">Stellar Network</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
