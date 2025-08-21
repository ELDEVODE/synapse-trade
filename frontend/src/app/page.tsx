"use client";

// import Image from "next/image";
import WalletConnect from "@/components/WalletConnect";
import TradingDashboard from "@/components/TradingDashboard";
import { useWallet } from "@/hooks/useWallet";

function HomeContent() {
  const { isConnected } = useWallet();

  return (
    <div className="font-sans min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Synapse</h1>
              <p className="text-gray-600 mt-1">
                Stellar DApp with Convex Backend
              </p>
            </div>
            <div className="w-80">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isConnected ? (
          <TradingDashboard />
        ) : (
          <div className="text-center py-12">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to Synapse Trade
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Decentralized perpetual futures trading on Stellar with
                real-time data powered by Convex
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Perpetual Futures
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Trade leveraged long and short positions on major
                    cryptocurrencies
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Reflector Oracle
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Secure, real-time price data from trusted sources for
                    accurate trading
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Real-time Analytics
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Monitor positions, PnL, and market data with live updates
                    powered by Convex
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-3 justify-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    Stellar SDK
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Convex
                  </span>
                  <span className="px-3 py-1 bg-black text-white rounded-full text-sm">
                    Next.js
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    TypeScript
                  </span>
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm">
                    Tailwind CSS
                  </span>
                </div>
                <div className="mt-6 space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Contracts:</strong>{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      ../contracts/
                    </code>
                  </p>
                  <p>
                    <strong>Frontend:</strong>{" "}
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      ./frontend/
                    </code>
                  </p>
                  <p>
                    <strong>Database:</strong> Convex (real-time, serverless)
                  </p>
                  <p>
                    <strong>Network:</strong> Stellar Testnet
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
