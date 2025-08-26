"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useWallet } from "../hooks/useWallet";
import { contractService } from "../lib/contracts";
import { TestnetService } from "../lib/testnet";
import { useOraclePrices } from "../hooks/useOraclePrices";

interface Position {
  id: string;
  asset: string;
  side: "LONG" | "SHORT";
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercent: number;
  collateral: string;
  leverage: number;
  margin: string;
  liquidationPrice: string;
}

// MarketData interface moved to useOraclePrices hook

export const TradingDashboard: React.FC = () => {
  const { publicKey, isConnected, disconnect } = useWallet();
  const {
    marketData,
    isLoading: pricesLoading,
    error: pricesError,
    refreshPrices,
    getAssetPrice,
  } = useOraclePrices();
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [orderSide, setOrderSide] = useState<"LONG" | "SHORT">("LONG");
  const [orderSize, setOrderSize] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [collateral, setCollateral] = useState("");
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [accountBalance, setAccountBalance] = useState<string | null>(null);
  const [isFunding, setIsFunding] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  // Get selected market data from oracle
  const selectedMarket = getAssetPrice(selectedAsset) || marketData[0];

  // Calculate total portfolio PnL
  const portfolioPnL = useMemo(() => {
    const totalPnL = positions.reduce((sum, position) => {
      return sum + parseFloat(position.pnl);
    }, 0);

    const totalValue = positions.reduce((sum, position) => {
      return sum + parseFloat(position.entryPrice) * parseFloat(position.size);
    }, 0);

    const pnlPercent = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

    return {
      value: totalPnL.toFixed(2),
      percent: pnlPercent.toFixed(2),
    };
  }, [positions]);

  const loadAccountData = useCallback(async () => {
    if (!publicKey) return;
    try {
      // Load account balance
      const balance = await TestnetService.getAccountBalance(publicKey);
      setAccountBalance(balance);
    } catch (error) {
      console.error("Error loading account data:", error);
    }
  }, [publicKey]);

  const calculatePositionPnL = useCallback(
    (position: { entryPrice: string; size: string }, currentPrice: number) => {
      const entryPrice = parseFloat(position.entryPrice);
      const size = parseFloat(position.size);
      const isLong = size > 0;

      let pnlValue: number;
      if (isLong) {
        // Long position: profit when price goes up
        pnlValue = (currentPrice - entryPrice) * Math.abs(size);
      } else {
        // Short position: profit when price goes down
        pnlValue = (entryPrice - currentPrice) * Math.abs(size);
      }

      const pnlPercent = (pnlValue / (entryPrice * Math.abs(size))) * 100;

      return {
        pnl: pnlValue.toFixed(2),
        pnlPercent: pnlPercent,
      };
    },
    []
  );

  const calculateLiquidationPrice = useCallback(
    (position: {
      entryPrice: string;
      size: string;
      collateral: string;
      leverage: number;
    }) => {
      const entryPrice = parseFloat(position.entryPrice);
      const collateral = parseFloat(position.collateral);
      const size = parseFloat(position.size);
      const isLong = size > 0;

      // Simple liquidation calculation (actual would be more complex)
      const maintenanceMargin = 0.05; // 5% maintenance margin
      const liquidationBuffer = collateral * maintenanceMargin;

      let liquidationPrice: number;
      if (isLong) {
        // Long liquidation: when losses exceed collateral minus maintenance margin
        liquidationPrice = entryPrice - liquidationBuffer / Math.abs(size);
      } else {
        // Short liquidation: when losses exceed collateral minus maintenance margin
        liquidationPrice = entryPrice + liquidationBuffer / Math.abs(size);
      }

      return Math.max(0, liquidationPrice).toFixed(2);
    },
    []
  );

  const loadPositions = useCallback(async () => {
    if (!publicKey) return;
    try {
      const contractPositions =
        await contractService.getUserPositions(publicKey);

      // Convert contract positions to UI format with live PnL calculations
      const uiPositions: Position[] = contractPositions.map((p) => {
        const assetPrice = getAssetPrice(p.asset);
        const currentPrice = assetPrice
          ? parseFloat(assetPrice.price.replace(",", ""))
          : 0;

        const pnlData = calculatePositionPnL(p, currentPrice);
        const liquidationPrice = calculateLiquidationPrice(p);

        return {
          id: p.id,
          asset: p.asset,
          side: parseFloat(p.size) > 0 ? "LONG" : "SHORT",
          size: Math.abs(parseFloat(p.size)).toString(),
          entryPrice: p.entryPrice,
          markPrice: currentPrice.toString(),
          pnl: pnlData.pnl,
          pnlPercent: pnlData.pnlPercent,
          collateral: p.collateral,
          leverage: p.leverage,
          margin: (parseFloat(p.collateral) / p.leverage).toString(),
          liquidationPrice,
        };
      });

      setPositions(uiPositions);
    } catch (error) {
      console.error("Error loading positions:", error);
    }
  }, [
    publicKey,
    getAssetPrice,
    calculatePositionPnL,
    calculateLiquidationPrice,
  ]);

  useEffect(() => {
    if (isConnected && publicKey) {
      loadAccountData();
      loadPositions();
    }
  }, [isConnected, publicKey, loadAccountData, loadPositions]);

  // Test connectivity on mount
  useEffect(() => {
    const testConnectivity = async () => {
      console.log("🚀 Testing oracle and contract connectivity...");

      // Test oracle connectivity
      const oracleTest = await import("../lib/oracle").then((module) =>
        module.OracleService.testConnection()
      );
      console.log(
        `📊 Oracle connectivity: ${oracleTest ? "✅ Connected" : "❌ Failed"}`
      );

      // Test contract connectivity
      const contractTest = await contractService.testConnection();
      console.log(
        `📋 Contract connectivity: ${contractTest ? "✅ Connected" : "❌ Failed"}`
      );
    };

    testConnectivity();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest(".wallet-dropdown")) {
          setWalletDropdownOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [walletDropdownOpen]);

  const handleOpenPosition = async () => {
    console.log("🎯 handleOpenPosition called with:", {
      orderSize,
      collateral,
      selectedAsset,
      orderSide,
      leverage,
      accountBalance,
    });

    if (!orderSize || !collateral) {
      setTxStatus("Please enter position size and collateral");
      return;
    }

    const sizeNum = parseFloat(orderSize);
    const collateralNum = parseFloat(collateral);
    const currentBalance = parseFloat(accountBalance || "0");

    console.log("📊 Parsed values:", {
      sizeNum,
      collateralNum,
      currentBalance,
    });

    // Validation for 1000 XLM balance
    if (collateralNum > currentBalance * 0.9) {
      // Leave 10% for fees
      setTxStatus(
        `Insufficient balance. Max collateral: ${(currentBalance * 0.9).toFixed(2)} XLM`
      );
      return;
    }

    if (collateralNum < 10) {
      // Minimum 10 XLM
      setTxStatus("Minimum collateral is 10 XLM");
      return;
    }

    if (sizeNum <= 0) {
      setTxStatus("Position size must be greater than 0");
      return;
    }

    setIsLoading(true);
    setTxStatus("Opening position...");

    try {
      console.log(`🚀 Opening ${orderSide} position:`, {
        asset: selectedAsset,
        size: sizeNum,
        collateral: collateralNum,
        leverage,
        balance: currentBalance,
      });

      // Convert to contract format (keeping precision for small amounts)
      const sizeInContract = (sizeNum * 10_000_000).toString(); // 7 decimals for precision
      const collateralInContract = (collateralNum * 10_000_000).toString(); // 7 decimals

      console.log("🔧 Contract call parameters:", {
        selectedAsset,
        sizeInContract,
        collateralInContract,
        leverage,
        isLong: orderSide === "LONG",
      });

      const txHash = await contractService.openPosition(
        selectedAsset,
        sizeInContract,
        leverage,
        collateralInContract,
        orderSide === "LONG"
      );

      setTxStatus(`✅ Position opened! Tx: ${txHash.slice(0, 16)}...`);

      // Refresh data
      await Promise.all([loadPositions(), loadAccountData()]);

      // Clear form
      setOrderSize("");
      setCollateral("");

      console.log("✅ Position opened successfully:", txHash);
    } catch (error) {
      console.error("❌ Error opening position:", error);

      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;

        // Improve error messages for common issues
        if (errorMessage.includes("insufficient")) {
          errorMessage = "Insufficient balance for this position";
        } else if (errorMessage.includes("not connected")) {
          errorMessage = "Please connect your wallet first";
        } else if (errorMessage.includes("contract")) {
          errorMessage = "Smart contract error - try reducing position size";
        } else if (errorMessage.includes("network")) {
          errorMessage = "Network error - please try again";
        } else if (errorMessage.includes("fee")) {
          errorMessage = "Insufficient XLM for transaction fees";
        }
      }

      setTxStatus(`❌ Failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePosition = async (positionId: string) => {
    console.log("🔒 handleClosePosition called with:", { positionId });

    setIsLoading(true);
    setTxStatus(`Closing position ${positionId}...`);

    try {
      console.log("🔧 Calling contractService.closePosition...");
      const txHash = await contractService.closePosition(positionId);
      console.log("✅ Close position result:", { txHash });
      setTxStatus(`Position closed! Tx: ${txHash.slice(0, 16)}...`);
      await loadPositions(); // Refresh positions
    } catch (error) {
      console.error("❌ Error closing position:", error);
      setTxStatus(
        `Failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundAccount = async () => {
    if (!publicKey) return;

    setIsFunding(true);
    setTxStatus("Funding account from Friendbot...");

    try {
      const result = await TestnetService.fundAccount(publicKey);

      if (result.error) {
        setTxStatus(`Funding failed: ${result.error}`);
      } else {
        setTxStatus(`Account funded! Tx: ${result.hash.slice(0, 16)}...`);
        // Refresh account balance
        await loadAccountData();
      }
    } catch (error) {
      setTxStatus(
        `Funding failed: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsFunding(false);
    }
  };

  const handleCopyAddress = async () => {
    if (!publicKey) return;

    try {
      await navigator.clipboard.writeText(publicKey);
      setTxStatus("Address copied to clipboard!");
      setTimeout(() => setTxStatus(null), 3000);
    } catch {
      setTxStatus("Failed to copy address");
      setTimeout(() => setTxStatus(null), 3000);
    }
    setWalletDropdownOpen(false);
  };

  const handleViewOnExplorer = () => {
    if (!publicKey) return;

    const explorerUrl = `https://stellar.expert/explorer/testnet/account/${publicKey}`;
    window.open(explorerUrl, "_blank", "noopener,noreferrer");
    setWalletDropdownOpen(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setWalletDropdownOpen(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Synapse Trade
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Connect your wallet to start trading perpetual futures
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
              Synapse Trade
            </h1>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Balance:</span>
                <span className="text-lg font-mono text-white">
                  {accountBalance ? `${accountBalance} XLM` : "Loading..."}
                </span>
                {accountBalance && parseFloat(accountBalance) > 0 && (
                  <span className="text-green-400">✓</span>
                )}
              </div>

              {/* Portfolio PnL */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Total PnL:</span>
                <span
                  className={`text-lg font-mono ${parseFloat(portfolioPnL.value) >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ${portfolioPnL.value}
                </span>
                <span
                  className={`text-sm ${parseFloat(portfolioPnL.percent) >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  ({parseFloat(portfolioPnL.percent) >= 0 ? "+" : ""}
                  {portfolioPnL.percent}%)
                </span>
              </div>

              {/* Oracle Status */}
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${pricesError ? "bg-red-400" : pricesLoading ? "bg-yellow-400" : "bg-green-400"}`}
                ></div>
                <span className="text-gray-400 text-xs">
                  {pricesError
                    ? "Oracle Error"
                    : pricesLoading
                      ? "Updating..."
                      : "Live Prices"}
                </span>
                <button
                  onClick={refreshPrices}
                  className="text-gray-400 hover:text-white text-xs underline"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleFundAccount}
              disabled={isFunding}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded text-sm transition-colors"
            >
              {isFunding ? "Funding..." : "Fund Testnet"}
            </button>

            {/* Wallet Dropdown */}
            <div className="relative wallet-dropdown">
              <button
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="font-mono">
                  {publicKey?.slice(0, 6)}...{publicKey?.slice(-6)}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${walletDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {walletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">
                      Connected Wallet
                    </div>
                    <div className="text-sm font-mono text-white break-all">
                      {publicKey}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Balance:{" "}
                      {accountBalance ? `${accountBalance} XLM` : "Loading..."}
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={handleCopyAddress}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy Address</span>
                    </button>

                    <button
                      onClick={handleViewOnExplorer}
                      className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      <span>View on Explorer</span>
                    </button>

                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <button
                        onClick={handleDisconnect}
                        className="w-full px-4 py-2 text-left hover:bg-gray-700 transition-colors flex items-center space-x-2 text-red-400"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Disconnect Wallet</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar - Market List */}
        <div className="w-80 bg-gray-900 border-r border-gray-800 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4 text-purple-400">
              Markets
            </h2>
            <div className="space-y-2">
              {marketData.map((market) => (
                <div
                  key={market.symbol}
                  onClick={() => setSelectedAsset(market.symbol)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAsset === market.symbol
                      ? "bg-purple-600/20 border border-purple-500/30"
                      : "bg-gray-800/50 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">
                          {market.symbol}-PERP
                        </span>
                        {market.isStale && (
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">Perpetual</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">${market.price}</div>
                      <div
                        className={`text-sm ${market.change24h >= 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {market.change24h >= 0 ? "+" : ""}
                        {market.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Market Info Bar */}
          <div className="bg-gray-900 border-b border-gray-800 p-4">
            <div className="flex items-center space-x-8">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-400">Mark Price</div>
                  {selectedMarket?.isStale && (
                    <div className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                      STALE
                    </div>
                  )}
                </div>
                <div className="text-2xl font-mono">
                  ${selectedMarket?.price || "0.00"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">24h Change</div>
                <div
                  className={`text-lg ${(selectedMarket?.change24h || 0) >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {(selectedMarket?.change24h || 0) >= 0 ? "+" : ""}
                  {(selectedMarket?.change24h || 0).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">24h Volume</div>
                <div className="text-lg">
                  ${selectedMarket?.volume24h || "0"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">24h High</div>
                <div className="text-lg">
                  ${selectedMarket?.high24h || "0.00"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">24h Low</div>
                <div className="text-lg">
                  ${selectedMarket?.low24h || "0.00"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1">
            {/* Chart Area */}
            <div className="flex-1 p-6">
              <div className="bg-gray-900 rounded-lg h-96 flex items-center justify-center border border-gray-800">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">📊</div>
                  <div className="text-gray-400">Price Chart</div>
                  <div className="text-sm text-gray-500 mt-1">Coming Soon</div>
                </div>
              </div>

              {/* Positions Table */}
              <div className="mt-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="text-lg font-semibold text-purple-400">
                      Open Positions
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-sm">
                          <th className="text-left p-4">Asset</th>
                          <th className="text-left p-4">Side</th>
                          <th className="text-left p-4">Size</th>
                          <th className="text-left p-4">Entry Price</th>
                          <th className="text-left p-4">Mark Price</th>
                          <th className="text-left p-4">PnL</th>
                          <th className="text-left p-4">Margin</th>
                          <th className="text-left p-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.length === 0 ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="text-center p-8 text-gray-400"
                            >
                              No open positions
                            </td>
                          </tr>
                        ) : (
                          positions.map((position) => (
                            <tr
                              key={position.id}
                              className="border-b border-gray-800/50 hover:bg-gray-800/30"
                            >
                              <td className="p-4 font-mono">
                                {position.asset}-PERP
                              </td>
                              <td className="p-4">
                                <span
                                  className={`px-2 py-1 rounded text-xs ${
                                    position.side === "LONG"
                                      ? "bg-green-600/20 text-green-400"
                                      : "bg-red-600/20 text-red-400"
                                  }`}
                                >
                                  {position.side}
                                </span>
                              </td>
                              <td className="p-4 font-mono">{position.size}</td>
                              <td className="p-4 font-mono">
                                ${position.entryPrice}
                              </td>
                              <td className="p-4 font-mono">
                                ${position.markPrice}
                              </td>
                              <td className="p-4">
                                <div
                                  className={`${position.pnlPercent >= 0 ? "text-green-400" : "text-red-400"}`}
                                >
                                  ${position.pnl} (
                                  {position.pnlPercent.toFixed(2)}%)
                                </div>
                              </td>
                              <td className="p-4 font-mono">
                                ${position.margin}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() =>
                                    handleClosePosition(position.id)
                                  }
                                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                                  disabled={isLoading}
                                >
                                  Close
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Trading Panel */}
            <div className="w-80 bg-gray-900 border-l border-gray-800 p-6">
              <h3 className="text-lg font-semibold mb-6 text-purple-400">
                Place Order
              </h3>

              {/* Long/Short Toggle */}
              <div className="mb-6">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setOrderSide("LONG")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                      orderSide === "LONG"
                        ? "bg-green-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    LONG
                  </button>
                  <button
                    onClick={() => setOrderSide("SHORT")}
                    className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                      orderSide === "SHORT"
                        ? "bg-red-600 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    SHORT
                  </button>
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Size ({selectedAsset})
                  </label>
                  <input
                    type="number"
                    step={
                      selectedAsset === "BTC"
                        ? "0.001"
                        : selectedAsset === "ETH"
                          ? "0.01"
                          : "0.1"
                    }
                    value={orderSize}
                    onChange={(e) => setOrderSize(e.target.value)}
                    placeholder={
                      selectedAsset === "BTC"
                        ? "0.01"
                        : selectedAsset === "ETH"
                          ? "0.1"
                          : "1.0"
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Min:{" "}
                    {selectedAsset === "BTC"
                      ? "0.001"
                      : selectedAsset === "ETH"
                        ? "0.01"
                        : "0.1"}{" "}
                    {selectedAsset}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Leverage
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-8">{leverage}x</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Collateral (XLM)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max={
                      accountBalance
                        ? Math.floor(parseFloat(accountBalance) * 0.9)
                        : 900
                    }
                    value={collateral}
                    onChange={(e) => setCollateral(e.target.value)}
                    placeholder="50"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>
                      Min: 10 XLM | Available: {accountBalance || "0"} XLM
                    </span>
                    <div className="space-x-1">
                      <button
                        onClick={() => setCollateral("50")}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                        type="button"
                      >
                        50
                      </button>
                      <button
                        onClick={() => setCollateral("100")}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                        type="button"
                      >
                        100
                      </button>
                      <button
                        onClick={() =>
                          setCollateral(
                            accountBalance
                              ? Math.floor(
                                  parseFloat(accountBalance) * 0.5
                                ).toString()
                              : "400"
                          )
                        }
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                        type="button"
                      >
                        50%
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleOpenPosition}
                  disabled={isLoading || !orderSize || !collateral}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    orderSide === "LONG"
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-green-600/50"
                      : "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50"
                  } disabled:cursor-not-allowed`}
                >
                  {isLoading ? "Processing..." : `Open ${orderSide} Position`}
                </button>
              </div>

              {txStatus && (
                <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-300">{txStatus}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
