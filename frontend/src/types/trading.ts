// Trading-related type definitions

export interface MarketData {
  asset: string;
  price: string;
  priceChange24h?: string;
  volume24h?: string;
  fundingRate?: string;
  lastUpdated: number;
  source: string;
}

export interface TradingSignal {
  asset: string;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  reasoning: string;
  timeHorizon: string;
  timestamp: number;
  expiresAt: number;
}

export interface AIInsight {
  userPublicKey: string;
  type: 'risk_assessment' | 'trading_recommendation' | 'market_analysis' | 'portfolio_optimization' | 'sentiment_analysis';
  asset?: string;
  content: string;
  confidence?: number;
  metadata?: unknown;
  timestamp: number;
  expiresAt?: number;
}

export interface Position {
  positionId: string;
  userPublicKey: string;
  asset: string;
  size: string;
  collateral: string;
  entryPrice: string;
  leverage: number;
  timestamp: number;
  isOpen: boolean;
  pnl?: string;
  liquidationPrice?: string;
  fundingRate?: string;
  lastUpdated: number;
}

export interface LiquidationEvent {
  positionId: string;
  userPublicKey: string;
  asset: string;
  size: string;
  collateral: string;
  liquidationPrice: string;
  reason: string;
  txHash: string;
  timestamp: number;
}

export interface FundingRate {
  asset: string;
  rate: string;
  timestamp: number;
  period: string;
}

export interface Trade {
  userPublicKey: string;
  positionId: string;
  type: 'open_long' | 'open_short' | 'close_long' | 'close_short' | 'liquidate';
  asset: string;
  size: string;
  price: string;
  collateral: string;
  leverage: number;
  pnl?: string;
  txHash: string;
  timestamp: number;
}

export interface User {
  publicKey: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: number;
  lastActive: number;
}

export interface Transaction {
  userPublicKey: string;
  txHash: string;
  type: 'position_open' | 'position_close' | 'liquidation' | 'funding_payment';
  asset?: string;
  amount?: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  error?: string;
}

export interface Notification {
  userPublicKey: string;
  type: 'position_opened' | 'position_closed' | 'position_liquidated' | 'funding_rate_update' | 'price_alert';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  relatedPositionId?: string;
  metadata?: unknown;
}

