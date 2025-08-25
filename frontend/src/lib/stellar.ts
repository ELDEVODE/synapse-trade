import * as StellarSdk from '@stellar/stellar-sdk';
import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
  getNetwork,
  getNetworkDetails,
} from '@stellar/freighter-api';

// Configure for testnet - change to mainnet when ready
export const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
export const networkPassphrase = StellarSdk.Networks.TESTNET;

// Contract addresses - update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Add your contract addresses here when deployed
  // example: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};

export class StellarService {
  private server: StellarSdk.Horizon.Server;

  constructor() {
    this.server = server;
  }

  // Check if Freighter wallet is connected
  async isWalletConnected(): Promise<boolean> {
    try {
      const result = await isConnected();
      return result.isConnected;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  // Get user's public key from Freighter
  async getPublicKey(): Promise<string | null> {
    try {
      // First check if connected
      const connected = await isConnected();
      if (!connected.isConnected) {
        return null;
      }

      // Try to get address directly first
      const addressResult = await getAddress();
      if (addressResult.address && !addressResult.error) {
        return addressResult.address;
      }

      // If not allowed, request access
      const accessResult = await requestAccess();
      if (accessResult.address && !accessResult.error) {
        return accessResult.address;
      }

      return null;
    } catch (error) {
      console.error('Error getting public key:', error);
      return null;
    }
  }

  // Get network information
  async getNetworkInfo() {
    try {
      const networkResult = await getNetwork();
      const detailsResult = await getNetworkDetails();
      
      return {
        network: networkResult.network,
        networkPassphrase: networkResult.networkPassphrase,
        networkUrl: detailsResult.networkUrl,
        sorobanRpcUrl: detailsResult.sorobanRpcUrl,
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  // Get account details
  async getAccount(publicKey: string) {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error) {
      console.error('Error loading account:', error);
      throw error;
    }
  }

  // Build and sign transaction
  async buildAndSignTransaction(
    sourceAccount: StellarSdk.Account,
    operations: StellarSdk.Operation[]
  ): Promise<StellarSdk.Transaction | StellarSdk.FeeBumpTransaction> {
    const builder = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase,
    }).setTimeout(300);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    operations.forEach(op => builder.addOperation(op as unknown as any));

    const transaction = builder.build();

    try {
      const signedResult = await signTransaction(transaction.toXDR(), {
        networkPassphrase: networkPassphrase,
      });

      if (signedResult.error) {
        throw new Error(`Transaction signing failed: ${signedResult.error}`);
      }

      return StellarSdk.TransactionBuilder.fromXDR(signedResult.signedTxXdr, networkPassphrase);
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction with Freighter');
    }
  }

  // Submit transaction
  async submitTransaction(transaction: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction) {
    try {
      const result = await this.server.submitTransaction(transaction);
      console.log('Transaction successful:', result);
      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Contract interaction helper
  async callContract(
    contractAddress: string,
    functionName: string,
    args: StellarSdk.xdr.ScVal[] = []
  ) {
    try {
      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      const sourceAccount = await this.getAccount(publicKey);
      
      const contract = new StellarSdk.Contract(contractAddress);
      const operation = contract.call(functionName, ...args);

      const transaction = await this.buildAndSignTransaction(sourceAccount, [operation as unknown as StellarSdk.Operation]);
      return await this.submitTransaction(transaction);
    } catch (error) {
      console.error('Contract call failed:', error);
      throw error;
    }
  }
}

export const stellarService = new StellarService();
