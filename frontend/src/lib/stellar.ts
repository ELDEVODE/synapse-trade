import * as StellarSdk from '@stellar/stellar-sdk';

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
      if (typeof window !== 'undefined' && window.freighter) {
        const result = await window.freighter.isConnected();
        return result;
      }
      return false;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  // Get user's public key from Freighter
  async getPublicKey(): Promise<string | null> {
    try {
      if (await this.isWalletConnected()) {
        if (typeof window !== 'undefined' && window.freighter) {
          const result = await window.freighter.getPublicKey();
          return result;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting public key:', error);
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
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase,
    })
      .setTimeout(300)
      .build();

    operations.forEach(op => transaction.operations.push(op));

    if (typeof window === 'undefined' || !window.freighter) {
      throw new Error('Freighter wallet not available');
    }
    
    const signedTransaction = await window.freighter.signTransaction(transaction.toXDR(), {
      networkPassphrase: networkPassphrase,
    });

    return StellarSdk.TransactionBuilder.fromXDR(signedTransaction, networkPassphrase);
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
