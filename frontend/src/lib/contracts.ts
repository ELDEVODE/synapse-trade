import * as StellarSdk from '@stellar/stellar-sdk';
import { stellarService } from './stellar';

// Contract addresses (update these with your deployed contract addresses)
const CONTRACT_ADDRESSES = {
  // Deployed on Testnet
  testnet: 'CCRVMADMEJ2IB4WV7BZJJSBL5JSTNLMPGVE43AWLFDFSAKYLOWZSAK6Z',
  mainnet: 'YOUR_CONTRACT_ADDRESS_HERE', // placeholder
};

// Contract function names
const CONTRACT_FUNCTIONS = {
  OPEN_POSITION: 'open_position',
  CLOSE_POSITION: 'close_position',
  LIQUIDATE_POSITION: 'liquidate_position',
  GET_POSITION: 'get_position',
  GET_USER_POSITIONS: 'get_user_positions',
  GET_MARKET_CONFIG: 'get_market_config',
  GET_FUNDING_RATE: 'get_funding_rate',
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

  // Open a new position
  async openPosition(
    asset: string,
    size: string,
    collateral: string,
    leverage: number,
    isLong: boolean
  ): Promise<string> {
    try {
      const publicKey = await stellarService.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Convert size to negative if short position
      const positionSize = isLong ? size : `-${size}`;

      // Use the contract interaction helper
      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.OPEN_POSITION,
        [
          StellarSdk.nativeToScVal(asset, { type: 'symbol' }),
          StellarSdk.nativeToScVal(positionSize, { type: 'i128' }),
          StellarSdk.nativeToScVal(collateral, { type: 'i128' }),
          StellarSdk.nativeToScVal(leverage, { type: 'u32' }),
        ]
      );

      return result.hash;
    } catch (error) {
      console.error('Error opening position:', error);
      throw error;
    }
  }

  // Close a position
  async closePosition(positionId: string): Promise<string> {
    try {
      const publicKey = await stellarService.getPublicKey();
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      const result = await stellarService.callContract(
        this.contractAddress,
        CONTRACT_FUNCTIONS.CLOSE_POSITION,
        [StellarSdk.nativeToScVal(BigInt(positionId), { type: 'u64' })]
      );

      return result.hash;
    } catch (error) {
      console.error('Error closing position:', error);
      throw error;
    }
  }

  // Get user positions
  async getUserPositions(_userPublicKey: string): Promise<ContractPosition[]> {
    try {
      // This would typically be a read-only contract call
      // For now, return mock data until we implement the actual contract calls
      return this.getMockPositions();
    } catch (error) {
      console.error('Error getting user positions:', error);
      return [];
    }
  }

  // Get market configuration
  async getMarketConfig(asset: string): Promise<MarketConfig | null> {
    try {
      // Mock data for now
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
      console.error('Error getting market config:', error);
      return null;
    }
  }

  // Get funding rate
  async getFundingRate(asset: string): Promise<FundingRate | null> {
    try {
      // Mock data for now
      return {
        asset,
        rate: 25, // 0.25%
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting funding rate:', error);
      return null;
    }
  }

  // Mock data for development
  private getMockPositions(): ContractPosition[] {
    return [
      {
        id: '1',
        user: 'GABC123...',
        asset: 'BTC',
        size: '0.5',
        collateral: '5000',
        entryPrice: '45000',
        leverage: 2,
        timestamp: Date.now() - 86400000, // 1 day ago
        isOpen: true,
      },
      {
        id: '2',
        user: 'GABC123...',
        asset: 'ETH',
        size: '-2.0',
        collateral: '3000',
        entryPrice: '3000',
        leverage: 3,
        timestamp: Date.now() - 172800000, // 2 days ago
        isOpen: true,
      },
    ];
  }
}

// Export singleton instance
export const contractService = new ContractService();

