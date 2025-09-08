import { v } from "convex/values";
import { action, query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// AI Configuration
const AIML_API_URL = "https://api.aimlapi.com/v1/chat/completions";
const AIML_MODEL = "deepseek/deepseek-r1";

// Types for AI responses
interface AIMLResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage: {
    total_tokens: number;
  };
}

interface RiskAssessment {
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "extreme";
  factors: string[];
  recommendations: string[];
}

interface TradingSignal {
  signal: "strong_buy" | "buy" | "hold" | "sell" | "strong_sell";
  confidence: number;
  reasoning: string;
  timeHorizon: string;
}

// Helper function to call AIML API
async function callAIMLAPI(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  systemPrompt?: string
): Promise<AIMLResponse> {
  const finalMessages = systemPrompt 
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  const response = await fetch(AIML_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AIML_MODEL,
      messages: finalMessages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.status}`);
  }

  return response.json();
}

// Get AI API key from environment
export const getAIAPIKey = query({
  args: {},
  handler: async (ctx) => {
    // In production, this should come from environment variables
    // For now, return a placeholder - you'll need to set this
    return process.env.AIML_API_KEY || "YOUR_AIML_API_KEY";
  },
});

// Generate risk assessment for a position
export const generateRiskAssessment = action({
  args: {
    positionId: v.string(),
    userPublicKey: v.string(),
    asset: v.string(),
    size: v.string(),
    collateral: v.string(),
    leverage: v.number(),
    entryPrice: v.string(),
    currentPrice: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    const prompt = `You are a professional risk analyst for a perpetual futures trading platform. Analyze the following position and provide a risk assessment:

Position Details:
- Asset: ${args.asset}
- Size: ${args.size}
- Collateral: ${args.collateral}
- Leverage: ${args.leverage}x
- Entry Price: ${args.entryPrice}
- Current Price: ${args.currentPrice}

Please provide:
1. A risk score from 0-100 (where 0 is no risk, 100 is extreme risk)
2. Risk level: low, medium, high, or extreme
3. Key risk factors (list 3-5 main concerns)
4. Specific recommendations to manage risk

Format your response as JSON:
{
  "riskScore": number,
  "riskLevel": "low|medium|high|extreme",
  "factors": ["factor1", "factor2", "factor3"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

    try {
      const response = await callAIMLAPI(
        [{ role: "user", content: prompt }],
        apiKey
      );

      const content = response.choices[0].message.content;
      let riskAssessment: RiskAssessment;

      try {
        // Try to parse JSON response
        riskAssessment = JSON.parse(content);
      } catch {
        // If parsing fails, create a structured response from text
        riskAssessment = {
          riskScore: 50,
          riskLevel: "medium",
          factors: ["Unable to parse AI response"],
          recommendations: ["Review position manually"],
        };
      }

      // Store the risk assessment
      await ctx.runMutation(api.ai.storeRiskAssessment, {
        positionId: args.positionId,
        userPublicKey: args.userPublicKey,
        riskScore: riskAssessment.riskScore,
        riskLevel: riskAssessment.riskLevel,
        factors: riskAssessment.factors,
        recommendations: riskAssessment.recommendations,
      });

      return riskAssessment;
    } catch (error) {
      console.error("AI Risk Assessment Error:", error);
      throw new Error("Failed to generate risk assessment");
    }
  },
});

