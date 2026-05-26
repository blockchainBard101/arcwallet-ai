import { Injectable, Logger } from '@nestjs/common';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';

@Injectable()
export class CircleService {
  private readonly logger = new Logger(CircleService.name);
  private client: any;

  constructor() {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.ENTITY_SECRET;

    if (!apiKey || !entitySecret) {
      this.logger.warn(
        'CIRCLE_API_KEY or ENTITY_SECRET is missing. Circle SDK calls will fail.',
      );
    }

    this.client = initiateDeveloperControlledWalletsClient({
      apiKey: apiKey || '',
      entitySecret: entitySecret || '',
    });
  }

  /**
   * Create a wallet set.
   * @param name Name of the wallet set
   * @returns walletSetId
   */
  async createWalletSet(name: string): Promise<string> {
    try {
      const response = await this.client.createWalletSet({ name });
      const walletSetId = response.data?.walletSet?.id;
      if (!walletSetId) {
        throw new Error('Wallet set creation response did not contain ID');
      }
      return walletSetId;
    } catch (error) {
      this.logger.error(`Failed to create wallet set: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a Smart Contract Account (SCA) wallet on ARC-TESTNET.
   * @param walletSetId The wallet set ID
   * @returns address and wallet ID
   */
  async createAgentWallet(walletSetId: string): Promise<{ address: string; id: string }> {
    try {
      const response = await this.client.createWallets({
        accountType: 'SCA',
        blockchains: ['ARC-TESTNET'],
        count: 1,
        walletSetId,
      });

      const wallets = response.data?.wallets ?? [];
      if (wallets.length === 0) {
        throw new Error('Wallet creation response did not contain any wallets');
      }

      const wallet = wallets[0];
      return {
        address: wallet.address,
        id: wallet.id,
      };
    } catch (error) {
      this.logger.error(`Failed to create agent wallet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get token balances of a specific wallet.
   * @param walletId Circle wallet ID
   * @returns list of token balances
   */
  async getWalletTokenBalance(walletId: string): Promise<any[]> {
    try {
      const response = await this.client.getWalletTokenBalance({
        id: walletId,
      });
      return response.data?.tokenBalances ?? [];
    } catch (error) {
      this.logger.error(`Failed to get wallet token balance: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send USDC autonomously from an agent's developer-controlled wallet.
   * Signed server-side using the entity secret — no user confirmation required.
   * @param walletId  Circle wallet ID of the sending agent
   * @param toAddress Destination 0x address
   * @param amountUsdc Amount in USDC (will be converted to 6-decimal units)
   * @returns transaction ID and state
   */
  async sendUsdcFromAgentWallet(
    walletId: string,
    toAddress: string,
    amountUsdc: number,
  ): Promise<{ transactionId: string; state: string }> {
    try {
      // Circle SDK expects amount in decimal format (e.g. "2.00"), not raw 6-decimal units
      const amountDecimal = amountUsdc.toFixed(2);

      const payload = {
        walletId,
        blockchain: 'ARC-TESTNET',
        tokenAddress: '0x3600000000000000000000000000000000000000', // USDC on Arc Testnet
        destinationAddress: toAddress,
        amount: [amountDecimal],
        fee: {
          type: 'level',
          config: { feeLevel: 'MEDIUM' },
        },
      };

      this.logger.log(`Sending USDC with payload: ${JSON.stringify(payload, null, 2)}`);

      const response = await this.client.createTransaction(payload as any);

      this.logger.log(`Circle transaction creation response: ${JSON.stringify(response.data, null, 2)}`);

      const txId = response.data?.id;
      const txState = response.data?.state;

      if (!txId) throw new Error('No transaction ID in response');

      return { transactionId: txId, state: txState ?? 'PENDING' };
    } catch (error: any) {
      this.logger.error(
        `Failed to send USDC from agent wallet. Error message: ${error.message}. ` +
          `Circle API Error details: ${JSON.stringify(error.response?.data || error.response || error, null, 2)}`,
      );
      throw error;
    }
  }
}
