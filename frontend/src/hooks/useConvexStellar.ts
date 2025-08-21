'use client';

import { useCallback, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useWallet } from './useWallet';
// import type { Id } from '../../convex/_generated/dataModel';

// Hook for user management with Convex
export function useConvexUser() {
  const { publicKey, isConnected } = useWallet();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const getUserStats = useQuery(
    api.users.getUserStats, 
    publicKey ? { publicKey } : 'skip'
  );
  const updateProfile = useMutation(api.users.updateUserProfile);

  const initializeUser = useCallback(async (userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    if (!publicKey) return null;
    
    try {
      return await getOrCreateUser({
        publicKey,
        ...userInfo,
      });
    } catch (error) {
      console.error('Error initializing user:', error);
      return null;
    }
  }, [publicKey, getOrCreateUser]);

  const updateUserProfile = useCallback(async (userInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
  }) => {
    if (!publicKey) return null;
    
    try {
      return await updateProfile({
        publicKey,
        ...userInfo,
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
  }, [publicKey, updateProfile]);

  // Auto-initialize user when wallet connects
  useEffect(() => {
    if (isConnected && publicKey) {
      initializeUser();
    }
  }, [isConnected, publicKey, initializeUser]);

  return {
    userStats: getUserStats,
    initializeUser,
    updateUserProfile,
    isLoading: getUserStats === undefined && isConnected,
  };
}

// Hook for transaction management
export function useConvexTransactions() {
  const { publicKey } = useWallet();
  const recordTransaction = useMutation(api.transactions.recordTransaction);
  const updateTransactionStatus = useMutation(api.transactions.updateTransactionStatus);
  const userTransactions = useQuery(
    api.transactions.getUserTransactions,
    publicKey ? { userPublicKey: publicKey, limit: 20 } : 'skip'
  );
  const transactionStats = useQuery(
    api.transactions.getTransactionStats,
    publicKey ? { userPublicKey: publicKey } : 'skip'
  );

  const logTransaction = useCallback(async (txData: {
    hash: string;
    type: 'payment' | 'contract_call' | 'create_account' | 'other';
    amount?: string;
    asset?: string;
    sourceAccount: string;
    destinationAccount?: string;
    contractAddress?: string;
    functionName?: string;
    status: 'pending' | 'success' | 'failed';
    ledger?: number;
    stellarCreatedAt?: string;
    memo?: string;
    fee?: string;
  }) => {
    if (!publicKey) return null;

    try {
      return await recordTransaction({
        ...txData,
        userPublicKey: publicKey,
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
      return null;
    }
  }, [publicKey, recordTransaction]);

  const updateTransaction = useCallback(async (params: {
    hash: string;
    status: 'pending' | 'success' | 'failed';
    ledger?: number;
    stellarCreatedAt?: string;
  }) => {
    try {
      return await updateTransactionStatus(params);
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }, [updateTransactionStatus]);

  return {
    transactions: userTransactions || [],
    stats: transactionStats,
    logTransaction,
    updateTransaction,
    isLoading: userTransactions === undefined && publicKey !== null,
  };
}

// Hook for contract management
export function useConvexContracts() {
  const { publicKey } = useWallet();
  const registerContract = useMutation(api.contracts.registerContract);
  const recordInteraction = useMutation(api.contracts.recordContractInteraction);
  const addToFavorites = useMutation(api.contracts.addToFavorites);
  
  const allContracts = useQuery(api.contracts.getContracts, { 
    network: 'testnet', 
    isActive: true 
  });
  const userContracts = useQuery(
    api.contracts.getUserContracts,
    publicKey ? { deployerPublicKey: publicKey } : 'skip'
  );
  const favoriteContracts = useQuery(
    api.contracts.getUserFavorites,
    publicKey ? { userPublicKey: publicKey } : 'skip'
  );
  const contractInteractions = useQuery(
    api.contracts.getContractInteractions,
    publicKey ? { callerPublicKey: publicKey, limit: 20 } : 'skip'
  );

  const deployContract = useCallback(async (contractData: {
    address: string;
    name: string;
    description?: string;
    deploymentTxHash: string;
    abi?: string;
    sourceCode?: string;
    network: 'testnet' | 'mainnet';
    version?: string;
  }) => {
    if (!publicKey) return null;

    try {
      return await registerContract({
        ...contractData,
        deployerPublicKey: publicKey,
      });
    } catch (error) {
      console.error('Error registering contract:', error);
      return null;
    }
  }, [publicKey, registerContract]);

  const logContractInteraction = useCallback(async (interactionData: {
    contractAddress: string;
    functionName: string;
    txHash: string;
    parameters?: string;
    result?: string;
    gasUsed?: number;
    status: 'pending' | 'success' | 'failed';
    errorMessage?: string;
  }) => {
    if (!publicKey) return null;

    try {
      return await recordInteraction({
        ...interactionData,
        callerPublicKey: publicKey,
      });
    } catch (error) {
      console.error('Error logging contract interaction:', error);
      return null;
    }
  }, [publicKey, recordInteraction]);

  const addContractToFavorites = useCallback(async (contractData: {
    contractAddress: string;
    name?: string;
    notes?: string;
  }) => {
    if (!publicKey) return null;

    try {
      return await addToFavorites({
        userPublicKey: publicKey,
        ...contractData,
      });
    } catch (error) {
      console.error('Error adding contract to favorites:', error);
      return null;
    }
  }, [publicKey, addToFavorites]);

  return {
    allContracts: allContracts || [],
    userContracts: userContracts || [],
    favoriteContracts: favoriteContracts || [],
    interactions: contractInteractions || [],
    deployContract,
    logContractInteraction,
    addContractToFavorites,
    isLoading: (allContracts === undefined || userContracts === undefined) && publicKey !== null,
  };
}

// Integrated hook that combines Stellar operations with Convex logging
export function useStellarWithConvex() {
  const wallet = useWallet();
  const { logTransaction, updateTransaction } = useConvexTransactions();
  const { logContractInteraction } = useConvexContracts();
  const { initializeUser } = useConvexUser();

  // Enhanced transaction logging
  const executeAndLogTransaction = useCallback(async (
    stellarTransaction: () => Promise<unknown>,
    transactionInfo: {
      type: 'payment' | 'contract_call' | 'create_account' | 'other';
      amount?: string;
      asset?: string;
      destinationAccount?: string;
      contractAddress?: string;
      functionName?: string;
      memo?: string;
    }
  ) => {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      // Execute the Stellar transaction
      const result = await stellarTransaction();
      const txHash = (result as { hash: string }).hash;

      // Log as pending in Convex
      await logTransaction({
        hash: txHash,
        sourceAccount: wallet.publicKey,
        status: 'pending',
        ...transactionInfo,
      });

      // Wait for confirmation (simplified - in production you'd poll Stellar)
      // For now, we'll assume success after a short delay
      setTimeout(async () => {
        try {
          await updateTransaction({
            hash: txHash,
            status: 'success',
            ledger: (result as { ledger?: number }).ledger,
            stellarCreatedAt: new Date().toISOString(),
          });

          // Log contract interaction if it's a contract call
          if (transactionInfo.type === 'contract_call' && 
              transactionInfo.contractAddress && 
              transactionInfo.functionName) {
            await logContractInteraction({
              contractAddress: transactionInfo.contractAddress,
              functionName: transactionInfo.functionName,
              txHash: txHash,
              status: 'success',
            });
          }
        } catch (error) {
          console.error('Error updating transaction status:', error);
          await updateTransaction({
            hash: txHash,
            status: 'failed',
          });
        }
      }, 2000); // 2 second delay for demo purposes

      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }, [wallet.publicKey, logTransaction, updateTransaction, logContractInteraction]);

  return {
    ...wallet,
    executeAndLogTransaction,
    initializeUser,
  };
}