// Generate trading signal for an asset
export const generateTradingSignal = action({
  args: {
    asset: v.string(),
    currentPrice: v.string(),
    priceChange24h: v.optional(v.string()),
    volume24h: v.optional(v.string()),
    fundingRate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    const prompt = `You are a professional trading analyst. Analyze the following asset and provide a trading signal:

Asset: ${args.asset}
Current Price: ${args.currentPrice}
24h Price Change: ${args.priceChange24h || "N/A"}
24h Volume: ${args.volume24h || "N/A"}
Funding Rate: ${args.fundingRate || "N/A"}

Based on this data, provide:
1. Trading signal: strong_buy, buy, hold, sell, or strong_sell
2. Confidence level: 0.0 to 1.0 (where 1.0 is highest confidence)
3. Reasoning: Brief explanation of your analysis
4. Time horizon: short_term, medium_term, or long_term

Format your response as JSON:
{
  "signal": "strong_buy|buy|hold|sell|strong_sell",
  "confidence": number,
  "reasoning": "string",
  "timeHorizon": "short_term|medium_term|long_term"
}`;

    try {
      const response = await callAIMLAPI(
        [{ role: "user", content: prompt }],
        apiKey
      );

      const content = response.choices[0].message.content;
      let tradingSignal: TradingSignal;

      try {
        tradingSignal = JSON.parse(content);
      } catch {
        tradingSignal = {
          signal: "hold",
          confidence: 0.5,
          reasoning: "Unable to parse AI response",
          timeHorizon: "short_term",
        };
      }

      // Store the trading signal
      await ctx.runMutation(api.ai.storeTradingSignal, {
        asset: args.asset,
        signal: tradingSignal.signal,
        confidence: tradingSignal.confidence,
        reasoning: tradingSignal.reasoning,
        timeHorizon: tradingSignal.timeHorizon,
      });

      return tradingSignal;
    } catch (error) {
      console.error("AI Trading Signal Error:", error);
      throw new Error("Failed to generate trading signal");
    }
  },
});


// Store risk assessment in database
export const storeRiskAssessment = mutation({
  args: {
    positionId: v.string(),
    userPublicKey: v.string(),
    riskScore: v.number(),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("extreme")
    ),
    factors: v.array(v.string()),
    recommendations: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiRiskAssessments", {
      positionId: args.positionId,
      userPublicKey: args.userPublicKey,
      riskScore: args.riskScore,
      riskLevel: args.riskLevel,
      factors: args.factors,
      recommendations: args.recommendations,
      timestamp: Date.now(),
    });
  },
});

// Store trading signal in database
export const storeTradingSignal = mutation({
  args: {
    asset: v.string(),
    signal: v.union(
      v.literal("strong_buy"),
      v.literal("buy"),
      v.literal("hold"),
      v.literal("sell"),
      v.literal("strong_sell")
    ),
    confidence: v.number(),
    reasoning: v.string(),
    timeHorizon: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiTradingSignals", {
      asset: args.asset,
      signal: args.signal,
      confidence: args.confidence,
      reasoning: args.reasoning,
      timeHorizon: args.timeHorizon,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
  },
});

// AI Chat with improved context awareness and natural responses
export const aiChat = action({
  args: {
    userPublicKey: v.string(),
    sessionId: v.string(),
    message: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error("AIML API key not configured");
    }

    try {
      // Analyze user message intent for better responses
      const messageIntent = analyzeMessageIntent(args.message);
      
      // If API key is not properly configured, use mock responses
      if (!apiKey || apiKey === "YOUR_AIML_API_KEY") {
        const aiResponse = generateMockResponse(messageIntent, args.message, args.context);
        const responseType = determineResponseType(messageIntent, aiResponse);
        
        return {
          response: aiResponse,
          type: responseType,
          tokensUsed: 0,
          timestamp: Date.now(),
        };
      }

      const systemPrompt = createSystemPrompt(messageIntent, args.context);

      // Build conversation messages
      const messages = [];
      
      // Add previous messages for context if available
      if (args.context?.previousMessages && args.context.previousMessages.length > 0) {
        messages.push(...args.context.previousMessages.slice(-3)); // Last 3 messages for context
      }
      
      messages.push({ role: "user", content: args.message });

      const response = await callAIMLAPI(messages, apiKey, systemPrompt);
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error("No response from AI model");
      }

      const aiResponse = response.choices[0].message.content;
      
      // Determine response type based on intent and content
      const responseType = determineResponseType(messageIntent, aiResponse);

      // Store the conversation
      await ctx.runMutation(api.ai.storeChatMessage, {
        userPublicKey: args.userPublicKey,
        sessionId: args.sessionId,
        messageId: crypto.randomUUID(),
        role: "user",
        content: args.message,
      });

      await ctx.runMutation(api.ai.storeChatMessage, {
        userPublicKey: args.userPublicKey,
        sessionId: args.sessionId,
        messageId: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        metadata: { responseType },
      });

      return {
        response: aiResponse,
        type: responseType,
        tokensUsed: response.usage?.total_tokens || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error("AI Chat error:", error);
      throw new Error("Failed to get AI response");
    }
  },
});

