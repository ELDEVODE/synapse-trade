// Testnet utilities for Stellar

export interface FundbotResponse {
  hash: string;
  result: string;
  error?: string;
}

export class TestnetService {
  private static readonly FRIENDBOT_URL = 'https://friendbot.stellar.org';

  /**
   * Fund a testnet account using Friendbot
   */
  static async fundAccount(publicKey: string): Promise<FundbotResponse> {
    try {
      const response = await fetch(`${this.FRIENDBOT_URL}?addr=${publicKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      return {
        hash: data.hash,
        result: 'success',
      };
    } catch (error) {
      return {
        hash: '',
        result: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if an account exists on testnet
   */
  static async checkAccountExists(publicKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get account balance for testnet
   */
  static async getAccountBalance(publicKey: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://horizon-testnet.stellar.org/accounts/${publicKey}`
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const xlmBalance = data.balances.find((b: { asset_type: string; balance: string }) => b.asset_type === 'native');
      
      return xlmBalance ? parseFloat(xlmBalance.balance).toFixed(2) : '0.00';
    } catch {
      return null;
    }
  }
}
