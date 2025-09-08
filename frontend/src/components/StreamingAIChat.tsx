"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/providers/WalletProvider";
import { useStreamingAIChat } from "@/hooks/useStreamingAIChat";
import { usePositionDisplay } from "@/hooks/useTradingPositions";
import { useOraclePrices } from "@/hooks/useOraclePrices";

interface StreamingAIChatProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  type?: "text" | "analysis" | "recommendation";
  isStreaming?: boolean;
  isComplete?: boolean;
  error?: string;
}

interface Position {
  _id: string;
  _creationTime: number;
  positionId: string;
  userPublicKey: string;
  asset: string;
  size: string;
  entryPrice: string;
  leverage: number;
  collateral: string;
  direction: string;
  isOpen: boolean;
  pnl?: string;
  liquidationPrice?: string;
  fundingRate?: string;
  timestamp: number;
  lastUpdated: number;
  currentPnL?: string;
  sizeFormatted?: string;
  leverageFormatted?: string;
  status?: string;
}

interface AssetBreakdown {
  asset: string;
  count: number;
  totalValue: number;
}

interface RecentPosition {
  _id: string;
  _creationTime: number;
  positionId: string;
  userPublicKey: string;
  asset: string;
  size: string;
  entryPrice: string;
  leverage: number;
  collateral: string;
  direction?: string;
  isOpen: boolean;
  pnl?: string;
  liquidationPrice?: string;
  fundingRate?: string;
  timestamp: number;
  lastUpdated: number;
}

interface PortfolioSummary {
  totalPositions: number;
  openPositions: number;
  closedPositions: number;
  totalPnL: number;
  totalCollateral: number;
  totalExposure: number;
  marginUtilization: number;
  assetBreakdown: AssetBreakdown[];
  recentPositions: RecentPosition[];
}

interface ChatContext {
  positions?: Position[];
  portfolioSummary?: PortfolioSummary | null | undefined;
  marketPrices?: Record<string, number>;
  includePortfolioAnalysis?: boolean;
  includeRiskAnalysis?: boolean;
}

// Typing indicator component
const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-2 px-4 py-3 bg-gray-700/50 rounded-lg max-w-xs">
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
        />
      ))}
    </div>
    <span className="text-sm text-gray-400">AI is thinking...</span>
  </div>
);