// Analyze user message intent for better responses
function analyzeMessageIntent(message: string): string {
  const lowerMessage = message.toLowerCase().trim();
  
  // Greeting patterns
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)$/i.test(lowerMessage)) {
    return "greeting";
  }
  
  // Analysis requests
  if (lowerMessage.includes("analyz") || lowerMessage.includes("assess") || lowerMessage.includes("review")) {
    return "analysis";
  }
  
  // Trading signals/recommendations
  if (lowerMessage.includes("signal") || lowerMessage.includes("recommend") || lowerMessage.includes("should i") || lowerMessage.includes("buy") || lowerMessage.includes("sell")) {
    return "trading_advice";
  }
  
  // Risk management
  if (lowerMessage.includes("risk") || lowerMessage.includes("safe") || lowerMessage.includes("danger")) {
    return "risk_management";
  }
  
  // Market information
  if (lowerMessage.includes("market") || lowerMessage.includes("price") || lowerMessage.includes("outlook")) {
    return "market_info";
  }
  
  // Portfolio questions
  if (lowerMessage.includes("portfolio") || lowerMessage.includes("position") || lowerMessage.includes("performance")) {
    return "portfolio";
  }
  
  return "general";
}

// Create appropriate system prompt based on intent
function createSystemPrompt(intent: string, context: any): string {
  const basePrompt = `You are an AI trading assistant for Synapse Trade, a Stellar blockchain perpetual futures platform. You are helpful, knowledgeable, and conversational. Always prioritize risk management and responsible trading.`;
  
  switch (intent) {
    case "greeting":
      return `${basePrompt}

The user is greeting you. Respond warmly and briefly. If they have active positions, you can mention you're aware of their portfolio, but don't overwhelm them with details unless they ask. Keep it friendly and ask how you can help.

Example: "Hi there! 👋 I can see you have some active positions. How can I help you with your trading today?"`;

    case "analysis":
      return `${basePrompt}

The user wants analysis. Provide clear, actionable insights based on their current positions and market conditions. Focus on:
- Current position performance
- Risk assessment
- Potential improvements
- Market context

${buildContextSection(context)}`;

    case "trading_advice":
      return `${basePrompt}

The user wants trading advice. Be helpful but always emphasize:
- This is not financial advice
- Risk management is crucial
- Consider their current portfolio
- Suggest position sizing and risk controls

${buildContextSection(context)}`;

    case "risk_management":
      return `${basePrompt}

Focus on risk management. Analyze their current exposure, suggest improvements, and emphasize safety measures like stop losses, position sizing, and diversification.

${buildContextSection(context)}`;

    case "portfolio":
      return `${basePrompt}

The user is asking about their portfolio. Provide a clear overview of their positions, performance, and any notable observations.

${buildContextSection(context)}`;

    default:
      return `${basePrompt}

Be conversational and helpful. ${buildContextSection(context)}`;
  }
}

// Build context section for system prompt
function buildContextSection(context: any): string {
  if (!context) return "";
  
  let contextSection = "";
  
  // Add positions context
  if (context.positions && context.positions.length > 0) {
    contextSection += `\nUser's Current Positions:
${context.positions.map((pos: any) => 
  `- ${pos.asset}: ${pos.size} size, entry $${pos.entryPrice}, ${pos.leverage}x leverage, PnL: $${pos.currentPnL || pos.pnl || "0"}`
).join('\n')}`;
  } else {
    contextSection += `\nUser has no active positions currently.`;
  }

  // Add portfolio summary
  if (context.portfolioSummary) {
    const summary = context.portfolioSummary;
    contextSection += `\nPortfolio Summary: $${summary.totalCollateral} collateral, $${summary.totalPnL} total PnL`;
  }

  // Add market prices (only if relevant)
  if (context.prices && Object.keys(context.prices).length > 0) {
    contextSection += `\nCurrent Market Prices: ${Object.entries(context.prices).slice(0, 3).map(([asset, data]: [string, any]) => 
      `${asset} $${data.price}`
    ).join(', ')}`;
  }

  return contextSection;
}

