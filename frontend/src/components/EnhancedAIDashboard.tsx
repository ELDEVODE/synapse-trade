"use client";

import React, { useState } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useOraclePrices } from "../hooks/useOraclePrices";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface EnhancedAIDashboardProps {
  className?: string;
}

// Interfaces for type safety
type OptimizationResult = {
  overallRisk: string;
  riskScore: number;
  diversificationScore: number;
  recommendations: Array<{
    action: string;
    asset: string;
    reasoning: string;
    priority: string;
  }>;
  newOpportunities: Array<{
    asset: string;
    suggestedSize: string;
    leverage: number;
    reasoning: string;
  }>;
};

type SentimentResult = {
  overallSentiment: string;
  riskLevel: string;
  marketOutlook: string;
  assets: Array<{
    asset: string;
    sentiment: string;
    score: number;
    confidence: number;
    keyFactors: string[];
    trend: string;
  }>;
};

interface AssetPerformance {
  asset: string;
  totalPnL: number;
  totalVolume: number;
  winRate: number;
  avgHoldTime: number;
  trades: number;
  sharpeRatio: number;
  profitFactor: number;
}

export const EnhancedAIDashboard: React.FC<EnhancedAIDashboardProps> = ({
  className = "",
}) => {
  const { publicKey } = useWallet();
  const { getAssetPrice } = useOraclePrices();
  
  // State
  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  // const [selectedTimeframe] = useState<string>("1d");
  const [riskProfile, setRiskProfile] = useState<string>("moderate");
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  // Convex queries for advanced analytics (with fallback handling)
  const riskMetrics = useQuery(api.analytics?.getRiskAnalysis, 
    publicKey ? { userPublicKey: publicKey } : "skip"
  );

  // Fallback data for when analytics functions are not available
  const fallbackMetrics = {
    sharpeRatio: 1.2,
    maxDrawdown: 15.5,
    winRate: 68.3,
    profitFactor: 1.8,
    avgHoldTime: 4.2,
    riskAdjustedReturn: 12.5,
    totalTrades: 45,
    totalVolume: 125000,
    avgTradeSize: 2777.78,
  };

  const fallbackAssetPerformance = [
    { asset: "BTC", totalPnL: 2500, totalVolume: 50000, winRate: 72, avgHoldTime: 3.5, trades: 15, sharpeRatio: 1.4, profitFactor: 2.1 },
    { asset: "ETH", totalPnL: 1800, totalVolume: 40000, winRate: 65, avgHoldTime: 4.8, trades: 20, sharpeRatio: 1.1, profitFactor: 1.6 },
    { asset: "SOL", totalPnL: 1200, totalVolume: 35000, winRate: 70, avgHoldTime: 2.9, trades: 10, sharpeRatio: 1.3, profitFactor: 1.9 },
  ];

  const fallbackRiskMetrics = {
    totalExposure: 125000,
    totalCollateral: 15000,
    exposureRatio: 8.33,
    avgLeverage: 3.2,
    maxLeverage: 5.0,
    var95: -2500,
    maxDrawdown: 15.5,
    sharpeRatio: 1.2,
    riskScore: 35,
  };

  // Convex actions for AI features
  const optimizePortfolio = useAction(api.ai.optimizePortfolio);
  const generateAdvancedSignal = useAction(api.ai.generateAdvancedTradingSignal);
  const analyzeSentiment = useAction(api.ai.analyzeMarketSentiment);
  const aiChat = useAction(api.ai.aiChat);

  // Mock positions for demonstration
  const mockPositions = [
    {
      positionId: "1",
      userPublicKey: publicKey || "",
      asset: "BTC",
      size: "0.1",
      collateral: "100",
      entryPrice: "112000",
      leverage: 2,
      timestamp: Date.now(),
      isOpen: true,
      lastUpdated: Date.now(),
    },
    {
      positionId: "2",
      userPublicKey: publicKey || "",
      asset: "ETH",
      size: "1.0",
      collateral: "200",
      entryPrice: "4000",
      leverage: 3,
      timestamp: Date.now(),
      isOpen: true,
      lastUpdated: Date.now(),
    },
  ];

  const handleAnalyzeAsset = async () => {
    if (!selectedAsset) return;

    setIsAnalyzing(true);
    try {
      const currentPrice = getAssetPrice(selectedAsset)?.price || "0";
      const signal = await generateAdvancedSignal({
        asset: selectedAsset,
        currentPrice,
        userPositions: mockPositions,
        marketConditions: { volatility: "medium", trend: "neutral" },
        timeHorizon: "short_term"
      });
      
      setAnalysisResult(
        `🤖 Advanced AI Analysis for ${selectedAsset}:\n\n` +
        `📊 Signal: ${signal.signal.toUpperCase()}\n` +
        `🎯 Confidence: ${(signal.confidence * 100).toFixed(1)}%\n` +
        `💰 Entry Price: $${signal.entryPrice}\n` +
        `🎯 Target Price: $${signal.targetPrice}\n` +
        `🛡️ Stop Loss: $${signal.stopLoss}\n` +
        `📏 Position Size: ${signal.positionSize} ${selectedAsset}\n` +
        `⚡ Leverage: ${signal.leverage}x\n` +
        `⏰ Time Horizon: ${signal.timeHorizon}\n` +
        `🔍 Reasoning: ${signal.reasoning}\n` +
        `⚠️ Risk Factors: ${signal.riskFactors.join(", ")}\n` +
        `🔗 Correlation Risk: ${signal.correlationRisk}`
      );
    } catch (error) {
      console.error("Failed to analyze asset:", error);
      setAnalysisResult("Failed to analyze asset. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimizePortfolio = async () => {
    if (!publicKey) return;
    
    setIsAnalyzing(true);
    try {
      const optimization = await optimizePortfolio({
        userPublicKey: publicKey,
        targetRisk: riskProfile,
        availableCapital: "1000", // Mock capital
        currentPositions: mockPositions
      });
      
      setAnalysisResult(
        `🎯 Portfolio Optimization Results:\n\n` +
        `📊 Overall Risk: ${optimization.overallRisk.toUpperCase()}\n` +
        `📈 Risk Score: ${optimization.riskScore}/100\n` +
        `🎲 Diversification Score: ${optimization.diversificationScore}/100\n\n` +
        `📋 Recommendations:\n` +
        optimization.recommendations.map((rec: OptimizationResult['recommendations'][0], i: number) => 
          `${i + 1}. ${rec.action} ${rec.asset} - ${rec.reasoning} (${rec.priority} priority)`
        ).join("\n") +
        `\n\n🚀 New Opportunities:\n` +
        optimization.newOpportunities.map((opp: OptimizationResult['newOpportunities'][0], i: number) => 
          `${i + 1}. ${opp.asset}: ${opp.suggestedSize} @ ${opp.leverage}x - ${opp.reasoning}`
        ).join("\n")
      );
    } catch (error) {
      console.error("Failed to optimize portfolio:", error);
      setAnalysisResult("Failed to optimize portfolio. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    setIsAnalyzing(true);
    try {
      const sentiment = await analyzeSentiment({
        assets: ["BTC", "ETH", "SOL"],
        includeNews: true,
        includeSocial: true
      });
      
      setAnalysisResult(
        `📊 Market Sentiment Analysis:\n\n` +
        `🌍 Overall Sentiment: ${sentiment.overallSentiment.toUpperCase()}\n` +
        `⚠️ Market Risk Level: ${sentiment.riskLevel.toUpperCase()}\n` +
        `📈 Market Outlook: ${sentiment.marketOutlook}\n\n` +
        `📊 Asset Breakdown:\n` +
        sentiment.assets.map((asset: SentimentResult['assets'][0]) => 
          `• ${asset.asset}: ${asset.sentiment.toUpperCase()} (${asset.score}/100) - ${asset.trend} trend\n  Confidence: ${(asset.confidence * 100).toFixed(1)}%\n  Key Factors: ${asset.keyFactors.join(", ")}`
        ).join("\n\n")
      );
    } catch (error) {
      console.error("Failed to analyze sentiment:", error);
      setAnalysisResult("Failed to analyze market sentiment. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !publicKey) return;

    const userMessage = { role: "user" as const, content: chatMessage };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage("");

    try {
      const response = await aiChat({
        userPublicKey: publicKey,
        sessionId: "main-session",
        message: chatMessage,
        context: {
          positions: mockPositions,
          currentAsset: selectedAsset,
          riskProfile: riskProfile
        }
      });
      
      const aiMessage = {
        role: "assistant" as const,
        content: response.response,
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = {
        role: "assistant" as const,
        content: "Sorry, I encountered an error. Please try again.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };

  if (!publicKey) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🤖</div>
          <p>Connect your wallet to access AI trading features</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-800 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-purple-400">
          🤖 AI Trading Assistant
        </h2>
        <button
          onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
        >
          {showAdvancedFeatures ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>

      {/* Advanced Analytics Dashboard */}
      {showAdvancedFeatures && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Performance Metrics */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Sharpe Ratio</h4>
            <div className="text-2xl font-bold text-green-400">
              {fallbackMetrics.sharpeRatio.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Win Rate</h4>
            <div className="text-2xl font-bold text-blue-400">
              {fallbackMetrics.winRate.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Max Drawdown</h4>
            <div className="text-2xl font-bold text-red-400">
              {fallbackMetrics.maxDrawdown.toFixed(1)}%
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-2">Risk Score</h4>
            <div className="text-2xl font-bold text-yellow-400">
              {(riskMetrics || fallbackRiskMetrics).riskScore.toFixed(0)}/100
            </div>
          </div>
        </div>
      )}

      {/* Asset Analysis */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4 text-white">Asset Analysis</h3>
        <div className="flex items-center space-x-4 mb-4">
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          >
            <option value="BTC">Bitcoin (BTC)</option>
            <option value="ETH">Ethereum (ETH)</option>
            <option value="SOL">Solana (SOL)</option>
          </select>
          <button
            onClick={handleAnalyzeAsset}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded transition-colors"
          >
            {isAnalyzing ? "Analyzing..." : "🤖 Advanced Analysis"}
          </button>
        </div>
      </div>

      {/* Advanced AI Features */}
      {showAdvancedFeatures && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 text-white">Advanced AI Features</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOptimizePortfolio}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded transition-colors"
            >
              {isAnalyzing ? "Optimizing..." : "🎯 Optimize Portfolio"}
            </button>
            
            <button
              onClick={handleAnalyzeSentiment}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded transition-colors"
            >
              {isAnalyzing ? "Analyzing..." : "📊 Market Sentiment"}
            </button>
            
            <select
              value={riskProfile}
              onChange={(e) => setRiskProfile(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 text-white">Analysis Results</h3>
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
              {analysisResult}
            </pre>
          </div>
        </div>
      )}

      {/* Asset Performance Breakdown */}
      {showAdvancedFeatures && fallbackAssetPerformance.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 text-white">Asset Performance</h3>
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="text-left p-3">Asset</th>
                  <th className="text-left p-3">PnL</th>
                  <th className="text-left p-3">Win Rate</th>
                  <th className="text-left p-3">Sharpe</th>
                  <th className="text-left p-3">Trades</th>
                </tr>
              </thead>
              <tbody>
                {fallbackAssetPerformance.map((asset: AssetPerformance) => (
                  <tr key={asset.asset} className="border-b border-gray-700/50">
                    <td className="p-3 font-mono">{asset.asset}</td>
                    <td className={`p-3 ${asset.totalPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${asset.totalPnL.toFixed(2)}
                    </td>
                    <td className="p-3">{asset.winRate.toFixed(1)}%</td>
                    <td className="p-3">{asset.sharpeRatio.toFixed(2)}</td>
                    <td className="p-3">{asset.trades}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Chat */}
      <div>
        <h3 className="text-lg font-medium mb-4 text-white">AI Chat Assistant</h3>
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {/* Chat History */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <div className="text-4xl mb-2">🤖</div>
                <p>Ask me about trading strategies, risk management, or market analysis!</p>
                <p className="text-sm mt-2">Try: &quot;What&apos;s the best strategy for BTC?&quot; or &quot;How should I manage risk?&quot;</p>
              </div>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300"
                    }`}
                  >
                    <div className="text-sm">{message.content}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask AI about trading strategies, risk management, or market analysis..."
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatMessage.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white rounded transition-colors"
              >
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              💡 Try: &quot;Analyze my portfolio risk&quot; or &quot;What&apos;s the market sentiment for BTC?&quot;
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
