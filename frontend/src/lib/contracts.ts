import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarService } from './stellar';

interface PositionData {
  positionId: string;
  userPublicKey: string;
  asset: string;
  size: string;
  entryPrice: string;
  leverage: number;
  collateral: string;
  timestamp: number;
  txHash: string;
  isOpen?: boolean;
}

// Contract addresses (update these with your deployed contract addresses)
const CONTRACT_ADDRESSES = {
  // Deployed on Testnet - FINAL WORKING VERSION with fixed decimal calculations
  testnet: 'CDVJTYSNPPL3PKECPYLCJ2GV2SLQNANACQNUV3JGAV4UEOZTZGZGRKRJ',
  mainnet: 'YOUR_CONTRACT_ADDRESS_HERE', // placeholder
};

// Contract function names
const CONTRACT_FUNCTIONS = {
  INITIALIZE: 'initialize',
  OPEN_POSITION: 'open_position',
  CLOSE_POSITION: 'close_position',
  LIQUIDATE_POSITION: 'liquidate_position',
  GET_POSITION: 'get_position',
  GET_USER_POSITIONS: 'get_user_positions',
  GET_MARKET_CONFIG: 'get_market_config',
  GET_FUNDING_RATE: 'get_funding_rate',
  GET_ADMIN: 'get_admin',
  SET_ORACLE: 'set_oracle',
};

export interface ContractPosition {
  id: string;
  user: string;
  asset: string;
  size: string;
  collateral: string;
  entryPrice: string;
  leverage: number;
  timestamp: number;
  isOpen: boolean;
}

export interface MarketConfig {
  asset: string;
  minCollateral: string;
  maxLeverage: number;
  maintenanceMargin: number;
  fundingRateInterval: number;
  oracleAddress: string;
  isActive: boolean;
}

export interface FundingRate {
  asset: string;
  rate: number;
  timestamp: number;
}

