'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useWallet as useWalletHook, WalletState } from '@/hooks/useWallet';

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  checkConnection: () => Promise<void>;
  isFreighterInstalled: Promise<boolean>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const walletHook = useWalletHook();

  return (
    <WalletContext.Provider value={walletHook}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
