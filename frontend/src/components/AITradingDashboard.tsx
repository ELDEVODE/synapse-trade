import React, { useState } from "react";
import { useAIServices } from "../hooks/useAIServices";
import { useWallet } from "@/providers/WalletProvider";
import {
  MarketData,
  TradingSignal,
  AIInsight,
  Position,
} from "../types/trading";

interface AITradingDashboardProps {
  className?: string;
}

export const AITradingDashboard: React.FC<AITradingDashboardProps> = ({
  className = "",
}) => {
  const { publicKey } = useWallet();
  const {
    marketData,
    tradingSignals,
    aiInsights,
    sendMessage,
    getAssetSignal,
    analyzePortfolio,
    analyzeMarket,
    getRiskAdvice,
    isLoading,
  } = useAIServices(publicKey || undefined);

  const [selectedAsset, setSelectedAsset] = useState<string>("BTC");
  const [chatMessage, setChatMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");

  // Mock positions for demonstration
  const mockPositions: Position[] = [
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

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !publicKey) return;

    const userMessage = { role: "user" as const, content: chatMessage };
    setChatHistory((prev) => [...prev, userMessage]);
    setChatMessage("");

    try {
      const response = await sendMessage(chatMessage, {
        positions: mockPositions,
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

  const handleAnalyzeAsset = async () => {
    if (!selectedAsset) return;

    setIsAnalyzing(true);
    try {
      const signal = await getAssetSignal(selectedAsset);
      setAnalysisResult(
        `AI Trading Signal for ${selectedAsset}:\n\nSignal: ${signal.signal}\nConfidence: ${(signal.confidence * 100).toFixed(1)}%\nReasoning: ${signal.reasoning}\nTime Horizon: ${signal.timeHorizon}`
      );
    } catch (error) {
      setAnalysisResult(`Failed to analyze ${selectedAsset}: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePortfolioAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzePortfolio(mockPositions);
      setAnalysisResult(analysis.response);
    } catch (error) {
      setAnalysisResult(`Failed to analyze portfolio: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMarketAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeMarket();
      setAnalysisResult(analysis.response);
    } catch (error) {
      setAnalysisResult(`Failed to analyze market: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRiskAdvice = async () => {
    setIsAnalyzing(true);
    try {
      const advice = await getRiskAdvice();
      setAnalysisResult(advice.response);
    } catch (error) {
      setAnalysisResult(`Failed to get risk advice: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Trading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 ${className}`}>
      {/* Left Column - Market Data & AI Signals */}
      <div className="space-y-6">
        {/* Market Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Market Overview
          </h2>
          <div className="space-y-3">
            {marketData?.slice(0, 5).map((asset: MarketData) => (
              <div
                key={asset.asset}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-gray-800">
                    {asset.asset}
                  </span>
                  <span className="text-sm text-gray-600">
                    ${parseFloat(asset.price).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  {asset.priceChange24h && (
                    <span
                      className={`text-sm ${parseFloat(asset.priceChange24h) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {parseFloat(asset.priceChange24h) >= 0 ? "+" : ""}
                      {asset.priceChange24h}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Trading Signals */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            AI Trading Signals
          </h2>
          <div className="space-y-3">
            {tradingSignals
              ?.slice(0, 3)
              .map((signal: TradingSignal, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-800">
                        {signal.asset}
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          signal.signal === "strong_buy"
                            ? "bg-green-100 text-green-800"
                            : signal.signal === "buy"
                              ? "bg-green-50 text-green-700"
                              : signal.signal === "hold"
                                ? "bg-yellow-100 text-yellow-800"
                                : signal.signal === "sell"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-red-100 text-red-800"
                        }`}
                      >
                        {signal.signal.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {(signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {signal.reasoning}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* AI Analysis Tools */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            AI Analysis Tools
          </h2>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {marketData?.map((asset: MarketData) => (
                  <option key={asset.asset} value={asset.asset}>
                    {asset.asset}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAnalyzeAsset}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePortfolioAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                Portfolio Analysis
              </button>
              <button
                onClick={handleMarketAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
              >
                Market Analysis
              </button>
            </div>

            <button
              onClick={handleRiskAdvice}
              disabled={isAnalyzing}
              className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
            >
              Get Risk Advice
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - AI Chat & Analysis Results */}
      <div className="space-y-6">
        {/* AI Chat Interface */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            AI Trading Assistant
          </h2>
          <div className="h-64 overflow-y-auto mb-4 p-3 bg-gray-50 rounded-lg">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Ask me anything about trading, risk management, or market
                analysis!
              </p>
            ) : (
              chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`mb-3 ${message.role === "user" ? "text-right" : "text-left"}`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg max-w-xs ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about trading strategies, risk management..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            AI Analysis Results
          </h2>
          {analysisResult ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {analysisResult}
              </pre>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Use the analysis tools to get AI insights about your positions and
              the market.
            </p>
          )}
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            AI Insights
          </h2>
          <div className="space-y-3">
            {aiInsights
              ?.slice(0, 3)
              .map((insight: AIInsight, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-yellow-800 capitalize">
                      {insight.type.replace("_", " ")}
                    </span>
                    {insight.confidence && (
                      <span className="text-xs text-yellow-600">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-yellow-700">{insight.content}</p>
                </div>
              ))}
            {(!aiInsights || aiInsights.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                No AI insights available yet. Start trading to get personalized
                insights!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
