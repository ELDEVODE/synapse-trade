import * as StellarSdk from '@stellar/stellar-sdk';
import {
  isConnected,
  getAddress,
  signTransaction,
  getNetwork,
  getNetworkDetails,
} from '@stellar/freighter-api';

// Configure for testnet - change to mainnet when ready
export const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
export const sorobanServer = new StellarSdk.rpc.Server('https://soroban-testnet.stellar.org');
export const networkPassphrase = StellarSdk.Networks.TESTNET;

// Contract addresses - update these with your deployed contract addresses
export const CONTRACT_ADDRESSES = {
  // Add your contract addresses here when deployed
  // example: 'CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
};

export class StellarService {
  private server: StellarSdk.Horizon.Server;
  private _sorobanServer: StellarSdk.rpc.Server;

  constructor() {
    this.server = server;
    this._sorobanServer = sorobanServer;
  }

  // Getter for soroban server (for contract read operations)
  get sorobanServer() {
    return this._sorobanServer;
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

      // Try to get address directly (this should not trigger a popup if already connected)
      const addressResult = await getAddress();
      if (addressResult.address && !addressResult.error) {
        return addressResult.address;
      }

      // If we can't get the address, return null instead of requesting access
      // This prevents popup on page load - access should be requested explicitly by user action
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
      console.log('🚀 Submitting transaction to Horizon...');
      console.log('📋 Transaction XDR:', transaction.toXDR());
      
      const result = await this.server.submitTransaction(transaction);
      console.log('✅ Transaction successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Transaction submission failed:', error);
      
      // Enhanced error logging for HTTP responses
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('🔍 Detailed error analysis:', {
          name: errorObj.name,
          message: errorObj.message,
          status: errorObj.status,
          statusCode: errorObj.statusCode,
          response: errorObj.response,
          data: errorObj.data,
          config: errorObj.config,
          request: errorObj.request && typeof errorObj.request === 'object' ? {
            url: (errorObj.request as Record<string, unknown>).url,
            method: (errorObj.request as Record<string, unknown>).method,
            headers: (errorObj.request as Record<string, unknown>).headers
          } : 'No request info'
        });

        // If it's a Horizon error, log the response data
        if (errorObj.response && typeof errorObj.response === 'object') {
          const response = errorObj.response as Record<string, unknown>;
          console.error('🌐 Horizon response data:', response.data);
          console.error('🌐 Horizon response status:', response.status);
          console.error('🌐 Horizon response headers:', response.headers);
          
          // Log detailed transaction failure information
          if (response.data && typeof response.data === 'object') {
            const data = response.data as Record<string, unknown>;
            if (data.extras) {
              console.error('🔍 Transaction failure extras:', data.extras);
              
              if (data.extras && typeof data.extras === 'object') {
                const extras = data.extras as Record<string, unknown>;
                if (extras.result_codes) {
                  console.error('📊 Result codes:', extras.result_codes);
                }
                
                if (extras.result_xdr) {
                  console.error('📋 Result XDR:', extras.result_xdr);
                }
                
                if (extras.envelope_xdr) {
                  console.error('📦 Envelope XDR:', extras.envelope_xdr);
                }
              }
            }
          }
        }

        // If it has extras (Stellar SDK specific)
        if (errorObj.extras) {
          console.error('🔧 Stellar SDK extras:', errorObj.extras);
        }

        // If it has result_codes (transaction specific)
        if (errorObj.extras && typeof errorObj.extras === 'object') {
          const extras = errorObj.extras as Record<string, unknown>;
          if (extras.result_codes) {
            console.error('📊 Result codes:', extras.result_codes);
          }
        }
      }
      
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
      console.log('🔧 callContract called with:', {
        contractAddress,
        functionName,
        args: args.map(arg => arg.toString())
      });

      const publicKey = await this.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('👤 User public key:', publicKey);

      const sourceAccount = await this.getAccount(publicKey);
      console.log('📊 Source account loaded:', {
        accountId: sourceAccount.accountId(),
        sequenceNumber: sourceAccount.sequenceNumber()
      });
      
      const contract = new StellarSdk.Contract(contractAddress);
      
      // Build the transaction first to get auth
      let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(contract.call(functionName, ...args))
        .setTimeout(300)
        .build();

      console.log('📝 Contract operation created:', {
        functionName,
        contractId: contract.contractId()
      });

      // Simulate to get auth requirements
      console.log('🔍 Simulating transaction for auth...');
      const simulated = await this._sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
        console.error('❌ Simulation failed:', simulated);
        throw new Error('Transaction simulation failed');
      } else if (StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
        // Apply the auth from simulation
        transaction = StellarSdk.rpc.assembleTransaction(transaction, simulated).build();
        console.log('✅ Auth applied from simulation');
      } else {
        console.error('❌ Unexpected simulation result:', simulated);
        throw new Error('Unexpected simulation result');
      }
      // Sign the transaction
      console.log('✍️ Signing transaction with Freighter...');
      const signedResult = await signTransaction(transaction.toXDR(), {
        networkPassphrase: StellarSdk.Networks.TESTNET,
        address: publicKey,
      });
      
      if (signedResult.error) {
        throw new Error(`Transaction signing failed: ${signedResult.error}`);
      }
      
      const finalTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedResult.signedTxXdr,
        StellarSdk.Networks.TESTNET
      );
      
      console.log('✍️ Transaction signed:', {
        hash: finalTransaction.hash(),
        fee: finalTransaction.fee,
        operations: finalTransaction.operations.length
      });

      const result = await this.submitTransaction(finalTransaction);
      console.log('🚀 Transaction submitted successfully:', {
        hash: result.hash,
        ledger: result.ledger
      });

      // Extract return value from simulation if available
      let returnValue = null;
      if (StellarSdk.rpc.Api.isSimulationSuccess(simulated) && simulated.result?.retval) {
        try {
          returnValue = StellarSdk.scValToNative(simulated.result.retval);
          console.log('📊 Contract return value:', returnValue);
        } catch (parseError) {
          console.warn('⚠️ Could not parse contract return value:', parseError);
        }
      }

      return {
        ...result,
        returnValue
      };
    } catch (error) {
      console.error('❌ Contract call failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractAddress,
        functionName
      });
      throw error;
    }
  }
}

export const stellarService = new StellarService();
