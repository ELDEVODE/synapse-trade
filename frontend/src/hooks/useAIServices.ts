import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useCallback } from "react";
import { Position } from "../types/trading";

// Hook for AI-powered trading services
export const useAIServices = (userPublicKey?: string) => {
  const [sessionId] = useState(() => crypto.randomUUID());
  
  // AI Actions
  const generateRiskAssessment = useAction(api.ai.generateRiskAssessment);
  const generateTradingSignal = useAction(api.ai.generateTradingSignal);
  const aiChat = useAction(api.ai.aiChat);
  
  // AI Queries
  const tradingSignals = useQuery(api.ai.getTradingSignals, {});
  const aiInsights = useQuery(api.ai.getAIInsights, 
    userPublicKey ? { userPublicKey } : "skip"
  );
  
  // Market Data
  const marketData = useQuery(api.marketData.getAllMarketData, {});
  const fundingRates = useQuery(api.marketData.getCurrentFundingRates, {});
  
  // Liquidation Data
  const liquidationHistory = useQuery(api.liquidationBot.getLiquidationHistory, 
    userPublicKey ? { userPublicKey } : "skip"
  );
  
  // AI Chat Functions
  const sendMessage = useCallback(async (message: string, context?: unknown) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const response = await aiChat({
        userPublicKey,
        sessionId,
        message,
        context,
      });
      
      return response;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }, [aiChat, userPublicKey, sessionId]);
  
  // Risk Assessment Functions
  const assessPositionRisk = useCallback(async (positionData: {
    positionId: string;
    asset: string;
    size: string;
    collateral: string;
    leverage: number;
    entryPrice: string;
    currentPrice: string;
  }) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const assessment = await generateRiskAssessment({
        ...positionData,
        userPublicKey,
      });
      
      return assessment;
    } catch (error) {
      console.error("Risk Assessment Error:", error);
      throw error;
    }
  }, [generateRiskAssessment, userPublicKey]);
  
  // Trading Signal Functions
  const getAssetSignal = useCallback(async (asset: string) => {
    try {
      const assetData = marketData?.find(data => data.asset === asset);
      if (!assetData) {
        throw new Error(`No market data found for ${asset}`);
      }
      
      const signal = await generateTradingSignal({
        asset,
        currentPrice: assetData.price,
        priceChange24h: assetData.priceChange24h,
        volume24h: assetData.volume24h,
        fundingRate: assetData.fundingRate,
      });
      
      return signal;
    } catch (error) {
      console.error("Trading Signal Error:", error);
      throw error;
    }
  }, [generateTradingSignal, marketData]);
  
  // Portfolio Analysis
  const analyzePortfolio = useCallback(async (positions: Position[]) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const analysis = await aiChat({
        userPublicKey,
        sessionId,
        message: `Analyze my portfolio and provide insights. I have ${positions.length} open positions.`,
        context: { positions, type: "portfolio_analysis" },
      });
      
      return analysis;
    } catch (error) {
      console.error("Portfolio Analysis Error:", error);
      throw error;
    }
  }, [aiChat, userPublicKey, sessionId]);
  
  // Market Analysis
  const analyzeMarket = useCallback(async (asset?: string) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const message = asset 
        ? `Provide a comprehensive market analysis for ${asset}. Include technical analysis, risk factors, and trading recommendations.`
        : "Provide a comprehensive market analysis for all major assets. Include market trends, correlations, and portfolio implications.";
      
      const analysis = await aiChat({
        userPublicKey,
        sessionId,
        message,
        context: { 
          asset, 
          marketData, 
          fundingRates,
          type: "market_analysis" 
        },
      });
      
      return analysis;
    } catch (error) {
      console.error("Market Analysis Error:", error);
      throw error;
    }
  }, [aiChat, userPublicKey, sessionId, marketData, fundingRates]);
  
  // Risk Management Advice
  const getRiskAdvice = useCallback(async (positionData?: Position) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const message = positionData
        ? `I have a position in ${positionData.asset} with ${positionData.leverage}x leverage. What risk management strategies should I consider?`
        : "What are the key risk management principles for perpetual futures trading?";
      
      const advice = await aiChat({
        userPublicKey,
        sessionId,
        message,
        context: { 
          positionData, 
          type: "risk_management" 
        },
      });
      
      return advice;
    } catch (error) {
      console.error("Risk Advice Error:", error);
      throw error;
    }
  }, [aiChat, userPublicKey, sessionId]);
  
  return {
    // Data
    marketData,
    fundingRates,
    tradingSignals,
    aiInsights,
    liquidationHistory,
    
    // Functions
    sendMessage,
    assessPositionRisk,
    getAssetSignal,
    analyzePortfolio,
    analyzeMarket,
    getRiskAdvice,
    
    // State
    sessionId,
    isLoading: !marketData || !tradingSignals,
  };
};

// Hook for AI Chat specifically
export const useAIChat = (userPublicKey?: string) => {
  const [sessionId] = useState(() => crypto.randomUUID());
  const aiChat = useAction(api.ai.aiChat);
  const chatHistory = useQuery(api.ai.getChatHistory, 
    userPublicKey ? { userPublicKey, sessionId } : "skip"
  );
  
  const sendMessage = useCallback(async (message: string, context?: unknown) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }
    
    try {
      const response = await aiChat({
        userPublicKey,
        sessionId,
        message,
        context,
      });
      
      return response;
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw error;
    }
  }, [aiChat, userPublicKey, sessionId]);
  
  return {
    sendMessage,
    chatHistory,
    sessionId,
    isLoading: !chatHistory,
  };
};

// Hook for AI Trading Signals
export const useAITradingSignals = (asset?: string) => {
  const tradingSignals = useQuery(api.ai.getTradingSignals, asset ? { asset } : {});
  
  const refreshSignal = useCallback(async () => {
    if (!asset) return;
    
    try {
      // This would need current market data to be passed
      // For now, just return the existing signals
      return tradingSignals;
    } catch (error) {
      console.error("Signal Refresh Error:", error);
      throw error;
    }
  }, [asset, tradingSignals]);
  
  return {
    tradingSignals,
    refreshSignal,
    isLoading: !tradingSignals,
  };
};
