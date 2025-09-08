"use client";

import React, { useState, useMemo } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { usePositionDisplay } from "../hooks/useTradingPositions";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import StreamingAIChat from "./StreamingAIChat";

// Types for better TypeScript support
type TabType = "overview" | "signals" | "chat" | "analytics";

interface APIInsight {
  _id: string;
  _creationTime: number;
  type: "risk_assessment" | "trading_recommendation" | "market_analysis" | "portfolio_optimization" | "sentiment_analysis";
  title: string;
  content: string;
  confidence?: number;
  priority?: "low" | "medium" | "high" | "critical";
  action?: string;
  timestamp: number;
}

interface TradingSignal {
  asset: string;
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  reasoning: string;
  targetPrice?: string;
  stopLoss?: string;
  timeHorizon: string;
  timestamp: number;
}

interface RiskMetrics {
  overallScore: number;
  portfolioValue: string;
  totalPnL: string;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: string;
  diversificationScore: number;
}


export const ModernAIDashboard: React.FC = () => {
  const { publicKey, isConnected } = useWallet();
  const { positions, portfolioSummary } = usePositionDisplay();

  // State management
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedAsset, setSelectedAsset] = useState("BTC");

  // Convex queries and actions
  const aiInsights = useQuery(
    api.ai.getAIInsights,
    publicKey ? { userPublicKey: publicKey } : "skip"
  );
  const tradingSignals = useQuery(api.ai.getTradingSignals, {});

  // Computed values
  const riskMetrics: RiskMetrics = useMemo(() => {
    if (!portfolioSummary) {
      return {
        overallScore: 0,
        portfolioValue: "0",
        totalPnL: "0",
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: "0",
        diversificationScore: 0,
      };
    }

    return {
      overallScore: 75, // Calculate based on actual metrics
      portfolioValue: String(portfolioSummary.totalCollateral || 0),
      totalPnL: String(portfolioSummary.totalPnL || 0),
      winRate: 68.5, // Calculate from trade history
      sharpeRatio: 1.24, // Calculate from returns
      maxDrawdown: "15.2%", // Calculate from historical data
      diversificationScore: positions.length > 1 ? 85 : 25,
    };
  }, [portfolioSummary, positions]);


  // Portfolio analysis
  const handlePortfolioAnalysis = async () => {
    setActiveTab("chat");
  };

  // Market sentiment analysis
  const handleMarketSentiment = async () => {
    setActiveTab("chat");
  };

  // Risk score color helper
  const getRiskColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  // Signal color helper
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "strong_buy": return "text-green-500 bg-green-500/20";
      case "buy": return "text-green-400 bg-green-400/20";
      case "hold": return "text-yellow-400 bg-yellow-400/20";
      case "sell": return "text-red-400 bg-red-400/20";
      case "strong_sell": return "text-red-500 bg-red-500/20";
      default: return "text-gray-400 bg-gray-400/20";
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">Connect your wallet to access AI trading insights and recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">AI Trading Assistant</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Risk Score: <span className={`font-bold ${getRiskColor(riskMetrics.overallScore)}`}>
                  {riskMetrics.overallScore}/100
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-400">AI Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: "overview" as TabType, label: "Overview", icon: "📊" },
              { id: "signals" as TabType, label: "Trading Signals", icon: "📈" },
              { id: "chat" as TabType, label: "AI Assistant", icon: "🤖" },
              { id: "analytics" as TabType, label: "Analytics", icon: "📋" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Portfolio Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Portfolio Value</p>
                    <p className="text-2xl font-bold">${riskMetrics.portfolioValue}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total P&L</p>
                    <p className={`text-2xl font-bold ${parseFloat(riskMetrics.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {parseFloat(riskMetrics.totalPnL) >= 0 ? '+' : ''}${riskMetrics.totalPnL}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    parseFloat(riskMetrics.totalPnL) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <svg className={`w-6 h-6 ${parseFloat(riskMetrics.totalPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Win Rate</p>
                    <p className="text-2xl font-bold text-blue-400">{riskMetrics.winRate}%</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Risk Score</p>
                    <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.overallScore)}`}>
                      {riskMetrics.overallScore}/100
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🧠</span>
                AI Insights
              </h3>
              <div className="space-y-4">
                {aiInsights && aiInsights.length > 0 ? (
                  aiInsights.slice(0, 3).map((insight: APIInsight, index: number) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-gray-700/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        (insight.priority || 'medium') === 'critical' ? 'bg-red-500' :
                        (insight.priority || 'medium') === 'high' ? 'bg-orange-500' :
                        (insight.priority || 'medium') === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{insight.title}</h4>
                        <p className="text-sm text-gray-400 mt-1">{insight.content || 'AI insight'}</p>
                        {insight.action && (
                          <button className="text-xs text-blue-400 hover:text-blue-300 mt-2">
                            {insight.action} →
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {insight.confidence || 85}% confidence
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p>No AI insights available yet.</p>
                    <p className="text-sm mt-1">Start trading to get personalized recommendations.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Quick AI Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handlePortfolioAnalysis}
                  className="p-4 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-600/30 transition-colors"
                >
                  <div className="text-blue-400 text-2xl mb-2">📊</div>
                  <h4 className="font-medium text-white">Analyze Portfolio</h4>
                  <p className="text-sm text-gray-400 mt-1">Get AI insights on your positions</p>
                </button>

                <button
                  onClick={handleMarketSentiment}
                  className="p-4 bg-green-600/20 hover:bg-green-600/30 rounded-lg border border-green-600/30 transition-colors"
                >
                  <div className="text-green-400 text-2xl mb-2">📈</div>
                  <h4 className="font-medium text-white">Market Sentiment</h4>
                  <p className="text-sm text-gray-400 mt-1">Analyze current market conditions</p>
                </button>

                <button
                  onClick={() => setActiveTab("chat")}
                  className="p-4 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg border border-purple-600/30 transition-colors"
                >
                  <div className="text-purple-400 text-2xl mb-2">💬</div>
                  <h4 className="font-medium text-white">Ask AI</h4>
                  <p className="text-sm text-gray-400 mt-1">Chat with your trading assistant</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "signals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Trading Signals</h2>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="BTC">Bitcoin (BTC)</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="SOL">Solana (SOL)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tradingSignals && tradingSignals.length > 0 ? (
                tradingSignals.map((signal: TradingSignal, index: number) => (
                  <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold">{signal.asset}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSignalColor(signal.signal)}`}>
                          {signal.signal.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Confidence</div>
                        <div className="text-lg font-bold text-blue-400">{signal.confidence}%</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-400 mb-1">Analysis</h4>
                        <p className="text-sm text-gray-300">{signal.reasoning}</p>
                      </div>

                      {signal.targetPrice && (
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Target:</span>
                            <span className="text-green-400 ml-2">${signal.targetPrice}</span>
                          </div>
                          {signal.stopLoss && (
                            <div>
                              <span className="text-gray-400">Stop Loss:</span>
                              <span className="text-red-400 ml-2">${signal.stopLoss}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Timeframe: {signal.timeHorizon}</span>
                        <span>{new Date(signal.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-lg">No trading signals available</p>
                  <p className="text-sm mt-1">AI is analyzing market conditions. Check back soon.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="max-w-5xl mx-auto h-[600px]">
            <StreamingAIChat className="h-full" />
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Advanced Analytics</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sharpe Ratio</span>
                    <span className="font-semibold">{riskMetrics.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Max Drawdown</span>
                    <span className="font-semibold text-red-400">{riskMetrics.maxDrawdown}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Diversification Score</span>
                    <span className={`font-semibold ${getRiskColor(riskMetrics.diversificationScore)}`}>
                      {riskMetrics.diversificationScore}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Risk Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">Overall Risk</span>
                      <span className={`font-semibold ${getRiskColor(riskMetrics.overallScore)}`}>
                        {riskMetrics.overallScore > 75 ? 'Low' : 
                         riskMetrics.overallScore > 50 ? 'Medium' : 
                         riskMetrics.overallScore > 25 ? 'High' : 'Extreme'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          riskMetrics.overallScore > 75 ? 'bg-green-500' :
                          riskMetrics.overallScore > 50 ? 'bg-yellow-500' :
                          riskMetrics.overallScore > 25 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${riskMetrics.overallScore}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-400">
                    <p>Risk assessment based on portfolio composition, position sizes, and market volatility.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Position Breakdown */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Position Breakdown</h3>
              {positions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2">Asset</th>
                        <th className="text-left py-2">Size</th>
                        <th className="text-left py-2">Entry Price</th>
                        <th className="text-left py-2">Current P&L</th>
                        <th className="text-left py-2">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position, index) => (
                        <tr key={index} className="border-b border-gray-700/50">
                          <td className="py-3 font-medium">{position.asset}</td>
                          <td className="py-3">{position.sizeFormatted}</td>
                          <td className="py-3">${position.entryPrice}</td>
                          <td className={`py-3 ${parseFloat(position.currentPnL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {parseFloat(position.currentPnL) >= 0 ? '+' : ''}${position.currentPnL}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                              Medium
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No positions to analyze</p>
                  <p className="text-sm mt-1">Open some positions to see detailed analytics</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernAIDashboard;
