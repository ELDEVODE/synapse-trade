'use client';

import { useCallback, useEffect } from 'react';
import { contractService } from '@/lib/contracts';
import { useConvexPositions } from './useConvexStellar';
import { useWallet } from '@/providers/WalletProvider';

// Combined hook for trading positions that integrates blockchain and Convex
export function useTradingPositions() {
  const { publicKey } = useWallet();
  const convexPositions = useConvexPositions();

  // Set up Convex callback for contract service
  useEffect(() => {
    if (convexPositions.recordPosition) {
      contractService.setConvexCallback(async (positionData) => {
        await convexPositions.recordPosition(positionData);
      });
    }
  }, [convexPositions.recordPosition]);

  // Sync positions from blockchain to Convex
  const syncPositions = useCallback(async () => {
    if (!publicKey || !convexPositions.syncFromBlockchain) return;

    try {
      console.log('🔄 Syncing positions from blockchain to Convex');
      const blockchainPositions = await contractService.getUserPositions(publicKey);
      
      if (blockchainPositions.length > 0) {
        // Convert ContractPosition to BlockchainPosition format
        const convertedPositions = blockchainPositions.map(pos => ({
          id: pos.id,
          user: pos.user,
          asset: pos.asset,
          size: parseFloat(pos.size),
          entryPrice: parseFloat(pos.entryPrice),
          leverage: pos.leverage,
          collateral: parseFloat(pos.collateral),
          isOpen: pos.isOpen,
          timestamp: pos.timestamp
        }));
        
        const result = await convexPositions.syncFromBlockchain(convertedPositions);
        console.log('✅ Sync completed:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ Error syncing positions:', error);
    }
  }, [publicKey, convexPositions.syncFromBlockchain]);

  // Open a new position (writes to both blockchain and Convex)
  const openPosition = useCallback(async (params: {
    asset: string;
    size: string;
    leverage: number;
    collateral: string;
    isLong: boolean;
  }) => {
    try {
      console.log('🚀 Opening position with dual tracking (blockchain + Convex)');
      
      const txHash = await contractService.openPosition(
        params.asset,
        params.size,
        params.leverage,
        params.collateral,
        params.isLong
      );

      console.log('✅ Position opened successfully:', txHash);
      
      // Sync positions from blockchain to Convex after a short delay
      setTimeout(async () => {
        try {
          await syncPositions();
          console.log('📊 Positions synced to Convex after opening');
        } catch (syncError) {
          console.error('⚠️ Failed to sync positions after opening:', syncError);
        }
      }, 3000); // Wait 3 seconds for transaction to be processed
      
      return txHash;
    } catch (error) {
      console.error('❌ Failed to open position:', error);
      throw error;
    }
  }, [syncPositions]);

  // Close a position
  const closePosition = useCallback(async (positionId: string) => {
    try {
      console.log('🔒 Closing position with dual tracking');
      
      const txHash = await contractService.closePosition(positionId);
      
      // Update position in Convex as closed
      if (convexPositions.closeUserPosition) {
        await convexPositions.closeUserPosition({
          positionId,
          closePrice: "0", // Will be updated with actual close price
          pnl: "0", // Will be calculated
          txHash,
        });
      }

      console.log('✅ Position closed successfully:', txHash);
      return txHash;
    } catch (error) {
      console.error('❌ Failed to close position:', error);
      throw error;
    }
  }, [convexPositions.closeUserPosition]);

  // Get positions (prioritizes Convex for real-time updates, falls back to blockchain)
  const getPositions = useCallback(async () => {
    try {
      // First try to get from Convex (faster, real-time)
      if (convexPositions.positions && convexPositions.positions.length > 0) {
        console.log('📊 Returning positions from Convex database');
        return convexPositions.positions.map(pos => ({
          id: pos.positionId,
          user: pos.userPublicKey,
          asset: pos.asset,
          size: pos.size,
          collateral: pos.collateral,
          entryPrice: pos.entryPrice,
          leverage: pos.leverage,
          timestamp: pos.timestamp,
          isOpen: pos.isOpen,
          pnl: pos.pnl,
        }));
      }

      // Fallback to blockchain if Convex is empty
      if (publicKey) {
        console.log('🔗 Fetching positions from blockchain as fallback');
        const blockchainPositions = await contractService.getUserPositions(publicKey);
        
        // Sync blockchain positions to Convex for future queries
        if (blockchainPositions.length > 0 && convexPositions.syncFromBlockchain) {
          // Convert ContractPosition to BlockchainPosition format
          const convertedPositions = blockchainPositions.map(pos => ({
            id: pos.id,
            user: pos.user,
            asset: pos.asset,
            size: parseFloat(pos.size),
            entryPrice: parseFloat(pos.entryPrice),
            leverage: pos.leverage,
            collateral: parseFloat(pos.collateral),
            isOpen: pos.isOpen,
            timestamp: pos.timestamp
          }));
          
          await convexPositions.syncFromBlockchain(convertedPositions);
        }
        
        return blockchainPositions;
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting positions:', error);
      return [];
    }
  }, [publicKey, convexPositions.positions, convexPositions.syncFromBlockchain]);

  // Get portfolio summary
  const getPortfolioSummary = useCallback(() => {
    return convexPositions.portfolioSummary;
  }, [convexPositions.portfolioSummary]);

  return {
    // Position operations
    openPosition,
    closePosition,
    getPositions,
    syncPositions,
    
    // Data from Convex (real-time)
    positions: convexPositions.positions || [],
    portfolioSummary: convexPositions.portfolioSummary,
    
    // Loading states
    isLoading: convexPositions.isLoading,
    
    // Utility functions
    getPortfolioSummary,
  };
}

// Hook specifically for position display in components
export function usePositionDisplay() {
  const { positions, portfolioSummary, isLoading, syncPositions } = useTradingPositions();

  // Auto-sync positions on mount
  useEffect(() => {
    syncPositions();
  }, [syncPositions]);

  // Transform positions for display
  const displayPositions = positions.map(position => ({
    ...position,
    // Calculate current PnL based on market prices (simplified)
    currentPnL: position.pnl || "0",
    // Add display formatting
    sizeFormatted: `${parseFloat(position.size) > 0 ? '+' : ''}${position.size}`,
    leverageFormatted: `${position.leverage}x`,
    // Add status indicators
    status: position.isOpen ? 'Open' : 'Closed',
    direction: parseFloat(position.size) > 0 ? 'Long' : 'Short',
  }));

  return {
    positions: displayPositions,
    portfolioSummary,
    isLoading,
    hasPositions: displayPositions.length > 0,
    openPositions: displayPositions.filter(p => p.isOpen),
    closedPositions: displayPositions.filter(p => !p.isOpen),
  };
}
