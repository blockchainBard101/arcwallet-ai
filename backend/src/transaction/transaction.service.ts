import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskGuardianService } from '../risk/risk.service';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
  private readonly usdcContract = '0x3600000000000000000000000000000000000000';

  constructor(
    private readonly prisma: PrismaService,
    private readonly riskGuardian: RiskGuardianService,
  ) {}

  /**
   * Prepares a transaction payload, evaluating risk and formatting tx parameters for signing.
   */
  async prepareTransaction(
    userId: string,
    agentId: string | undefined | null,
    toAddress: string,
    amountUsdc: number,
    data?: string,
  ) {
    let fromAddress: string | undefined = undefined;

    if (agentId) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, userId },
        include: { wallet: true },
      });
      if (agent) {
        fromAddress = agent.wallet.address;
      }
    }

    // Evaluate Risk
    const riskEvaluation = await this.riskGuardian.evaluateTransaction(toAddress, amountUsdc, data);

    // Fetch dynamic parameters from RPC: nonce
    let nonce: string | undefined = undefined;
    if (fromAddress) {
      try {
        const nonceRes = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [fromAddress, 'latest'],
            id: 1,
          }),
        });
        const resJson = await nonceRes.json();
        if (resJson.result) {
          nonce = resJson.result;
        }
      } catch (err) {
        this.logger.error(`Failed to fetch nonce from RPC: ${err.message}`);
      }
    }

    // Determine if Privy signature is required (always true if from main wallet)
    const signatureRequired = !fromAddress || !riskEvaluation.isSafe || amountUsdc >= 50;

    // Construct ERC-20 transfer data if standard transfer
    let txData = data || '0x';
    if (!data || data === '0x') {
      const cleanTo = toAddress.toLowerCase().replace('0x', '').padStart(64, '0');
      const rawAmount = Math.round(amountUsdc * 1e6); // USDC 6 decimals
      const cleanAmount = rawAmount.toString(16).padStart(64, '0');
      txData = `0xa9059cbb${cleanTo}${cleanAmount}`;
    }

    // Target is USDC contract for ERC-20 transfer
    const targetAddress = data ? toAddress : this.usdcContract;

    return {
      recipientAddress: toAddress,
      amount: amountUsdc,
      transaction: {
        from: fromAddress,
        to: targetAddress,
        data: txData,
        value: '0x0',
        nonce,
        gasLimit: '0x186a0', // 100,000 gas limit default
        chainId: 5042002, // Arc Testnet
      },
      risk: riskEvaluation,
      signatureRequired,
    };
  }

  /**
   * Broadcasts a pre-signed transaction hex string to the Arc Testnet RPC node.
   */
  async executeTransaction(signedTx: string) {
    if (!signedTx || !signedTx.startsWith('0x')) {
      throw new BadRequestException('Invalid signed transaction format.');
    }

    try {
      this.logger.log('Broadcasting raw signed transaction...');
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [signedTx],
          id: 1,
        }),
      });

      const resJson = await response.json();
      if (resJson.error) {
        throw new Error(resJson.error.message || 'RPC transaction broadcast error.');
      }

      return {
        success: true,
        txHash: resJson.result,
        message: 'Transaction successfully broadcast to the Arc Testnet.',
      };
    } catch (err) {
      this.logger.error(`Transaction execution failed: ${err.message}`);
      throw new BadRequestException(`Failed to execute transaction: ${err.message}`);
    }
  }
}
