"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
// import { stellarService } from "@/lib/stellar";

interface MarketData {
  asset: string;
  price: string;
  priceChange24h: string;
  volume24h: string;
  fundingRate: string;
  openInterest: string;
}

interface Position {
  positionId: string;
  asset: string;
  size: string;
  collateral: string;
  entryPrice: string;
  leverage: number;
  pnl: string;
  liquidationPrice: string;
  isOpen: boolean;
}

export default function TradingDashboard() {
  const { isConnected } = useWallet();
  const [markets] = useState<MarketData[]>([
    {
      asset: "BTC",
      price: "113,316.57",
      priceChange24h: "+2.45%",
      volume24h: "2.4B",
      fundingRate: "0.01%",
      openInterest: "45.2B",
    },
    {
      asset: "ETH",
      price: "4,132.74",
      priceChange24h: "+1.87%",
      volume24h: "1.8B",
      fundingRate: "0.02%",
      openInterest: "28.7B",
    },
    {
      asset: "SOL",
      price: "180.62",
      priceChange24h: "+5.23%",
      volume24h: "890M",
      fundingRate: "0.03%",
      openInterest: "12.4B",
    },
  ]);

  const [positions] = useState<Position[]>([]);
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"long" | "short">("long");
  const [size, setSize] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [collateral, setCollateral] = useState("");

  if (!isConnected) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Connect Your Wallet
        </h2>
        <p className="text-gray-600">
          Please connect your Stellar wallet to start trading perpetual futures.
        </p>
      </div>
    );
  }

  const handleOpenPosition = async () => {
    if (!size || !collateral) return;

    try {
      // This would call the smart contract
      console.log("Opening position:", {
        asset: selectedAsset,
        side,
        size,
        leverage,
        collateral,
        orderType,
      });

      // For now, just show a success message
      alert("Position opened successfully! (Demo mode)");
    } catch (error) {
      console.error("Error opening position:", error);
      alert("Error opening position");
    }
  };

  const handleClosePosition = async (positionId: string) => {
    try {
      // This would call the smart contract
      console.log("Closing position:", positionId);

      // For now, just show a success message
      alert("Position closed successfully! (Demo mode)");
    } catch (error) {
      console.error("Error closing position:", error);
      alert("Error closing position");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Synapse Trade</h1>
          <p className="text-gray-600 mt-2">
            Decentralized perpetual futures trading on Stellar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Markets Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Markets
              </h2>
              <div className="space-y-3">
                {markets.map((market) => (
                  <div
                    key={market.asset}
                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAsset === market.asset
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedAsset(market.asset)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-gray-700">
                          {market.asset}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {market.asset}
                        </div>
                        <div className="text-sm text-gray-500">
                          ${market.price}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          market.priceChange24h.startsWith("+")
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {market.priceChange24h}
                      </div>
                      <div className="text-sm text-gray-500">
                        Funding: {market.fundingRate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Trade
              </h2>

              {/* Asset Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset
                </label>
                <select
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {markets.map((market) => (
                    <option key={market.asset} value={market.asset}>
                      {market.asset}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderType("market")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      orderType === "market"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => setOrderType("limit")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      orderType === "limit"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>

              {/* Side Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Side
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSide("long")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      side === "long"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Long
                  </button>
                  <button
                    onClick={() => setSide("short")}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      side === "short"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size ({selectedAsset})
                </label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Leverage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leverage: {leverage}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>10x</span>
                </div>
              </div>

              {/* Collateral */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collateral (USDC)
                </label>
                <input
                  type="number"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Open Position Button */}
              <button
                onClick={handleOpenPosition}
                disabled={!size || !collateral}
                className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                  !size || !collateral
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : side === "long"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {side === "long" ? "Open Long" : "Open Short"} Position
              </button>
            </div>
          </div>
        </div>

        {/* Positions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Positions
            </h2>
            {positions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500">No open positions</p>
                <p className="text-sm text-gray-400">
                  Open your first position to get started
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Side
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entry Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leverage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PnL
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {positions.map((position) => (
                      <tr key={position.positionId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {position.asset}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {position.asset}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              parseFloat(position.size) > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {parseFloat(position.size) > 0 ? "Long" : "Short"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.abs(parseFloat(position.size)).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${parseFloat(position.entryPrice).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {position.leverage}x
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              parseFloat(position.pnl) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {parseFloat(position.pnl) >= 0 ? "+" : ""}$
                            {parseFloat(position.pnl).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() =>
                              handleClosePosition(position.positionId)
                            }
                            className="text-red-600 hover:text-red-900"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