// Message component with animations
const MessageBubble: React.FC<{
  message: ChatMessage;
  isStreaming?: boolean;
}> = ({ message, isStreaming }) => {
  const isUser = message.role === "user";
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case "analysis": return "📊";
      case "recommendation": return "💡";
      default: return isUser ? "👤" : "🤖";
    }
  };

  const getMessageBgColor = (type?: string) => {
    if (isUser) return "bg-blue-600";
    
    switch (type) {
      case "analysis": return "bg-purple-600/20 border border-purple-600/30";
      case "recommendation": return "bg-green-600/20 border border-green-600/30";
      default: return "bg-gray-700";
    }
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} transform transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className={`max-w-xs lg:max-w-md flex items-start space-x-2 ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
          isUser ? "bg-blue-600" : "bg-gray-600"
        }`}>
          {getMessageIcon(message.type)}
        </div>

        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-lg ${getMessageBgColor(message.type)} text-white relative group`}>
          {/* Message content */}
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse">|</span>
            )}
          </div>

          {/* Message metadata */}
          <div className="flex items-center justify-between mt-2 text-xs opacity-0 group-hover:opacity-70 transition-opacity">
            <span className="text-gray-300">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {message.type && message.type !== "text" && (
              <span className="capitalize text-gray-300">{message.type}</span>
            )}
          </div>

          {/* Error indicator */}
          {message.error && (
            <div className="mt-2 text-xs text-red-400 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Failed to send
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Quick action buttons
const QuickActions: React.FC<{
  onAction: (message: string, context?: ChatContext) => void;
  disabled: boolean;
  positions: Position[];
  portfolioSummary: PortfolioSummary | null | undefined;
}> = ({ onAction, disabled, positions, portfolioSummary }) => {
  const quickActions = [
    {
      label: "Analyze Portfolio",
      icon: "📊",
      message: "Please analyze my current portfolio and give me insights on performance, risk, and recommendations.",
      context: { includePortfolioAnalysis: true, positions, portfolioSummary },
    },
    {
      label: "Market Outlook",
      icon: "📈",
      message: "What's the current market sentiment and outlook for crypto? Any trading opportunities?",
    },
    {
      label: "Risk Assessment",
      icon: "⚠️",
      message: "Assess the risk level of my current positions and suggest any risk management strategies.",
      context: { includeRiskAnalysis: true, positions },
    },
    {
      label: "Trading Ideas",
      icon: "💡",
      message: "Based on current market conditions, what are some good trading opportunities right now?",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={() => onAction(action.message, action.context)}
          disabled={disabled}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm text-gray-300 hover:text-white transition-all duration-200 border border-gray-600/50 hover:border-gray-500"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

// Main streaming chat component
export const StreamingAIChat: React.FC<StreamingAIChatProps> = ({ className = "" }) => {
  const { publicKey, isConnected } = useWallet();
  const { positions, portfolioSummary } = usePositionDisplay();
  const { marketData } = useOraclePrices();

  const {
    sessions,
    currentSession,
    activeChatId,
    createNewSession,
    clearCurrentSession,
    sendMessage,
    stopStreaming,
    isInitializing,
    isThinking,
    isStreaming,
    canSendMessage,
  } = useStreamingAIChat(publicKey || undefined);

  const [inputMessage, setInputMessage] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages, isThinking]);

  // Focus input on session change
  useEffect(() => {
    if (inputRef.current && !isStreaming) {
      inputRef.current.focus();
    }
  }, [activeChatId, isStreaming]);

  // Handle send message
  const handleSendMessage = async (message?: string, context?: ChatContext) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend || !canSendMessage) return;

    setInputMessage("");
    setShowQuickActions(false);

    const chatContext = {
      ...context,
      positions,
      portfolioSummary,
      marketPrices: marketData.reduce((acc, data) => {
        acc[data.symbol] = parseFloat(data.price);
        return acc;
      }, {} as Record<string, number>),
      timestamp: Date.now(),
    };

    await sendMessage(messageToSend, chatContext);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isConnected) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Connect your wallet to chat with the AI assistant</p>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse"></div>
            <div className="text-lg font-semibold text-white">Initializing AI Assistant...</div>
          </div>
          <div className="flex space-x-1 justify-center">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Trading Assistant</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span>Online</span>
                {isStreaming && (
                  <>
                    <span>•</span>
                    <span className="text-blue-400">Responding...</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Session management */}
            <button
              onClick={createNewSession}
              disabled={isStreaming}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="New chat"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <button
              onClick={clearCurrentSession}
              disabled={isStreaming || !currentSession}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Clear chat"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {isStreaming && (
              <button
                onClick={stopStreaming}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                title="Stop generating"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/50">
        {currentSession?.messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.isStreaming}
          />
        ))}

        {isThinking && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && currentSession?.messages && currentSession.messages.length <= 2 && (
        <div className="px-4 pb-2">
          <QuickActions
            onAction={handleSendMessage}
            disabled={!canSendMessage}
            positions={positions}
            portfolioSummary={portfolioSummary}
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/95 backdrop-blur-sm">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isStreaming 
                  ? "AI is responding..." 
                  : isThinking 
                    ? "AI is thinking..." 
                    : "Ask me anything about trading..."
              }
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={!canSendMessage}
              maxLength={1000}
            />
            
            {/* Character count */}
            {inputMessage.length > 800 && (
              <div className="absolute right-2 bottom-1 text-xs text-gray-500">
                {inputMessage.length}/1000
              </div>
            )}
          </div>

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || !canSendMessage}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            {isStreaming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </>
            )}
          </button>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>💡 Try asking about portfolio analysis, market insights, or trading strategies</span>
          </div>
          <div className="flex items-center space-x-2">
            {sessions.length > 1 && (
              <span>{sessions.length} chats</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingAIChat;