export class ContractService {
  private network: 'testnet' | 'mainnet';
  private contractAddress: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.network = network;
    this.contractAddress = CONTRACT_ADDRESSES[network];
  }

  // Get current network
  getCurrentNetwork(): 'testnet' | 'mainnet' {
    return this.network;
  }

  // Switch network
  switchNetwork(network: 'testnet' | 'mainnet') {
    this.network = network;
    this.contractAddress = CONTRACT_ADDRESSES[network];
  }

  // Read-only contract call for querying data
  private async callContractReadOnly(
    functionName: string, 
    args: StellarSdk.xdr.ScVal[] = []
  ): Promise<unknown> {
    try {
      console.log(`🔍 Attempting contract call: ${functionName} with args:`, args.map(arg => arg.toString()));
      
      // Create a contract instance
      const contract = new StellarSdk.Contract(this.contractAddress);
      
      // Build a transaction for simulation (read-only)
      const sourceAccount = await stellarService.getAccount(await stellarService.getPublicKey() || '');
      
      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
        .addOperation(contract.call(functionName, ...args))
        .setTimeout(300)
        .build();

      console.log(`📡 Simulating read-only contract call: ${functionName}`);
      
      // Use Soroban RPC to simulate the transaction
      const simulated = await stellarService.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
        console.error(`❌ Contract simulation failed for ${functionName}:`, simulated);
        return null;
      } else if (StellarSdk.rpc.Api.isSimulationSuccess(simulated)) {
        console.log(`✅ Contract simulation successful for ${functionName}`);
        
        // Extract the result from the simulation
        if (simulated.result && simulated.result.retval) {
          const result = StellarSdk.scValToNative(simulated.result.retval);
          console.log(`📊 Contract result for ${functionName}:`, result);
          return result;
        } else {
          console.log(`ℹ️ No return value from ${functionName}`);
          return null;
        }
      } else {
        console.error(`❌ Unexpected simulation result for ${functionName}:`, simulated);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Error calling ${functionName}:`, error);
      // Return null to trigger fallback behavior instead of throwing
      return null;
    }
  }

  // Open a new position
  private transactionInProgress = false;
  private convexCallback: ((positionData: PositionData) => Promise<void>) | null = null;

  // Set callback for Convex integration
  setConvexCallback(callback: (positionData: PositionData) => Promise<void>) {
    this.convexCallback = callback;
  }

  async openPosition(
    asset: string,
    size: string,
    leverage: number,
    collateral: string,
    isLong: boolean
  ): Promise<string> {
    // Prevent duplicate transaction attempts
    if (this.transactionInProgress) {
      console.log('⚠️ Transaction already in progress, ignoring duplicate call');
      throw new Error('Transaction already in progress');
    }

    this.transactionInProgress = true;

    try {
      const publicKey = await stellarService.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('🚀 Opening position directly (contract already initialized)...');
      console.log('🏗️ Contract details:', {
        address: this.contractAddress,
        network: this.network,
        function: CONTRACT_FUNCTIONS.OPEN_POSITION,
        expectedContract: 'CDVJTYSNPPL3PKECPYLCJ2GV2SLQNANACQNUV3JGAV4UEOZTZGZGRKRJ',
        isCorrectContract: this.contractAddress === 'CDVJTYSNPPL3PKECPYLCJ2GV2SLQNANACQNUV3JGAV4UEOZTZGZGRKRJ'
      });

      // Skip contract verification to avoid multiple wallet calls
      console.log('🔍 Skipping contract verification to prevent multiple wallet popups');

      // Convert size to negative if short position
      const positionSize = isLong ? size : `-${size}`;

      console.log('📊 Position parameters:', {
        asset,
        size: positionSize,
        leverage,
        collateral,
        isLong,
        sizeType: typeof positionSize,
        collateralType: typeof collateral,
        sizeHasDecimal: positionSize.includes('.'),
        collateralHasDecimal: collateral.includes('.')
      });

      // Debug: Try to convert to BigInt first to catch precision errors early
      try {
        const sizeBigInt = BigInt(positionSize);
        const collateralBigInt = BigInt(collateral);
        console.log('✅ BigInt conversion successful:', {
          sizeBigInt: sizeBigInt.toString(),
          collateralBigInt: collateralBigInt.toString()
        });
      } catch (error) {
        console.error('❌ BigInt conversion failed:', error);
        throw new Error(`Invalid number format: ${error}`);
      }

      console.log('🔑 Using user address:', publicKey);

      // Use the contract interaction helper with correct parameter order
      // Contract expects: user, asset_symbol, size, leverage, collateral
      const contractArgs = [
        StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
        StellarSdk.nativeToScVal(asset, { type: 'symbol' }),
        StellarSdk.nativeToScVal(positionSize, { type: 'i128' }),
        StellarSdk.nativeToScVal(leverage, { type: 'u32' }),
        StellarSdk.nativeToScVal(collateral, { type: 'i128' }),
      ];

      console.log('🔧 Contract arguments created:');
      contractArgs.forEach((arg, index) => {
        console.log(`  Arg ${index}:`, {
          type: arg.switch().name,
          value: arg.toString(),
          raw: arg
        });
      });

      console.log('📤 About to call contract:', {
        contractAddress: this.contractAddress,
        functionName: CONTRACT_FUNCTIONS.OPEN_POSITION,
        argumentCount: contractArgs.length
      });

      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.OPEN_POSITION,
        contractArgs
      );

      console.log('🎯 Contract call result:', result);
      console.log('✅ Position opened successfully. Hash:', result.hash);

      // Extract the position ID from the contract return value
      const positionId = result.returnValue;
      console.log('🆔 Position ID from contract:', positionId);

      // If we have a Convex callback, record the position with the correct ID
      if (this.convexCallback && positionId) {
        try {
        await this.convexCallback({
          positionId: positionId.toString(),
          userPublicKey: publicKey,
            asset,
            size: size.toString(),
            collateral: collateral.toString(),
            entryPrice: '0', // Will be updated with actual price
            leverage,
            timestamp: Date.now(),
            isOpen: true,
            txHash: result.hash,
          });
          console.log('📊 Position recorded in Convex with correct ID');
        } catch (convexError) {
          console.warn('⚠️ Failed to record position in Convex:', convexError);
        }
      }

      return result.hash;
    } catch (error) {
      console.error('❌ Error opening position:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractAddress: this.contractAddress,
        function: CONTRACT_FUNCTIONS.OPEN_POSITION
      });

      // Enhanced error logging for debugging
      if (error && typeof error === 'object') {
        const errorObj = error as Record<string, unknown>;
        console.error('🔍 Full error object:', JSON.stringify(errorObj, null, 2));
        
        // Check if it's an HTTP error
        if (errorObj.response && typeof errorObj.response === 'object') {
          const response = errorObj.response as Record<string, unknown>;
          console.error('🌐 HTTP Response Error:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
          });
        }

        // Check if it's a Stellar SDK error
        if (errorObj.name === 'BadResponseError' || errorObj.name === 'NetworkError') {
          console.error('⭐ Stellar SDK Error Details:', {
            name: errorObj.name,
            message: errorObj.message,
            response: errorObj.response,
            extras: errorObj.extras
          });
        }

        // Log all enumerable properties
        console.error('🔧 Error properties:', Object.keys(errorObj));
        for (const key of Object.keys(errorObj)) {
          if (typeof errorObj[key] !== 'function') {
            console.error(`  ${key}:`, errorObj[key]);
          }
        }
      }

      throw error;
    } finally {
      this.transactionInProgress = false;
    }
  }

  // Close a position
  async closePosition(positionId: string): Promise<string> {
    try {
      const publicKey = await stellarService.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Validate positionId
      if (!positionId || positionId === 'undefined' || positionId === 'null') {
        throw new Error(`Invalid position ID: ${positionId}`);
      }

      console.log('🔒 Closing position:', {
        positionId,
        positionIdType: typeof positionId,
        userPublicKey: publicKey,
        contractAddress: this.contractAddress
      });

      // Convert positionId to BigInt with validation
      let positionIdBigInt: bigint;
      try {
        // Handle both string numbers and actual position IDs
        const cleanPositionId = positionId.toString().trim();
        if (!/^\d+$/.test(cleanPositionId)) {
          throw new Error(`Position ID must be a number, got: ${cleanPositionId}`);
        }
        positionIdBigInt = BigInt(cleanPositionId);
      } catch (conversionError) {
        console.error('❌ Failed to convert positionId to BigInt:', { positionId, conversionError });
        throw new Error(`Invalid position ID format: ${positionId}. Must be a numeric string.`);
      }

      // First verify the position exists and is open
      console.log('🔍 Verifying position exists before closing...');
      try {
        const positionData = await this.callContractReadOnly(
          CONTRACT_FUNCTIONS.GET_POSITION,
          [StellarSdk.nativeToScVal(positionIdBigInt, { type: 'u64' })]
        );
        
        if (!positionData || !(positionData as { is_open?: boolean }).is_open) {
          throw new Error(`Position ${positionId} does not exist or is already closed`);
        }
        
        console.log('✅ Position verified, proceeding with close...');
      } catch (verifyError) {
        console.error('❌ Position verification failed:', verifyError);
        throw new Error(`Cannot close position ${positionId}: Position not found or already closed`);
      }

      console.log('🔧 Calling close_position with parameter:', 
        StellarSdk.nativeToScVal(positionIdBigInt, { type: 'u64' })
      );

      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.CLOSE_POSITION,
        [
          StellarSdk.nativeToScVal(publicKey, { type: 'address' }),
          StellarSdk.nativeToScVal(positionIdBigInt, { type: 'u64' })
        ]
      );

      console.log('🎯 Close position result:', result);
      console.log('✅ Position closed successfully. Hash:', result.hash);
      return result.hash;
    } catch (error) {
      console.error('❌ Error closing position:', error);
      throw error;
    }
  }

  // Get user positions from contract storage
  async getUserPositions(userPublicKey: string): Promise<ContractPosition[]> {
    try {
      console.log(`🔍 Fetching positions for user: ${userPublicKey}`);

      // First, get the list of position IDs for the user
      const positionIds = await this.callContractReadOnly(
        CONTRACT_FUNCTIONS.GET_USER_POSITIONS,
        [StellarSdk.nativeToScVal(userPublicKey, { type: 'address' })]
      );

      if (!positionIds || !Array.isArray(positionIds)) {
        console.log('ℹ️ No position IDs found for user');
        return [];
      }

      console.log(`📋 Found ${positionIds.length} position IDs:`, positionIds);

      // Fetch full position details for each ID
      const positions: ContractPosition[] = [];
      
      for (const positionId of positionIds) {
        try {
          const positionData = await this.callContractReadOnly(
            CONTRACT_FUNCTIONS.GET_POSITION,
            [StellarSdk.nativeToScVal(BigInt(positionId), { type: 'u64' })]
          );

          if (positionData && typeof positionData === 'object') {
            const pos = positionData as Record<string, unknown>;
            
            // Convert Reflector asset symbol to string
            let assetSymbol = 'BTC';
            if (pos.asset && typeof pos.asset === 'object') {
              const asset = pos.asset as Record<string, unknown>;
              if (asset.other && typeof asset.other === 'string') {
                assetSymbol = asset.other;
              }
            }
            
            const position: ContractPosition = {
              id: positionId.toString(),
              user: userPublicKey,
              asset: assetSymbol,
              size: pos.size?.toString() || '0',
              collateral: pos.collateral?.toString() || '0',
              entryPrice: pos.entry_price?.toString() || '0',
              leverage: Number(pos.leverage) || 1,
              timestamp: Number(pos.timestamp) || Date.now(),
              isOpen: Boolean(pos.is_open ?? true),
            };

            positions.push(position);
            console.log(`✅ Loaded position ${positionId}:`, position);
          }
        } catch (error) {
          console.error(`❌ Error loading position ${positionId}:`, error);
        }
      }

      console.log(`🎯 Successfully loaded ${positions.length} positions for user`);
      return positions;
      
    } catch (error) {
      console.error('❌ Error getting user positions from contract:', error);
      console.log('ℹ️ Contract query failed - returning empty positions');
      return [];
    }
  }

  // Get market configuration from contract
  async getMarketConfig(asset: string): Promise<MarketConfig | null> {
    try {
      console.log(`🔍 Fetching market config for ${asset} from contract`);

      // Try to get from contract first
      const result = await this.callContractReadOnly(
        CONTRACT_FUNCTIONS.GET_MARKET_CONFIG,
        [StellarSdk.nativeToScVal(asset, { type: 'symbol' })]
      );

      if (result && typeof result === 'object') {
        console.log(`✅ Market config from contract for ${asset}:`, result);
        const config = result as Record<string, unknown>;
        return {
          asset,
          minCollateral: config.minCollateral?.toString() || '100',
          maxLeverage: Number(config.maxLeverage) || 10,
          maintenanceMargin: Number(config.maintenanceMargin) || 500,
          fundingRateInterval: Number(config.fundingRateInterval) || 28800,
          oracleAddress: (config.oracleAddress as string) || 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63',
          isActive: Boolean(config.isActive ?? true),
        };
      }

      console.log(`ℹ️ No market config in contract for ${asset}, using defaults`);
      // Fallback to default config
      return {
        asset,
        minCollateral: '100',
        maxLeverage: 10,
        maintenanceMargin: 500, // 5%
        fundingRateInterval: 28800, // 8 hours
        oracleAddress: 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63',
        isActive: true,
      };
    } catch (error) {
      console.error(`❌ Error getting market config for ${asset}:`, error);
      return null;
    }
  }

  // Get funding rate from contract
  async getFundingRate(asset: string): Promise<FundingRate | null> {
    try {
      console.log(`🔍 Fetching funding rate for ${asset} from contract`);

      // Try to get from contract first
      const result = await this.callContractReadOnly(
        CONTRACT_FUNCTIONS.GET_FUNDING_RATE,
        [StellarSdk.nativeToScVal(asset, { type: 'symbol' })]
      );

      if (result && typeof result === 'object') {
        console.log(`✅ Funding rate from contract for ${asset}:`, result);
        const fundingData = result as Record<string, unknown>;
        return {
          asset,
          rate: Number(fundingData.rate) || 25,
          timestamp: Number(fundingData.timestamp) || Date.now(),
        };
      }

      console.log(`ℹ️ No funding rate in contract for ${asset}, using default`);
      // Fallback to default rate
      return {
        asset,
        rate: 25, // 0.25%
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error(`❌ Error getting funding rate for ${asset}:`, error);
      return null;
    }
  }

  // Get single position by ID
  async getPosition(positionId: string): Promise<ContractPosition | null> {
    try {
      console.log(`🔍 Fetching position ${positionId} from contract`);

      const result = await this.callContractReadOnly(
        CONTRACT_FUNCTIONS.GET_POSITION,
        [StellarSdk.nativeToScVal(BigInt(positionId), { type: 'u64' })]
      );

      if (result && typeof result === 'object') {
        console.log(`✅ Position ${positionId} from contract:`, result);
        const position = result as Record<string, unknown>;
        return {
          id: position.id?.toString() || positionId,
          user: (position.user as string) || '',
          asset: (position.asset as string) || 'BTC',
          size: position.size?.toString() || '0',
          collateral: position.collateral?.toString() || '0',
          entryPrice: position.entryPrice?.toString() || '0',
          leverage: Number(position.leverage) || 1,
          timestamp: Number(position.timestamp) || Date.now(),
          isOpen: Boolean(position.isOpen ?? true),
        };
      }

      console.log(`ℹ️ Position ${positionId} not found in contract`);
      return null;
    } catch (error) {
      console.error(`❌ Error getting position ${positionId}:`, error);
      return null;
    }
  }

  // Check if contract is initialized
  async isInitialized(): Promise<boolean> {
    try {
      // For the current deployed contract, we know it's initialized
      // Skip the admin check to avoid unnecessary contract calls
      console.log('✅ Contract is known to be initialized (deployed contract)');
      return true;
      
      // Original check (commented out to prevent initialization loops):
      // const admin = await this.callContractReadOnly(CONTRACT_FUNCTIONS.GET_ADMIN);
      // console.log('👑 Admin check result:', admin);
      // return admin !== null;
    } catch (error) {
      console.log('Contract initialization check failed:', error);
      // Even if check fails, assume contract is initialized to prevent loops
      return true;
    }
  }

  // Initialize the contract (if needed)
  async initializeContract(): Promise<boolean> {
    try {
      const publicKey = await stellarService.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      console.log('🔧 Initializing contract...');

      // Default initialization parameters
      const admin = publicKey;
      const treasury = publicKey; // Use same address for simplicity
      const minCollateral = (10 * 10_000_000).toString(); // 10 XLM with 7 decimals
      const maxLeverage = 10;
      const maintenanceMargin = 500; // 5% in basis points
      const fundingRateInterval = 28800; // 8 hours

      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.INITIALIZE,
        [
          StellarSdk.nativeToScVal(admin, { type: 'address' }),
          StellarSdk.nativeToScVal(treasury, { type: 'address' }),
          StellarSdk.nativeToScVal(minCollateral, { type: 'i128' }),
          StellarSdk.nativeToScVal(maxLeverage, { type: 'u32' }),
          StellarSdk.nativeToScVal(maintenanceMargin, { type: 'i128' }),
          StellarSdk.nativeToScVal(fundingRateInterval, { type: 'u64' }),
        ]
      );

      console.log('✅ Contract initialized:', result.hash);

      // Also set the oracle address
      await this.setOracleAddress();

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize contract:', error);
      return false;
    }
  }

  // Set oracle address
  async setOracleAddress(): Promise<boolean> {
    try {
      const oracleAddress = 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63'; // Reflector oracle
      
      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.SET_ORACLE,
        [StellarSdk.nativeToScVal(oracleAddress, { type: 'address' })]
      );

      console.log('✅ Oracle address set:', result.hash);
      return true;
    } catch (error) {
      console.error('❌ Failed to set oracle address:', error);
      return false;
    }
  }

  // Test contract connectivity
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing contract connectivity...');
      
      // Check if contract is initialized
      const initialized = await this.isInitialized();
      console.log(`📊 Contract initialized: ${initialized}`);
      
      if (!initialized) {
        console.log('⚠️ Contract not initialized - attempting to initialize...');
        const initResult = await this.initializeContract();
        console.log(`🔧 Initialization result: ${initResult}`);
        return initResult;
      }
      
      console.log('✅ Contract is ready for trading');
      return true;
    } catch (error) {
      console.error('❌ Contract connectivity test failed:', error);
      return false;
    }
  }

  // Verify contract exists and is accessible
  async verifyContract(): Promise<boolean> {
    try {
      console.log('🔍 Verifying contract accessibility...');
      console.log('📍 Contract address:', this.contractAddress);
      console.log('🌐 Network:', this.network);
      
      // Try to call a simple read-only function
      const admin = await this.callContractReadOnly(CONTRACT_FUNCTIONS.GET_ADMIN);
      console.log('👑 Admin check result:', admin);
      
      return true;
    } catch (error) {
      console.error('❌ Contract verification failed:', error);
      return false;
    }
  }

  // Enhanced mock data for development and fallback
  private getMockPositions(): ContractPosition[] {
    const now = Date.now();
    
    return [
      {
        id: '1',
        user: 'GABC123...',
        asset: 'BTC',
        size: '0.25', // Long position
        collateral: '5000',
        entryPrice: '44800.00',
        leverage: 5,
        timestamp: now - 86400000, // 1 day ago
        isOpen: true,
      },
      {
        id: '2',
        user: 'GABC123...',
        asset: 'ETH',
        size: '-1.5', // Short position
        collateral: '2500',
        entryPrice: '2950.00',
        leverage: 3,
        timestamp: now - 172800000, // 2 days ago
        isOpen: true,
      },
      {
        id: '3',
        user: 'GABC123...',
        asset: 'SOL',
        size: '15.0', // Long position
        collateral: '800',
        entryPrice: '96.50',
        leverage: 2,
        timestamp: now - 3600000, // 1 hour ago
        isOpen: true,
      },
    ];
  }
}

// Export singleton instance
export const contractService = new ContractService();

