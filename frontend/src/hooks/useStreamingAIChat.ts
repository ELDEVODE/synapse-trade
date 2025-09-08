"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

// Types for streaming chat
export interface StreamingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  isComplete?: boolean;
  type?: "text" | "analysis" | "recommendation";
  error?: string;
}

export interface ChatSession {
  id: string;
  messages: StreamingMessage[];
  createdAt: number;
  lastActivity: number;
  title?: string;
}

interface StreamingState {
  isStreaming: boolean;
  currentMessageId: string | null;
  streamingContent: string;
  error: string | null;
}

export const useStreamingAIChat = (userPublicKey?: string) => {
  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Streaming state
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessageId: null,
    streamingContent: "",
    error: null,
  });

  // Loading states
  const [isInitializing, setIsInitializing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Refs for streaming
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Convex action
  const aiChatAction = useAction(api.ai.aiChat);

  // Initialize with welcome session
  useEffect(() => {
    if (userPublicKey && sessions.length === 0) {
      setIsInitializing(true);
      const welcomeSession: ChatSession = {
        id: crypto.randomUUID(),
        messages: [
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "👋 Hello! I'm your AI trading assistant. I can help you with:\n\n• Portfolio analysis and optimization\n• Risk assessment and management\n• Trading signals and market insights\n• Performance tracking and analytics\n\nWhat would you like to explore today?",
            timestamp: Date.now(),
            isComplete: true,
            type: "text",
          },
        ],
        createdAt: Date.now(),
        lastActivity: Date.now(),
        title: "AI Assistant",
      };

      setSessions([welcomeSession]);
      setActiveChatId(welcomeSession.id);
      
      // Simulate initial loading
      setTimeout(() => {
        setIsInitializing(false);
      }, 800);
    }
  }, [userPublicKey, sessions.length]);

  // Get current session
  const currentSession = sessions.find(s => s.id === activeChatId);

  // Simulate streaming effect for text
  const simulateStreaming = useCallback((
    fullText: string, 
    messageId: string, 
    onComplete?: () => void
  ) => {
    const words = fullText.split(' ');
    let currentIndex = 0;
    
    setStreamingState(prev => ({
      ...prev,
      isStreaming: true,
      currentMessageId: messageId,
      streamingContent: "",
      error: null,
    }));

    const streamNextWord = () => {
      if (currentIndex < words.length) {
        const currentContent = words.slice(0, currentIndex + 1).join(' ');
        
        setStreamingState(prev => ({
          ...prev,
          streamingContent: currentContent,
        }));

        setSessions(prev => prev.map(session => 
          session.id === activeChatId 
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === messageId
                    ? { ...msg, content: currentContent, isStreaming: true }
                    : msg
                ),
                lastActivity: Date.now(),
              }
            : session
        ));

        currentIndex++;
        
        // Variable speed for more natural streaming
        const delay = words[currentIndex - 1]?.length > 6 ? 80 : 50;
        streamingTimeoutRef.current = setTimeout(streamNextWord, delay);
      } else {
        // Streaming complete
        setStreamingState(prev => ({
          ...prev,
          isStreaming: false,
          currentMessageId: null,
          streamingContent: "",
        }));

        setSessions(prev => prev.map(session => 
          session.id === activeChatId 
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === messageId
                    ? { ...msg, isStreaming: false, isComplete: true }
                    : msg
                ),
                lastActivity: Date.now(),
              }
            : session
        ));

        onComplete?.();
      }
    };

    streamNextWord();
  }, [activeChatId]);

  // Send message with streaming response
  const sendMessage = useCallback(async (
    message: string,
    context?: Record<string, unknown>
  ) => {
    if (!userPublicKey || !activeChatId || streamingState.isStreaming) {
      return;
    }

    // Cancel any ongoing streaming
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessageId = crypto.randomUUID();
    const assistantMessageId = crypto.randomUUID();

    // Add user message immediately
    const userMessage: StreamingMessage = {
      id: userMessageId,
      role: "user",
      content: message.trim(),
      timestamp: Date.now(),
      isComplete: true,
      type: "text",
    };

    setSessions(prev => prev.map(session => 
      session.id === activeChatId 
        ? {
            ...session,
            messages: [...session.messages, userMessage],
            lastActivity: Date.now(),
          }
        : session
    ));

    // Show thinking state
    setIsThinking(true);

    // Add placeholder assistant message
    const assistantMessage: StreamingMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      isStreaming: false,
      isComplete: false,
      type: "text",
    };

    setSessions(prev => prev.map(session => 
      session.id === activeChatId 
        ? {
            ...session,
            messages: [...session.messages, assistantMessage],
            lastActivity: Date.now(),
          }
        : session
    ));

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      if (abortControllerRef.current.signal.aborted) return;

      setIsThinking(false);

      // Get AI response
      const response = await aiChatAction({
        userPublicKey,
        sessionId: activeChatId,
        message: message.trim(),
        context: {
          ...context,
          previousMessages: currentSession?.messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content,
          })) || [],
        },
      });

      if (abortControllerRef.current.signal.aborted) return;

      // Update message type based on response
      const messageType = (response.type as "text" | "analysis" | "recommendation") || "text";
      setSessions(prev => prev.map(session => 
        session.id === activeChatId 
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === assistantMessageId
                  ? { ...msg, type: messageType }
                  : msg
              ),
            }
          : session
      ));

      // Start streaming the response
      simulateStreaming(response.response, assistantMessageId, () => {
        // Update session title if it's the first real conversation
        if (currentSession?.messages.length === 3) { // Welcome + user + assistant
          const title = message.length > 30 
            ? message.substring(0, 30) + "..." 
            : message;
          
          setSessions(prev => prev.map(session => 
            session.id === activeChatId 
              ? { ...session, title }
              : session
          ));
        }
      });

    } catch (error) {
      console.error("AI chat error:", error);
      setIsThinking(false);
      
      if (abortControllerRef.current?.signal.aborted) return;

      // Show error message
      const errorMessage = error instanceof Error 
        ? error.message 
        : "I apologize, but I'm experiencing technical difficulties. Please try again.";

      setSessions(prev => prev.map(session => 
        session.id === activeChatId 
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === assistantMessageId
                  ? { 
                      ...msg, 
                      content: errorMessage,
                      isComplete: true,
                      error: "Failed to get AI response",
                    }
                  : msg
              ),
              lastActivity: Date.now(),
            }
          : session
      ));
    }
  }, [userPublicKey, activeChatId, streamingState.isStreaming, aiChatAction, currentSession, simulateStreaming]);

  // Stop streaming
  const stopStreaming = useCallback(() => {
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setStreamingState({
      isStreaming: false,
      currentMessageId: null,
      streamingContent: "",
      error: null,
    });
    setIsThinking(false);

    // Mark current streaming message as complete
    if (streamingState.currentMessageId) {
      setSessions(prev => prev.map(session => 
        session.id === activeChatId 
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === streamingState.currentMessageId
                  ? { ...msg, isStreaming: false, isComplete: true }
                  : msg
              ),
            }
          : session
      ));
    }
  }, [activeChatId, streamingState.currentMessageId]);

  // Create new chat session
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      messages: [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Hi! I'm ready to help you with your trading questions. What would you like to know?",
          timestamp: Date.now(),
          isComplete: true,
          type: "text",
        },
      ],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      title: "New Chat",
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveChatId(newSession.id);
    return newSession.id;
  }, []);

  // Switch to different session
  const switchSession = useCallback((sessionId: string) => {
    stopStreaming();
    setActiveChatId(sessionId);
  }, [stopStreaming]);

  // Delete session
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      
      // If we deleted the active session, switch to another one
      if (sessionId === activeChatId) {
        const nextSession = filtered[0];
        setActiveChatId(nextSession?.id || null);
      }
      
      return filtered;
    });
  }, [activeChatId]);

  // Clear current session
  const clearCurrentSession = useCallback(() => {
    if (!activeChatId) return;

    setSessions(prev => prev.map(session => 
      session.id === activeChatId 
        ? {
            ...session,
            messages: [
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Chat cleared! How can I help you today?",
                timestamp: Date.now(),
                isComplete: true,
                type: "text",
              },
            ],
            lastActivity: Date.now(),
            title: "New Chat",
          }
        : session
    ));
  }, [activeChatId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Session management
    sessions,
    currentSession,
    activeChatId,
    createNewSession,
    switchSession,
    deleteSession,
    clearCurrentSession,

    // Chat functionality
    sendMessage,
    stopStreaming,

    // State
    isInitializing,
    isThinking,
    isStreaming: streamingState.isStreaming,
    streamingContent: streamingState.streamingContent,
    hasError: !!streamingState.error,
    error: streamingState.error,

    // Computed
    canSendMessage: !streamingState.isStreaming && !isThinking && !!userPublicKey,
    messageCount: currentSession?.messages.length || 0,
  };
};