// Determine response type based on intent and content
function determineResponseType(intent: string, response: string): string {
  if (intent === "analysis" || response.toLowerCase().includes("analyz")) {
    return "analysis";
  }
  
  if (intent === "trading_advice" || response.toLowerCase().includes("recommend") || response.toLowerCase().includes("suggest")) {
    return "recommendation";
  }
  
  return "text";
}

// Generate mock AI responses for testing/demo
function generateMockResponse(intent: string, message: string, context: any): string {
  const hasPositions = context?.positions && context.positions.length > 0;
  
  switch (intent) {
    case "greeting":
      if (hasPositions) {
        const positionCount = context.positions.length;
        return `Hi there! 👋 I can see you have ${positionCount} active position${positionCount > 1 ? 's' : ''} in your portfolio. How can I help you with your trading today?`;
      } else {
        return `Hello! 👋 Welcome to Synapse Trade. I'm your AI trading assistant. I can help you with portfolio analysis, market insights, and trading strategies. How can I assist you today?`;
      }
      
    case "analysis":
      if (hasPositions) {
        const totalPnL = context.portfolioSummary?.totalPnL || "0";
        const pnlStatus = parseFloat(totalPnL) >= 0 ? "profitable" : "showing losses";
        return `📊 **Portfolio Analysis**\n\nYour current portfolio is ${pnlStatus} with a total P&L of $${totalPnL}. You have ${context.positions.length} active positions:\n\n${context.positions.map((pos: any) => `• ${pos.asset}: ${pos.leverage}x leverage, ${parseFloat(pos.currentPnL || pos.pnl || "0") >= 0 ? '+' : ''}$${pos.currentPnL || pos.pnl || "0"} PnL`).join('\n')}\n\n**Key Observations:**\n• Risk level appears moderate based on your leverage usage\n• Consider setting stop-losses if you haven't already\n• Portfolio shows ${context.positions.length > 1 ? 'good' : 'limited'} diversification\n\nWould you like me to dive deeper into any specific aspect?`;
      } else {
        return `📊 **Portfolio Analysis**\n\nI don't see any active positions in your portfolio right now. This could be a good time to:\n\n• Research market opportunities\n• Set up watchlists for assets you're interested in\n• Review your risk management strategy\n• Consider the current market conditions\n\nWould you like me to help you identify some potential trading opportunities?`;
      }
      
    case "trading_advice":
      return `💡 **Trading Insights**\n\nBased on current market conditions, here are some general considerations:\n\n• **Risk Management**: Always use proper position sizing (1-2% risk per trade)\n• **Market Trend**: Monitor key support/resistance levels\n• **Diversification**: Don't put all capital in one asset\n\n⚠️ *Remember: This is not financial advice. Always do your own research and never risk more than you can afford to lose.*\n\nWhat specific asset or strategy are you considering?`;
      
    case "risk_management":
      if (hasPositions) {
        const highLeveragePositions = context.positions.filter((pos: any) => pos.leverage > 5).length;
        return `⚠️ **Risk Assessment**\n\nCurrent risk factors in your portfolio:\n\n${highLeveragePositions > 0 ? `• ${highLeveragePositions} position(s) with high leverage (>5x)\n` : ''}• Total exposure across ${context.positions.length} positions\n• Correlation risk if positions are in similar assets\n\n**Recommendations:**\n✅ Set stop-losses at 2-5% below entry\n✅ Consider reducing position sizes if overleveraged\n✅ Monitor margin requirements closely\n✅ Have an exit strategy for each position\n\nWould you like me to analyze any specific position's risk?`;
      } else {
        return `⚠️ **Risk Management Guidelines**\n\nSince you don't have active positions, here are key risk management principles:\n\n✅ **Position Sizing**: Risk only 1-2% of capital per trade\n✅ **Leverage**: Start with lower leverage (2-3x) until experienced\n✅ **Stop Losses**: Always define your exit before entering\n✅ **Diversification**: Don't concentrate in one asset\n✅ **Emotional Control**: Stick to your plan, avoid FOMO\n\nReady to discuss a specific trading strategy?`;
      }
      
    case "portfolio":
      if (hasPositions) {
        const totalCollateral = context.portfolioSummary?.totalCollateral || "0";
        const totalPnL = context.portfolioSummary?.totalPnL || "0";
        return `📋 **Portfolio Overview**\n\n**Summary:**\n• Total Collateral: $${totalCollateral}\n• Total P&L: ${parseFloat(totalPnL) >= 0 ? '+' : ''}$${totalPnL}\n• Active Positions: ${context.positions.length}\n\n**Positions:**\n${context.positions.map((pos: any, i: number) => `${i + 1}. **${pos.asset}** - ${pos.size} size, ${pos.leverage}x leverage\n   Entry: $${pos.entryPrice} | P&L: ${parseFloat(pos.currentPnL || pos.pnl || "0") >= 0 ? '+' : ''}$${pos.currentPnL || pos.pnl || "0"}`).join('\n\n')}\n\nWould you like a detailed analysis of any specific position?`;
      } else {
        return `📋 **Portfolio Overview**\n\nYour portfolio is currently empty - no active positions.\n\n**Getting Started:**\n• Connect your wallet to start trading\n• Research assets you're interested in\n• Start with smaller positions to test strategies\n• Always use proper risk management\n\nWould you like help identifying some trading opportunities?`;
      }
      
    case "market_info":
      return `📈 **Market Overview**\n\nCurrent market sentiment appears mixed with:\n\n• **BTC**: Consolidating around key levels\n• **ETH**: Following broader crypto trends\n• **SOL**: Showing relative strength\n\n**Key Factors to Watch:**\n• Overall market volatility\n• Funding rates across assets\n• Support/resistance levels\n\n*Note: This is a simplified overview. For detailed analysis, please check current market data and charts.*\n\nWhat specific asset or timeframe interests you most?`;
      
    default:
      return `I'm here to help with your trading questions! I can assist with:\n\n📊 Portfolio analysis and optimization\n💡 Trading strategies and market insights\n⚠️ Risk assessment and management\n📈 Market analysis and trends\n\nWhat would you like to explore? Feel free to ask about any specific aspect of trading or your portfolio.`;
  }
}

