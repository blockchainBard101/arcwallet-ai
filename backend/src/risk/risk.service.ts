import { Injectable, Logger } from '@nestjs/common';

export interface RiskEvaluation {
  isSafe: boolean;
  score: number; // 0 - 100
  warnings: string[];
}

@Injectable()
export class RiskGuardianService {
  private readonly logger = new Logger(RiskGuardianService.name);
  private readonly rpcUrl = process.env.ARC_TESTNET_RPC_URL || 'https://rpc.testnet.arc.network';
  private readonly usdcContract = '0x3600000000000000000000000000000000000000'.toLowerCase();

  /**
   * Evaluates the safety of a proposed transaction.
   * Checks if the recipient is a smart contract (which could be unverified or dangerous),
   * if the transaction amount is unusually high, or if anomalies are present.
   */
  async evaluateTransaction(
    to: string,
    valueUsdc: number,
    data?: string,
  ): Promise<RiskEvaluation> {
    const warnings: string[] = [];
    let score = 100;

    // 1. Basic validation
    if (!to || !to.startsWith('0x') || to.length !== 42) {
      return {
        isSafe: false,
        score: 0,
        warnings: ['Invalid recipient address format.'],
      };
    }

    if (valueUsdc <= 0) {
      return {
        isSafe: false,
        score: 0,
        warnings: ['Transaction amount must be greater than 0.'],
      };
    }

    const targetLower = to.toLowerCase();

    // 2. High Value checks
    if (valueUsdc >= 50) {
      warnings.push(`Transaction value ($${valueUsdc.toFixed(2)} USDC) requires manual approval.`);
      score -= 10;
    }
    if (valueUsdc >= 1000) {
      warnings.push('High-value transfer alert. Please verify the destination address carefully.');
      score -= 20;
    }

    // 3. RPC check: Get code of the target address
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getCode',
          params: [to, 'latest'],
          id: 1,
        }),
      });

      const resJson = await response.json();
      const code = resJson.result;

      if (code && code !== '0x' && code !== '') {
        // Target is a smart contract
        if (targetLower === this.usdcContract) {
          this.logger.log(`Target is USDC contract. Standard ERC-20 interaction.`);
        } else {
          // Unverified or unknown custom contract interaction
          warnings.push('Destination address is a smart contract. Interacting with unverified contracts is risky.');
          score -= 40;
        }
      }
    } catch (err) {
      this.logger.warn(`RPC check failed for getCode: ${err.message}. Risk check incomplete.`);
      warnings.push('Unable to verify contract status via RPC. Please proceed with caution.');
      score -= 10;
    }

    // Determine final safety status based on score
    const isSafe = score >= 60;

    return {
      isSafe,
      score: Math.max(0, score),
      warnings,
    };
  }
}
