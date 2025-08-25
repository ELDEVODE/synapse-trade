// AI Configuration for Synapse Trade
export const AI_CONFIG = {
  // AIML API Configuration
  AIML_API: {
    BASE_URL: process.env.NEXT_PUBLIC_AIML_API_URL || 'https://api.aimlapi.com/v1',
    MODEL: process.env.NEXT_PUBLIC_AIML_MODEL || 'deepseek/deepseek-r1',
    API_KEY: process.env.AIML_API_KEY || 'YOUR_AIML_API_KEY', // Server-side only
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
  },

  // AI Service Settings
  SERVICES: {
    RISK_ASSESSMENT: {
      ENABLED: true,
      AUTO_GENERATE: true, // Generate risk assessment for new positions
      UPDATE_INTERVAL: 300000, // 5 minutes
    },
    
    TRADING_SIGNALS: {
      ENABLED: true,
      AUTO_GENERATE: true, // Generate signals when market data updates
      UPDATE_INTERVAL: 300000, // 5 minutes
      EXPIRY_HOURS: 24, // Signals expire after 24 hours
    },
    
    AI_CHAT: {
      ENABLED: true,
      MAX_MESSAGE_LENGTH: 1000,
      MAX_HISTORY_LENGTH: 50,
      CONTEXT_WINDOW: 10, // Number of recent messages to include in context
    },
    
    PORTFOLIO_ANALYSIS: {
      ENABLED: true,
      AUTO_ANALYZE: false, // Only analyze on demand
      UPDATE_INTERVAL: 3600000, // 1 hour
    },
    
    MARKET_ANALYSIS: {
      ENABLED: true,
      AUTO_ANALYZE: false, // Only analyze on demand
      UPDATE_INTERVAL: 1800000, // 30 minutes
    },
  },

  // AI Prompt Templates
  PROMPTS: {
    RISK_ASSESSMENT: `You are a professional risk analyst for a perpetual futures trading platform. Analyze the following position and provide a risk assessment:

Position Details:
- Asset: {asset}
- Size: {size}
- Collateral: {collateral}
- Leverage: {leverage}x
- Entry Price: {entryPrice}
- Current Price: {currentPrice}

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
}`,

    TRADING_SIGNAL: `You are a professional trading analyst. Analyze the following asset and provide a trading signal:

Asset: {asset}
Current Price: {currentPrice}
24h Price Change: {priceChange24h}
24h Volume: {volume24h}
Funding Rate: {fundingRate}

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
}`,

    PORTFOLIO_ANALYSIS: `You are Synapse Trade AI, a professional trading assistant. Analyze the user's portfolio and provide insights:

Portfolio Summary:
- Number of positions: {positionCount}
- Total assets: {assetCount}
- Average leverage: {avgLeverage}

Please provide:
1. Portfolio risk assessment
2. Diversification analysis
3. Leverage risk evaluation
4. Specific recommendations for risk management
5. Market correlation insights

Keep your response concise but comprehensive.`,

    MARKET_ANALYSIS: `You are Synapse Trade AI, a professional trading assistant. Provide a comprehensive market analysis:

Market Context:
- Assets: {assets}
- Current market conditions
- Funding rates: {fundingRates}

Please provide:
1. Overall market sentiment
2. Key trends and patterns
3. Risk factors to watch
4. Trading opportunities
5. Portfolio implications

Focus on actionable insights for perpetual futures traders.`,

    RISK_MANAGEMENT: `You are Synapse Trade AI, a professional trading assistant specializing in risk management for perpetual futures trading.

Please provide:
1. Key risk management principles for perpetual futures
2. Position sizing strategies
3. Stop-loss and take-profit recommendations
4. Leverage management guidelines
5. Portfolio risk diversification tips

If specific position data is provided, include personalized recommendations for that position.`,
  },

  // AI Response Validation
  VALIDATION: {
    MAX_RESPONSE_LENGTH: 2000,
    REQUIRED_FIELDS: {
      RISK_ASSESSMENT: ['riskScore', 'riskLevel', 'factors', 'recommendations'],
      TRADING_SIGNAL: ['signal', 'confidence', 'reasoning', 'timeHorizon'],
    },
    VALID_VALUES: {
      RISK_LEVEL: ['low', 'medium', 'high', 'extreme'],
      TRADING_SIGNAL: ['strong_buy', 'buy', 'hold', 'sell', 'strong_sell'],
      TIME_HORIZON: ['short_term', 'medium_term', 'long_term'],
    },
  },

  // Error Handling
  ERROR_MESSAGES: {
    API_ERROR: 'AI service temporarily unavailable. Please try again later.',
    VALIDATION_ERROR: 'Unable to process AI response. Please try again.',
    TIMEOUT_ERROR: 'AI response timed out. Please try again.',
    RATE_LIMIT_ERROR: 'Too many AI requests. Please wait before trying again.',
    INSUFFICIENT_CONTEXT: 'Insufficient data for AI analysis. Please provide more context.',
  },

  // Performance Settings
  PERFORMANCE: {
    CACHE_DURATION: 300000, // 5 minutes
    BATCH_SIZE: 10, // Process AI requests in batches
    CONCURRENT_REQUESTS: 5, // Maximum concurrent AI API calls
    REQUEST_DELAY: 1000, // 1 second delay between requests
  },
};

// Environment-specific configurations
export const getAIConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...AI_CONFIG,
    SERVICES: {
      ...AI_CONFIG.SERVICES,
      // Disable some features in development for faster testing
      RISK_ASSESSMENT: {
        ...AI_CONFIG.SERVICES.RISK_ASSESSMENT,
        AUTO_GENERATE: isProduction,
      },
      TRADING_SIGNALS: {
        ...AI_CONFIG.SERVICES.TRADING_SIGNALS,
        AUTO_GENERATE: isProduction,
      },
    },
    PERFORMANCE: {
      ...AI_CONFIG.PERFORMANCE,
      // Faster responses in development
      CACHE_DURATION: isDevelopment ? 60000 : AI_CONFIG.PERFORMANCE.CACHE_DURATION,
      REQUEST_DELAY: isDevelopment ? 500 : AI_CONFIG.PERFORMANCE.REQUEST_DELAY,
    },
  };
};

// Export default configuration
export default AI_CONFIG;