// Store chat message in database
export const storeChatMessage = mutation({
  args: {
    userPublicKey: v.string(),
    sessionId: v.string(),
    messageId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiChatHistory", {
      userPublicKey: args.userPublicKey,
      sessionId: args.sessionId,
      messageId: args.messageId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      metadata: args.metadata,
    });
  },
});

// Query functions for retrieving AI data
export const getRiskAssessment = query({
  args: { positionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiRiskAssessments")
      .withIndex("by_position", (q) => q.eq("positionId", args.positionId))
      .order("desc")
      .first();
  },
});

export const getTradingSignals = query({
  args: { asset: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.asset) {
      return await ctx.db
        .query("aiTradingSignals")
        .withIndex("by_asset", (q) => q.eq("asset", args.asset!))
        .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
        .order("desc")
        .collect();
    }
    
    return await ctx.db
      .query("aiTradingSignals")
      .filter((q) => q.gt(q.field("expiresAt"), Date.now()))
      .order("desc")
      .collect();
  },
});

export const getChatHistory = query({
  args: { 
    userPublicKey: v.string(),
    sessionId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    return await ctx.db
      .query("aiChatHistory")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(limit);
  },
});

export const getAIInsights = query({
  args: { 
    userPublicKey: v.string(),
    type: v.optional(v.union(
      v.literal("risk_assessment"),
      v.literal("trading_recommendation"),
      v.literal("market_analysis"),
      v.literal("portfolio_optimization"),
      v.literal("sentiment_analysis")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    if (args.type) {
      return await ctx.db
        .query("aiInsights")
        .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
        .filter((q) => 
          q.and(
            q.eq(q.field("type"), args.type!),
            q.or(
              q.eq(q.field("expiresAt"), undefined),
              q.gt(q.field("expiresAt"), Date.now())
            )
          )
        )
        .order("desc")
        .take(limit);
    }
    
    return await ctx.db
      .query("aiInsights")
      .withIndex("by_user", (q) => q.eq("userPublicKey", args.userPublicKey))
      .filter((q) => 
        q.or(
          q.eq(q.field("expiresAt"), undefined),
          q.gt(q.field("expiresAt"), Date.now())
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Advanced AI Features

// Portfolio Optimization AI
export const optimizePortfolio = action({
  args: {
    userPublicKey: v.string(),
    targetRisk: v.string(), // "conservative", "moderate", "aggressive"
    availableCapital: v.string(),
    currentPositions: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    const prompt = `You are a professional portfolio manager for a perpetual futures trading platform. Analyze the following portfolio and provide optimization recommendations:

User Profile:
- Risk Tolerance: ${args.targetRisk}
- Available Capital: ${args.availableCapital} XLM
- Current Positions: ${JSON.stringify(args.currentPositions)}

Provide detailed recommendations for:
1. Position sizing adjustments
2. New position opportunities
3. Risk diversification strategies
4. Optimal leverage levels
5. Exit strategies for overexposed positions
6. Portfolio rebalancing suggestions

Format as JSON with specific actionable recommendations:
{
  "overallRisk": "low|medium|high",
  "recommendations": [
    {
      "action": "ADD|REDUCE|CLOSE|HOLD",
      "asset": "string",
      "reasoning": "string",
      "priority": "high|medium|low"
    }
  ],
  "newOpportunities": [
    {
      "asset": "string",
      "suggestedSize": "string",
      "leverage": number,
      "reasoning": "string"
    }
  ],
  "riskScore": number,
  "diversificationScore": number
}`;

    try {
      const response = await callAIMLAPI(
        [{ role: "user", content: prompt }],
        apiKey
      );

      const content = response.choices[0].message.content;
      let optimizationResult;

      try {
        optimizationResult = JSON.parse(content);
      } catch {
        optimizationResult = {
          overallRisk: "medium",
          recommendations: [{
            action: "HOLD",
            asset: "All",
            reasoning: "Unable to parse AI response",
            priority: "medium"
          }],
          newOpportunities: [],
          riskScore: 50,
          diversificationScore: 50
        };
      }

      // Store the optimization result
      await ctx.runMutation(api.ai.storeAIInsight, {
        userPublicKey: args.userPublicKey,
        type: "portfolio_optimization",
        title: "Portfolio Optimization Analysis",
        content: JSON.stringify(optimizationResult),
        metadata: {
          targetRisk: args.targetRisk,
          availableCapital: args.availableCapital,
          positionCount: args.currentPositions.length
        }
      });

      return optimizationResult;
    } catch (error) {
      console.error("AI Portfolio Optimization Error:", error);
      throw new Error("Failed to optimize portfolio");
    }
  },
});

// Advanced Trading Signal with Market Context
export const generateAdvancedTradingSignal = action({
  args: {
    asset: v.string(),
    currentPrice: v.string(),
    userPositions: v.array(v.any()),
    marketConditions: v.optional(v.any()),
    timeHorizon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    const prompt = `You are a professional trading analyst. Provide an advanced trading analysis for ${args.asset}:

Asset Details:
- Current Price: ${args.currentPrice}
- Time Horizon: ${args.timeHorizon || "short_term"}
- Market Conditions: ${JSON.stringify(args.marketConditions || {})}
- User's Existing Positions: ${JSON.stringify(args.userPositions)}

Provide comprehensive analysis:
1. Entry/Exit recommendations with specific price targets
2. Position sizing suggestions based on risk management
3. Risk-reward analysis
4. Correlation analysis with existing positions
5. Market timing assessment
6. Technical and fundamental factors
7. Stop-loss and take-profit levels

Format as JSON:
{
  "signal": "strong_buy|buy|hold|sell|strong_sell",
  "confidence": number,
  "entryPrice": "string",
  "targetPrice": "string",
  "stopLoss": "string",
  "positionSize": "string",
  "leverage": number,
  "reasoning": "string",
  "riskFactors": ["string"],
  "timeHorizon": "string",
  "correlationRisk": "low|medium|high"
}`;

    try {
      const response = await callAIMLAPI(
        [{ role: "user", content: prompt }],
        apiKey
      );

      const content = response.choices[0].message.content;
      let advancedSignal;

      try {
        advancedSignal = JSON.parse(content);
      } catch {
        advancedSignal = {
          signal: "hold",
          confidence: 0.5,
          entryPrice: args.currentPrice,
          targetPrice: args.currentPrice,
          stopLoss: args.currentPrice,
          positionSize: "0.01",
          leverage: 1,
          reasoning: "Unable to parse AI response",
          riskFactors: ["Analysis unavailable"],
          timeHorizon: args.timeHorizon || "short_term",
          correlationRisk: "medium"
        };
      }

      // Store the advanced signal
      await ctx.runMutation(api.ai.storeTradingSignal, {
        asset: args.asset,
        signal: advancedSignal.signal,
        confidence: advancedSignal.confidence,
        reasoning: advancedSignal.reasoning,
        timeHorizon: advancedSignal.timeHorizon,
      });

      return advancedSignal;
    } catch (error) {
      console.error("AI Advanced Trading Signal Error:", error);
      throw new Error("Failed to generate advanced trading signal");
    }
  },
});

// Market Sentiment Analysis
export const analyzeMarketSentiment = action({
  args: {
    assets: v.array(v.string()),
    includeNews: v.optional(v.boolean()),
    includeSocial: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    const prompt = `You are a market sentiment analyst. Analyze the current sentiment for these assets: ${args.assets.join(", ")}

Consider:
- Technical indicators
- Market momentum
- Volume patterns
- Volatility trends
- ${args.includeNews ? "Recent news impact" : ""}
- ${args.includeSocial ? "Social media sentiment" : ""}
- On-chain metrics

Provide sentiment analysis for each asset:
{
  "overallSentiment": "bullish|bearish|neutral",
  "assets": [
    {
      "asset": "string",
      "sentiment": "bullish|bearish|neutral",
      "score": number,
      "confidence": number,
      "keyFactors": ["string"],
      "trend": "up|down|sideways"
    }
  ],
  "marketOutlook": "string",
  "riskLevel": "low|medium|high"
}`;

    try {
      const response = await callAIMLAPI(
        [{ role: "user", content: prompt }],
        apiKey
      );

      const content = response.choices[0].message.content;
      let sentimentAnalysis;

      try {
        sentimentAnalysis = JSON.parse(content);
      } catch {
        sentimentAnalysis = {
          overallSentiment: "neutral",
          assets: args.assets.map(asset => ({
            asset,
            sentiment: "neutral",
            score: 0,
            confidence: 0.5,
            keyFactors: ["Analysis unavailable"],
            trend: "sideways"
          })),
          marketOutlook: "Unable to analyze market sentiment",
          riskLevel: "medium"
        };
      }

      return sentimentAnalysis;
    } catch (error) {
      console.error("AI Market Sentiment Error:", error);
      throw new Error("Failed to analyze market sentiment");
    }
  },
});

// Store AI Insight
export const storeAIInsight = mutation({
  args: {
    userPublicKey: v.string(),
    type: v.union(
      v.literal("risk_assessment"),
      v.literal("trading_recommendation"),
      v.literal("market_analysis"),
      v.literal("portfolio_optimization"),
      v.literal("sentiment_analysis")
    ),
    title: v.string(),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiInsights", {
      userPublicKey: args.userPublicKey,
      type: args.type,
      title: args.title,
      content: args.content,
      metadata: args.metadata,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
  },
});
