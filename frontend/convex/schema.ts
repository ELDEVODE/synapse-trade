import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User accounts linked to Stellar public keys
  users: defineTable({
    publicKey: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    createdAt: v.number(),
    lastActive: v.number(),
  }).index("by_publicKey", ["publicKey"]),

  // Perpetual futures positions
  positions: defineTable({
    positionId: v.string(),
    userPublicKey: v.string(),
    asset: v.string(), // BTC, ETH, SOL, etc.
    size: v.string(), // Position size (positive for long, negative for short)
    collateral: v.string(), // Collateral amount in USDC
    entryPrice: v.string(), // Entry price
    leverage: v.number(), // Leverage used
    timestamp: v.number(),
    isOpen: v.boolean(),
    pnl: v.optional(v.string()), // Current PnL
    liquidationPrice: v.optional(v.string()), // Price at which position gets liquidated
    fundingRate: v.optional(v.string()), // Current funding rate
    lastUpdated: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_asset", ["asset"])
    .index("by_open", ["isOpen"])
    .index("by_user_open", ["userPublicKey", "isOpen"])
    .index("by_position", ["positionId"]),

  // Market data and prices
  marketData: defineTable({
    asset: v.string(),
    price: v.string(), // Current price
    priceChange24h: v.optional(v.string()), // 24h price change
    volume24h: v.optional(v.string()), // 24h volume
    fundingRate: v.optional(v.string()), // Current funding rate
    openInterest: v.optional(v.string()), // Total open interest
    lastUpdated: v.number(),
    source: v.string(), // "reflector" or other
  })
    .index("by_asset", ["asset"])
    .index("by_last_updated", ["lastUpdated"]),

  // Funding rate history
  fundingRates: defineTable({
    asset: v.string(),
    rate: v.string(), // Funding rate in basis points
    timestamp: v.number(),
    period: v.string(), // "8h" for 8-hour funding
  })
    .index("by_asset", ["asset"])
    .index("by_timestamp", ["timestamp"]),

  // Trading history
  trades: defineTable({
    userPublicKey: v.string(),
    positionId: v.string(),
    type: v.union(
      v.literal("open_long"),
      v.literal("open_short"),
      v.literal("close_long"),
      v.literal("close_short"),
      v.literal("liquidate")
    ),
    asset: v.string(),
    size: v.string(),
    price: v.string(),
    collateral: v.string(),
    leverage: v.number(),
    pnl: v.optional(v.string()),
    txHash: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_position", ["positionId"])
    .index("by_asset", ["asset"])
    .index("by_timestamp", ["timestamp"]),

  // Liquidation events
  liquidations: defineTable({
    positionId: v.string(),
    userPublicKey: v.string(),
    asset: v.string(),
    size: v.string(),
    collateral: v.string(),
    liquidationPrice: v.string(),
    reason: v.string(), // "maintenance_margin", "manual", etc.
    txHash: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_asset", ["asset"])
    .index("by_timestamp", ["timestamp"]),

  // AI Insights and Analysis
  aiInsights: defineTable({
    userPublicKey: v.string(),
    type: v.union(
      v.literal("risk_assessment"),
      v.literal("trading_recommendation"),
      v.literal("market_analysis"),
      v.literal("portfolio_optimization"),
      v.literal("sentiment_analysis")
    ),
    title: v.string(), // Title for the insight
    asset: v.optional(v.string()),
    content: v.string(), // AI-generated analysis
    confidence: v.optional(v.number()), // AI confidence score 0-1
    metadata: v.optional(v.any()), // Additional AI response data
    timestamp: v.number(),
    expiresAt: v.optional(v.number()), // When insight expires
  })
    .index("by_user", ["userPublicKey"])
    .index("by_type", ["type"])
    .index("by_asset", ["asset"])
    .index("by_timestamp", ["timestamp"]),

  // AI Risk Assessments
  aiRiskAssessments: defineTable({
    positionId: v.string(),
    userPublicKey: v.string(),
    riskScore: v.number(), // 0-100 risk score
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("extreme")
    ),
    factors: v.array(v.string()), // Risk factors identified
    recommendations: v.array(v.string()), // AI recommendations
    timestamp: v.number(),
  })
    .index("by_position", ["positionId"])
    .index("by_user", ["userPublicKey"])
    .index("by_risk_level", ["riskLevel"]),

  // Portfolio Snapshots for historical analysis
  portfolioSnapshots: defineTable({
    userPublicKey: v.string(),
    analytics: v.any(), // Portfolio analytics snapshot
    marketConditions: v.optional(v.any()), // Market data at snapshot time
    timestamp: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_user_time", ["userPublicKey", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  // AI Chat Sessions
  aiChatSessions: defineTable({
    sessionId: v.string(),
    userPublicKey: v.string(),
    messages: v.array(v.object({
      id: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      timestamp: v.number(),
      type: v.optional(v.union(v.literal("text"), v.literal("analysis"), v.literal("recommendation"))),
    })),
    createdAt: v.number(),
    lastActivity: v.number(),
    isActive: v.boolean(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_session", ["sessionId"])
    .index("by_activity", ["lastActivity"]),


  // AI Trading Signals
  aiTradingSignals: defineTable({
    asset: v.string(),
    signal: v.union(
      v.literal("strong_buy"),
      v.literal("buy"),
      v.literal("hold"),
      v.literal("sell"),
      v.literal("strong_sell")
    ),
    confidence: v.number(), // 0-1 confidence score
    reasoning: v.string(), // AI explanation
    timeHorizon: v.string(), // "short_term", "medium_term", "long_term"
    timestamp: v.number(),
    expiresAt: v.number(), // When signal expires
  })
    .index("by_asset", ["asset"])
    .index("by_signal", ["signal"])
    .index("by_timestamp", ["timestamp"]),

  // AI Chat History
  aiChatHistory: defineTable({
    userPublicKey: v.string(),
    sessionId: v.string(),
    messageId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()), // Trading context, position data, etc.
  })
    .index("by_user", ["userPublicKey"])
    .index("by_session", ["sessionId"])
    .index("by_timestamp", ["timestamp"]),

  // AI Model Configuration
  aiConfig: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
  })
    .index("by_key", ["key"]),

  // Stellar transactions history
  transactions: defineTable({
    hash: v.string(),
    userPublicKey: v.string(),
    type: v.union(
      v.literal("payment"),
      v.literal("contract_call"),
      v.literal("create_account"),
      v.literal("other")
    ),
    amount: v.optional(v.string()), // XLM amount as string to preserve precision
    asset: v.optional(v.string()), // Asset code (XLM, USDC, etc.)
    sourceAccount: v.string(),
    destinationAccount: v.optional(v.string()),
    contractAddress: v.optional(v.string()),
    functionName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    ledger: v.optional(v.number()),
    createdAt: v.number(),
    stellarCreatedAt: v.optional(v.string()), // ISO timestamp from Stellar
    memo: v.optional(v.string()),
    fee: v.optional(v.string()),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_hash", ["hash"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  // Smart contract deployments and metadata
  contracts: defineTable({
    address: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    deployerPublicKey: v.string(),
    deploymentTxHash: v.string(),
    abi: v.optional(v.string()), // Contract ABI/interface
    sourceCode: v.optional(v.string()),
    network: v.union(v.literal("testnet"), v.literal("mainnet")),
    isActive: v.boolean(),
    version: v.optional(v.string()),
    deployedAt: v.number(),
    lastInteraction: v.optional(v.number()),
  })
    .index("by_address", ["address"])
    .index("by_deployer", ["deployerPublicKey"])
    .index("by_network", ["network"])
    .index("by_active", ["isActive"]),

  // Contract function calls and interactions
  contractInteractions: defineTable({
    contractAddress: v.string(),
    functionName: v.string(),
    callerPublicKey: v.string(),
    txHash: v.string(),
    parameters: v.optional(v.string()), // JSON string of parameters
    result: v.optional(v.string()), // JSON string of result
    gasUsed: v.optional(v.number()),
    status: v.union(v.literal("pending"), v.literal("success"), v.literal("failed")),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_contract", ["contractAddress"])
    .index("by_caller", ["callerPublicKey"])
    .index("by_tx_hash", ["txHash"])
    .index("by_status", ["status"]),

  // User favorite contracts and watchlist
  userContracts: defineTable({
    userPublicKey: v.string(),
    contractAddress: v.string(),
    name: v.optional(v.string()), // User-defined name for the contract
    notes: v.optional(v.string()),
    isFavorite: v.boolean(),
    addedAt: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_contract", ["contractAddress"])
    .index("by_user_contract", ["userPublicKey", "contractAddress"])
    .index("by_favorites", ["userPublicKey", "isFavorite"]),

  // App settings and configuration
  appSettings: defineTable({
    key: v.string(),
    value: v.string(),
    description: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.string()),
  }).index("by_key", ["key"]),

  // Notifications for users
  notifications: defineTable({
    userPublicKey: v.string(),
    type: v.union(
      v.literal("transaction_confirmed"),
      v.literal("transaction_failed"),
      v.literal("contract_interaction"),
      v.literal("position_liquidated"),
      v.literal("funding_rate_update"),
      v.literal("system_update"),
      v.literal("warning")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    relatedTxHash: v.optional(v.string()),
    relatedContractAddress: v.optional(v.string()),
    relatedPositionId: v.optional(v.string()),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_user_unread", ["userPublicKey", "isRead"])
    .index("by_priority", ["priority"]),

  // Analytics and metrics
  analytics: defineTable({
    eventType: v.string(),
    userPublicKey: v.optional(v.string()),
    contractAddress: v.optional(v.string()),
    metadata: v.optional(v.string()), // JSON string for additional data
    timestamp: v.number(),
  })
    .index("by_event_type", ["eventType"])
    .index("by_user", ["userPublicKey"])
    .index("by_contract", ["contractAddress"])
    .index("by_timestamp", ["timestamp"]),

  // Performance snapshots for analytics
  performanceSnapshots: defineTable({
    userPublicKey: v.string(),
    metrics: v.any(), // Performance metrics object
    timestamp: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_timestamp", ["timestamp"]),

  // Market sentiment data
  marketSentiment: defineTable({
    asset: v.string(),
    sentiment: v.union(
      v.literal("bullish"),
      v.literal("bearish"),
      v.literal("neutral")
    ),
    score: v.number(), // -100 to +100
    confidence: v.number(), // 0-1
    sources: v.any(), // News, social, on-chain data
    timestamp: v.number(),
    expiresAt: v.number(),
  })
    .index("by_asset", ["asset"])
    .index("by_sentiment", ["sentiment"])
    .index("by_timestamp", ["timestamp"]),

  // Price alerts
  priceAlerts: defineTable({
    userPublicKey: v.string(),
    asset: v.string(),
    targetPrice: v.string(),
    direction: v.union(v.literal("above"), v.literal("below")),
    isActive: v.boolean(),
    triggeredAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_asset", ["asset"])
    .index("by_active", ["isActive"]),

  // Trading strategies and templates
  tradingStrategies: defineTable({
    userPublicKey: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    strategy: v.any(), // Strategy configuration
    isActive: v.boolean(),
    performance: v.optional(v.any()), // Strategy performance metrics
    createdAt: v.number(),
    lastUsed: v.optional(v.number()),
  })
    .index("by_user", ["userPublicKey"])
    .index("by_active", ["isActive"]),
});
