'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { OracleService } from '../lib/oracle';

export interface MarketData {
  symbol: string;
  price: string;
  change24h: number;
  volume24h: string;
  high24h: string;
  low24h: string;
  isStale: boolean;
  lastUpdated: number;
}

export interface OraclePricesState {
  marketData: MarketData[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
}

const SUPPORTED_ASSETS = ['BTC', 'ETH', 'SOL'];
const UPDATE_INTERVAL = 15000; // 15 seconds for real oracle calls
const RETRY_INTERVAL = 3000; // 3 seconds on error
const MAX_RETRIES = 3;

export function useOraclePrices() {
  const [state, setState] = useState<OraclePricesState>({
    marketData: [],
    isLoading: true,
    error: null,
    lastUpdate: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);

  const fetchPrices = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const responses = await OracleService.getMultipleAssetPrices(SUPPORTED_ASSETS);
      const now = Date.now();

      const marketData: MarketData[] = SUPPORTED_ASSETS.map(symbol => {
        const response = responses[symbol];
        
        if (response.success && response.data) {
          const priceData = response.data;
          const isStale = OracleService.isPriceStale(priceData.timestamp);
          
          return {
            symbol,
            price: OracleService.formatPrice(priceData.price, symbol),
            change24h: OracleService.calculateChange24h(priceData.price, symbol),
            volume24h: generateMockVolume(symbol),
            high24h: generateMockHigh(priceData.price),
            low24h: generateMockLow(priceData.price),
            isStale,
            lastUpdated: priceData.timestamp * 1000, // Convert to milliseconds
          };
        } else {
          // Fallback to previous data or mock data if oracle fails
          return {
            symbol,
            price: getMockPrice(symbol),
            change24h: 0,
            volume24h: generateMockVolume(symbol),
            high24h: getMockPrice(symbol),
            low24h: getMockPrice(symbol),
            isStale: true,
            lastUpdated: now,
          };
        }
      });

      setState({
        marketData,
        isLoading: false,
        error: null,
        lastUpdate: now,
      });

      // Clear retry count and timeout since we succeeded
      retryCountRef.current = 0;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch prices';
      console.error('Error fetching oracle prices:', error);
      
      retryCountRef.current += 1;
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: `${errorMessage} (retry ${retryCountRef.current}/${MAX_RETRIES})`,
      }));

      // Retry with exponential backoff, up to MAX_RETRIES
      if (retryCountRef.current < MAX_RETRIES) {
        const backoffDelay = RETRY_INTERVAL * Math.pow(2, retryCountRef.current - 1);
        console.log(`🔄 Retrying in ${backoffDelay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        retryTimeoutRef.current = setTimeout(fetchPrices, backoffDelay);
      } else {
        console.log(`⛔ Max retries (${MAX_RETRIES}) reached, stopping automatic retries`);
      }
    }
  }, []);

  const startPriceUpdates = useCallback(() => {
    // Initial fetch
    fetchPrices();

    // Set up regular updates
    intervalRef.current = setInterval(fetchPrices, UPDATE_INTERVAL);
  }, [fetchPrices]);

  const stopPriceUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const refreshPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  const getAssetPrice = useCallback((symbol: string): MarketData | null => {
    return state.marketData.find(asset => asset.symbol === symbol) || null;
  }, [state.marketData]);

  useEffect(() => {
    startPriceUpdates();

    return () => {
      stopPriceUpdates();
    };
  }, [startPriceUpdates, stopPriceUpdates]);

  return {
    ...state,
    refreshPrices,
    getAssetPrice,
    isUpdating: state.isLoading,
  };
}

// Helper functions for mock data when oracle is unavailable
function getMockPrice(symbol: string): string {
  const mockPrices = {
    BTC: '45250.00',
    ETH: '2890.50',
    SOL: '98.75',
  };
  return mockPrices[symbol as keyof typeof mockPrices] || '0.00';
}

function generateMockVolume(symbol: string): string {
  const volumes = {
    BTC: '1.2B',
    ETH: '890M',
    SOL: '156M',
  };
  return volumes[symbol as keyof typeof volumes] || '0';
}

function generateMockHigh(price: string): string {
  const numPrice = parseFloat(price);
  return (numPrice * 1.02).toFixed(2); // 2% higher
}

function generateMockLow(price: string): string {
  const numPrice = parseFloat(price);
  return (numPrice * 0.98).toFixed(2); // 2% lower
}
