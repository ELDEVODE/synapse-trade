'use client';

import { useState, useEffect, useCallback } from 'react';
import { stellarService } from '@/lib/stellar';
import { requestAccess } from '@stellar/freighter-api';

export interface WalletState {
  isConnected: boolean;
  publicKey: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    isLoading: true,
    error: null,
  });

  const checkConnection = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const isConnected = await stellarService.isWalletConnected();
      
      if (isConnected) {
        const publicKey = await stellarService.getPublicKey();
        setWalletState({
          isConnected: true,
          publicKey,
          isLoading: false,
          error: null,
        });
      } else {
        setWalletState({
          isConnected: false,
          publicKey: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      setWalletState({
        isConnected: false,
        publicKey: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setWalletState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Request access to Freighter
      const accessResult = await requestAccess();
      
      if (accessResult.error) {
        throw new Error(accessResult.error);
      }
      
      // Check connection after requesting access
      await checkConnection();
    } catch (error) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet',
      }));
    }
  }, [checkConnection]);

  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      publicKey: null,
      isLoading: false,
      error: null,
    });
  }, []);

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Check if Freighter is installed
  const isFreighterInstalled = useCallback(async () => {
    try {
      const result = await stellarService.isWalletConnected();
      return result;
    } catch {
      return false;
    }
  }, []);

  return {
    ...walletState,
    connect,
    disconnect,
    checkConnection,
    isFreighterInstalled: isFreighterInstalled(),
  };
}
