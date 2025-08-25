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
  apiKey: string
): Promise<AIMLResponse> {
  const response = await fetch(AIML_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AIML_MODEL,
      messages,
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

// AI Chat for trading assistance
export const aiChat = action({
  args: {
    userPublicKey: v.string(),
    sessionId: v.string(),
    message: v.string(),
    context: v.optional(v.any()), // Trading context, positions, etc.
  },
  handler: async (ctx, args) => {
    const apiKey = await ctx.runQuery(api.ai.getAIAPIKey);
    
    // Build context-aware prompt
    let systemPrompt = `You are Synapse Trade AI, a professional trading assistant for a perpetual futures platform on the Stellar network. You help users with:

- Trading strategy advice
- Risk management
- Market analysis
- Position management
- Technical analysis
- DeFi and blockchain concepts

Always provide helpful, accurate, and risk-aware advice. If you're unsure about something, say so rather than guessing.`;

    if (args.context) {
      systemPrompt += `\n\nUser Context: ${JSON.stringify(args.context)}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: args.message },
    ];

    try {
      const response = await callAIMLAPI(messages, apiKey);
      const aiResponse = response.choices[0].message.content;

      // Store the conversation
      const messageId = crypto.randomUUID();
      
      await ctx.runMutation(api.ai.storeChatMessage, {
        userPublicKey: args.userPublicKey,
        sessionId: args.sessionId,
        messageId,
        role: "user",
        content: args.message,
        metadata: args.context,
      });

      await ctx.runMutation(api.ai.storeChatMessage, {
        userPublicKey: args.userPublicKey,
        sessionId: args.sessionId,
        messageId: crypto.randomUUID(),
        role: "assistant",
        content: aiResponse,
        metadata: { responseTo: messageId },
      });

      return {
        response: aiResponse,
        messageId,
        tokensUsed: response.usage.total_tokens,
      };
    } catch (error) {
      console.error("AI Chat Error:", error);
      throw new Error("Failed to get AI response");
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
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .filter((q) => 
          q.and(
            q.eq(q.field("userPublicKey"), args.userPublicKey),
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
