"use client";

import { useAction, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Position, TradingSignal, AIInsight } from "../types/trading";

interface MarketData {
  asset: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}


// Enhanced types for AI services
export interface AIAnalysisResult {
  type: "portfolio_optimization" | "market_analysis" | "risk_assessment" | "trading_recommendation";
  title: string;
  summary: string;
  details: string;
  confidence: number;
  recommendations: Array<{
    action: string;
    reasoning: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
  timestamp: number;
}



export interface ChatSession {
  id: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
    type?: "text" | "analysis" | "recommendation";
  }>;
  createdAt: number;
  lastActivity: number;
}

// Enhanced AI services hook
export const useEnhancedAI = (userPublicKey?: string) => {
  // Session management
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Local state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [analysisCache, setAnalysisCache] = useState<Map<string, AIAnalysisResult>>(new Map());
  
  // Convex actions
  const aiChat = useAction(api.ai.aiChat);
  const generateRiskAssessment = useAction(api.ai.generateRiskAssessment);
  const generateTradingSignal = useAction(api.ai.generateTradingSignal);
  const storeRiskAssessment = useMutation(api.ai.storeRiskAssessment);
  
  // Convex queries with SSR support
  const tradingSignals = useQuery(
    api.ai.getTradingSignals, 
    {}
  );
  
  const aiInsights = useQuery(
    api.ai.getAIInsights,
    userPublicKey ? { userPublicKey } : "skip"
  );
  
  const marketData = useQuery(
    api.marketData.getAllMarketData,
    {}
  );

  const portfolioAnalytics = useQuery(
    api.analytics.getPortfolioAnalytics,
    userPublicKey ? { userPublicKey } : "skip"
  );

  // Initialize AI services
  useEffect(() => {
    if (userPublicKey && !isInitialized) {
      setIsInitialized(true);
      // Initialize with welcome message
      const welcomeSession: ChatSession = {
        id: sessionId,
        messages: [{
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hello! I'm your AI trading assistant. I can help you analyze your portfolio, understand market conditions, and provide trading recommendations. What would you like to know?",
          timestamp: Date.now(),
          type: "text"
        }],
        createdAt: Date.now(),
        lastActivity: Date.now()
      };
      setChatSessions([welcomeSession]);
      setActiveChatId(sessionId);
    }
  }, [userPublicKey, isInitialized, sessionId]);

  // Enhanced chat functionality with context awareness
  const sendMessage = useCallback(async (
    message: string, 
    context?: {
      positions?: Position[];
      marketData?: MarketData[];
      includePortfolioAnalysis?: boolean;
    }
  ) => {
    if (!userPublicKey) {
      throw new Error("User not authenticated");
    }

    const currentSession = chatSessions.find(s => s.id === activeChatId);
    if (!currentSession) {
      throw new Error("No active chat session");
    }

    // Add user message
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: message,
      timestamp: Date.now(),
      type: "text" as const
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      lastActivity: Date.now()
    };

    setChatSessions(prev => prev.map(s => s.id === activeChatId ? updatedSession : s));

    try {
      // Enhanced context for AI
      const aiContext = {
        ...context,
        recentMessages: currentSession.messages.slice(-5), // Last 5 messages for context
        userPreferences: {
          riskTolerance: "medium", // Could be user-configurable
          tradingStyle: "balanced"
        }
      };

      const response = await aiChat({
        userPublicKey,
        sessionId: activeChatId || 'default',
        message,
        context: aiContext,
      });

      // Add AI response
      const aiMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: response.response,
        timestamp: Date.now(),
        type: (response.type || "text") as "text" | "analysis" | "recommendation"
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        lastActivity: Date.now()
      };

      setChatSessions(prev => prev.map(s => s.id === activeChatId ? finalSession : s));

      return response;
    } catch (error) {
      // Add error message
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: Date.now(),
        type: "text" as const
      };

      const errorSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, errorMessage],
        lastActivity: Date.now()
      };

      setChatSessions(prev => prev.map(s => s.id === activeChatId ? errorSession : s));
      throw error;
    }
  }, [userPublicKey, chatSessions, activeChatId, aiChat]);


  // Risk assessment
  const assessRisk = useCallback(async (
    position: Position,
    marketContext?: MarketData[]
  ) => {
    if (!userPublicKey) return null;

    try {
      const assessment = await generateRiskAssessment({
        positionId: position.positionId,
        userPublicKey,
        asset: position.asset,
        size: position.size,
        collateral: position.collateral,
        leverage: position.leverage,
        entryPrice: position.entryPrice,
        currentPrice: "0" // TODO: Get actual current price
      });

      // Store the assessment in the database
      await storeRiskAssessment({
        positionId: position.positionId,
        userPublicKey,
        riskScore: assessment.riskScore,
        riskLevel: assessment.riskLevel,
        factors: assessment.factors,
        recommendations: assessment.recommendations
      });

      return assessment;
    } catch (error) {
      console.error("Risk assessment error:", error);
      return null;
    }
  }, [userPublicKey, generateRiskAssessment, storeRiskAssessment]);

  // Get trading signal for specific asset
  const getAssetSignal = useCallback(async (asset: string) => {
    try {
      const signal = await generateTradingSignal({
        asset,
        currentPrice: "0", // TODO: Get actual current price
        priceChange24h: "0",
        volume24h: "0",
        fundingRate: "0"
      });

      return {
        asset,
        signal: signal.signal,
        confidence: signal.confidence,
        reasoning: signal.reasoning,
        timeHorizon: signal.timeHorizon || "medium",
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
      } as TradingSignal;
    } catch (error) {
      console.error("Trading signal error:", error);
      return null;
    }
  }, [generateTradingSignal, marketData]);

  // Create new chat session
  const createNewChatSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      messages: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };
    
    setChatSessions(prev => [...prev, newSession]);
    setActiveChatId(newSession.id);
    return newSession.id;
  }, []);

  // Switch chat session
  const switchChatSession = useCallback((sessionId: string) => {
    setActiveChatId(sessionId);
  }, []);

  // Delete chat session
  const deleteChatSession = useCallback((sessionId: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeChatId === sessionId) {
      const remaining = chatSessions.filter(s => s.id !== sessionId);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  }, [chatSessions, activeChatId]);

  // Computed values
  const currentChatSession = useMemo(() => {
    return chatSessions.find(s => s.id === activeChatId) || null;
  }, [chatSessions, activeChatId]);

  const isLoading = useMemo(() => {
    return !tradingSignals || !aiInsights || !marketData;
  }, [tradingSignals, aiInsights, marketData]);

  // Enhanced insights
  const enhancedInsights = useMemo(() => {
    if (!aiInsights) return [];
    
    return aiInsights
      .sort((a: AIInsight, b: AIInsight) => b.timestamp - a.timestamp);
  }, [aiInsights]);

  // Enhanced trading signals with filtering
  const enhancedTradingSignals = useMemo(() => {
    if (!tradingSignals) return [];
    
    return tradingSignals;
  }, [tradingSignals]);

  return {
    // Data
    tradingSignals: enhancedTradingSignals,
    aiInsights: enhancedInsights,
    marketData: marketData || [],
    portfolioAnalytics,
    
    // Chat
    chatSessions,
    currentChatSession,
    activeChatId,
    sendMessage,
    createNewChatSession,
    switchChatSession,
    deleteChatSession,
    
    // Analysis functions
    assessRisk,
    getAssetSignal,
    
    // State
    isLoading,
    isInitialized,
    
    // Cache management
    clearAnalysisCache: () => setAnalysisCache(new Map()),
  };
};
