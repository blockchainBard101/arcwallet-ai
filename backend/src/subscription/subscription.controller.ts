import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { AuthGuard } from '../auth/auth.guard';
import { createPublicClient, http, parseUnits } from 'viem';
import { arcTestnet } from 'viem/chains';

const ARC_USDC_ADDRESS = '0x3600000000000000000000000000000000000000';
const TREASURY_ADDRESS = process.env.SUBSCRIPTION_TREASURY_ADDRESS || '0x0000000000000000000000000000000000000001';

const arcClient = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network'),
});

@Controller('subscription')
@UseGuards(AuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(@Request() req: any) {
    const userId = req.user.id;
    return this.subscriptionService.getSubscription(userId);
  }

  @Post('upgrade')
  async upgradeSubscription(
    @Request() req: any,
    @Body() body: { tier: string; txHash?: string; from?: string },
  ) {
    const userId = req.user.id;
    const tier = body.tier?.toLowerCase();

    const costMap: Record<string, number> = { pro: 20, power: 99 };
    const requiredCost = costMap[tier] || 0;

    if (!costMap[tier]) {
      return { success: false, message: `Invalid plan: ${tier}` };
    }

    // ──────────────────────────────────────────────────────
    // PAYMENT PATH A: Real on-chain USDC transfer via txHash
    // ──────────────────────────────────────────────────────
    if (body.txHash && body.from) {
      try {
        // Wait for the transaction to be mined (up to 30s)
        const receipt = await arcClient.waitForTransactionReceipt({
          hash: body.txHash as `0x${string}`,
          timeout: 30_000,
        });

        if (receipt.status !== 'success') {
          return {
            success: false,
            error: 'TX_REVERTED',
            message: 'Transaction was reverted on-chain. No payment was taken.',
          };
        }

        // Decode the Transfer event from the USDC contract
        // ERC-20 Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
        const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        const usdcLog = receipt.logs.find(
          (log) =>
            log.address.toLowerCase() === ARC_USDC_ADDRESS.toLowerCase() &&
            log.topics[0] === transferTopic,
        );

        if (!usdcLog) {
          return {
            success: false,
            error: 'NO_TRANSFER_LOG',
            message: 'Could not find a USDC Transfer event in the transaction. Please contact support.',
          };
        }

        // Validate sender and recipient from log topics
        const fromAddr = '0x' + usdcLog.topics[1]?.slice(26);
        const toAddr = '0x' + usdcLog.topics[2]?.slice(26);
        const transferAmount = BigInt(usdcLog.data);
        const requiredAmount = parseUnits(requiredCost.toString(), 6);

        if (fromAddr.toLowerCase() !== body.from.toLowerCase()) {
          return {
            success: false,
            error: 'SENDER_MISMATCH',
            message: 'Transaction sender does not match your wallet address.',
          };
        }

        if (toAddr.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
          return {
            success: false,
            error: 'RECIPIENT_MISMATCH',
            message: 'Payment was not sent to the platform treasury.',
          };
        }

        if (transferAmount < requiredAmount) {
          const paid = Number(transferAmount) / 1_000_000;
          return {
            success: false,
            error: 'INSUFFICIENT_AMOUNT',
            message: `Transaction only transferred ${paid.toFixed(2)} USDC, but ${requiredCost}.00 USDC is required for the ${tier} plan.`,
          };
        }

        // All checks passed — upgrade tier
        await this.subscriptionService.updateTier(userId, tier);
        return { success: true, txHash: body.txHash };
      } catch (err: any) {
        // Transaction not found yet or RPC error
        if (err?.name === 'WaitForTransactionReceiptTimeoutError') {
          return {
            success: false,
            error: 'TX_TIMEOUT',
            message: 'Transaction not confirmed within 30 seconds. Please try again or contact support.',
          };
        }
        return {
          success: false,
          error: 'VERIFICATION_FAILED',
          message: err?.message || 'Failed to verify payment on-chain.',
        };
      }
    }

    // ──────────────────────────────────────────────────────
    // PAYMENT PATH B: Fallback balance check (no txHash)
    //   — Only used in dev/testing. In production, always
    //     require a txHash.
    // ──────────────────────────────────────────────────────
    if (process.env.NODE_ENV === 'development') {
      const vaultBalance = await this.subscriptionService.getUserUsdcBalance(userId);
      if (vaultBalance < requiredCost) {
        return {
          success: false,
          error: 'INSUFFICIENT_BALANCE',
          message: `Insufficient USDC balance! You need $${requiredCost}.00 USDC but your vault only has $${vaultBalance.toFixed(2)} USDC.`,
        };
      }
      await this.subscriptionService.updateTier(userId, tier);
      return { success: true };
    }

    return {
      success: false,
      error: 'PAYMENT_REQUIRED',
      message: 'A valid USDC transaction hash is required to upgrade your subscription.',
    };
  }
}
