import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CircleService } from '../circle/circle.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly pythFeedIds: Record<string, string> = {
    eth: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    ethereum: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    btc: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    bitcoin: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    sol: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    solana: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    usdc: "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly circleService: CircleService,
    private readonly subscriptionService: SubscriptionService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis | null,
  ) {}

  /**
   * Run on the 1st of every month to zero usage limits.
   */
  @Cron('0 0 1 * *')
  async resetMonthlySubscriptionUsage() {
    this.logger.log('Resetting monthly subscription usage limits for all users...');
    try {
      await this.subscriptionService.resetMonthlyUsage();
      this.logger.log('Successfully reset monthly subscription usage.');
    } catch (err: any) {
      this.logger.error(`Failed to reset monthly subscription usage: ${err.message}`);
    }
  }

  /**
   * Run every 30 seconds to evaluate active rules.
   */
  @Cron('*/30 * * * * *')
  async evaluateRules() {
    this.logger.log('Evaluating active automation rules...');

    try {
      const activeRules = await this.prisma.rule.findMany({
        where: { status: 'active' },
        include: {
          agent: {
            include: {
              wallet: true,
            },
          },
        },
      });

      this.logger.log(`Found ${activeRules.length} active rules to evaluate.`);

      for (const rule of activeRules) {
        try {
          await this.processRule(rule);
        } catch (ruleError) {
          this.logger.error(`Error processing rule ${rule.id}: ${ruleError.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to retrieve active rules: ${error.message}`);
    }
  }

  /**
   * Process a single rule's condition and execute action if triggered.
   */
  private async processRule(rule: any) {
    const agent = rule.agent;
    if (!agent || !agent.wallet) {
      this.logger.warn(`Rule ${rule.id} has no agent or wallet configured.`);
      return;
    }

    const conditions = rule.parsedConditions as any;
    if (!conditions || !conditions.trigger) {
      this.logger.warn(`Rule ${rule.id} has invalid or missing trigger conditions.`);
      return;
    }

    const { trigger, action } = conditions;

    // Evaluate trigger type
    if (trigger.type === 'balance') {
      const tokenSymbol = trigger.token || 'USDC';
      
      // Get live balance from Circle
      const balances = await this.circleService.getWalletTokenBalance(agent.walletId);
      const usdcBalanceObj = balances.find(
        (b) => b.token?.symbol === tokenSymbol || b.token?.name?.includes(tokenSymbol)
      );

      const currentBalance = usdcBalanceObj ? parseFloat(usdcBalanceObj.amount) : 0;
      const threshold = parseFloat(trigger.value);

      this.logger.log(
        `Evaluating balance rule for agent ${agent.name} (${agent.wallet.address}): ` +
        `Current ${tokenSymbol}: ${currentBalance}, threshold: ${threshold}, operator: ${trigger.operator}`
      );

      let triggered = false;
      if (trigger.operator === 'below' && currentBalance < threshold) {
        triggered = true;
      } else if (trigger.operator === 'above' && currentBalance > threshold) {
        triggered = true;
      }

      if (triggered) {
        this.logger.log(`Rule ${rule.id} triggered! Executing action...`);
        await this.executeRuleAction(rule, action);
      }
    } else if (trigger.type === 'price') {
      const tokenSymbol = trigger.token || 'ETH';
      const currentPrice = await this.fetchCoinPrice(tokenSymbol);
      const threshold = parseFloat(trigger.value);

      this.logger.log(
        `Evaluating price rule for agent ${agent.name} (${agent.wallet.address}): ` +
        `Current ${tokenSymbol} Price: $${currentPrice}, threshold: $${threshold}, operator: ${trigger.operator}`
      );

      let triggered = false;
      if (trigger.operator === 'below' && currentPrice < threshold) {
        triggered = true;
      } else if (trigger.operator === 'above' && currentPrice > threshold) {
        triggered = true;
      }

      if (triggered) {
        this.logger.log(`Rule ${rule.id} triggered! Executing action...`);
        await this.executeRuleAction(rule, action);
      }
    } else {
      this.logger.warn(`Trigger type "${trigger.type}" is not supported yet.`);
    }
  }

  /**
   * Helper to fetch current token prices, supporting major assets via Pyth Network Hermes API.
   */
  private async fetchCoinPrice(tokenSymbol: string): Promise<number> {
    const symbol = tokenSymbol.toLowerCase();

    const feedId = this.pythFeedIds[symbol];
    if (!feedId) {
      this.logger.warn(`No Pyth feed ID mapped for symbol "${tokenSymbol}". Defaulting to $1.00.`);
      return 1.00;
    }

    try {
      const url = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${feedId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hermes API returned status ${response.status}`);
      }
      const data = await response.json();
      const parsed = data.parsed?.[0];

      if (parsed && parsed.price) {
        const rawPrice = BigInt(parsed.price.price);
        const expo = Number(parsed.price.expo);
        const price = Number(rawPrice) * Math.pow(10, expo);
        this.logger.log(`Fetched Pyth price for ${tokenSymbol}: $${price}`);
        return price;
      }
    } catch (err: any) {
      this.logger.warn(`Failed to fetch Pyth price for ${tokenSymbol}: ${err.message}. Using standard fallback.`);
    }

    // Fallbacks if Pyth is down or rate limited
    if (symbol === 'eth' || symbol === 'ethereum') return 3500;
    if (symbol === 'btc' || symbol === 'bitcoin') return 65000;
    if (symbol === 'sol' || symbol === 'solana') return 150;
    return 1.00;
  }

  /**
   * Execute the action specified in the rule payload.
   */
  private async executeRuleAction(rule: any, action: any) {
    const agent = rule.agent;

    if (action.type === 'transfer') {
      const recipient = action.to;
      const amount = parseFloat(action.amount);

      this.logger.log(`Rule trigger action: Transfer ${amount} USDC to ${recipient}`);

      try {
        const tx = await this.circleService.sendUsdcFromAgentWallet(
          agent.walletId,
          recipient,
          amount
        );

        // Update rule status or log success
        await this.prisma.activityLog.create({
          data: {
            agentId: agent.id,
            actionType: 'rule_trigger',
            status: 'success',
            txHash: tx.transactionId,
            payload: {
              ruleId: rule.id,
              ruleText: rule.naturalRuleText,
              actionExecuted: 'transfer',
              amount,
              to: recipient,
              circleTxId: tx.transactionId,
            },
          },
        });

        // Set rule to inactive to prevent multiple executions of the same trigger
        await this.prisma.rule.update({
          where: { id: rule.id },
          data: { status: 'inactive' },
        });

        this.logger.log(`Rule action executed successfully. Logged Tx: ${tx.transactionId}`);
      } catch (err: any) {
        this.logger.error(`Failed to execute rule transfer: ${err.message}`);
        await this.prisma.activityLog.create({
          data: {
            agentId: agent.id,
            actionType: 'rule_trigger',
            status: 'failed',
            txHash: null,
            payload: {
              ruleId: rule.id,
              ruleText: rule.naturalRuleText,
              error: err.message,
            },
          },
        });
        // Deactivate failing rule so it doesn't loop infinitely
        await this.prisma.rule.update({
          where: { id: rule.id },
          data: { status: 'failed' },
        });
      }
    } else if (action.type === 'swap') {
      const fromToken = action.fromToken || 'USDC';
      const toToken = action.toToken || 'EURC';
      
      let amount = 0;
      if (action.amount === 'all' || (typeof action.amount === 'string' && action.amount.toLowerCase() === 'all')) {
        try {
          const balances = await this.circleService.getWalletTokenBalance(agent.walletId);
          const fromBal = balances.find((b: any) => b.token?.symbol?.toLowerCase().includes(fromToken.toLowerCase()));
          amount = fromBal?.amount ? parseFloat(fromBal.amount) : 0;
          this.logger.log(`"Swap All" requested for ${fromToken}. Live vault balance fetched: ${amount}`);
        } catch (err: any) {
          this.logger.warn(`Could not fetch live balance for ${fromToken}, defaulting to 1: ${err.message}`);
          amount = 1;
        }
      } else {
        amount = parseFloat(action.amount);
      }

      if (amount <= 0) {
        this.logger.warn(`Swap amount for agent ${agent.name} is ${amount}. Skipping execution.`);
        return;
      }

      this.logger.log(`Rule trigger action: Swap ${amount} ${fromToken} to ${toToken}`);

      const apiKey = process.env.CIRCLE_API_KEY;
      const entitySecret = process.env.ENTITY_SECRET;
      const kitKey = process.env.KIT_KEY;

      if (apiKey && entitySecret && kitKey) {
        try {
          const { AppKit } = await import('@circle-fin/app-kit');
          const { createCircleWalletsAdapter } = await import('@circle-fin/adapter-circle-wallets');

          const kit = new AppKit();
          const adapter = createCircleWalletsAdapter({ apiKey, entitySecret });

          const result = await kit.swap({
            from: { adapter, chain: 'Arc_Testnet', address: agent.wallet.address },
            tokenIn: fromToken,
            tokenOut: toToken,
            amountIn: amount.toString(),
            config: { kitKey },
          });

          await this.prisma.activityLog.create({
            data: {
              agentId: agent.id,
              actionType: 'rule_trigger',
              status: 'success',
              txHash: result.txHash,
              payload: {
                ruleId: rule.id,
                ruleText: rule.naturalRuleText,
                actionExecuted: 'swap',
                amountIn: amount,
                tokenIn: fromToken,
                tokenOut: toToken,
                txHash: result.txHash,
              },
            },
          });

          if (!action.recurring) {
            await this.prisma.rule.update({
              where: { id: rule.id },
              data: { status: 'inactive' },
            });
          }

          this.logger.log(`Rule action swap executed successfully. Tx: ${result.txHash}`);
        } catch (err: any) {
          this.logger.error(`Failed to execute rule swap: ${err.message}`);
          await this.prisma.activityLog.create({
            data: {
              agentId: agent.id,
              actionType: 'rule_trigger',
              status: 'failed',
              txHash: null,
              payload: {
                ruleId: rule.id,
                ruleText: rule.naturalRuleText,
                error: err.message,
              },
            },
          });
          await this.prisma.rule.update({
            where: { id: rule.id },
            data: { status: 'failed' },
          });
        }
      } else {
        // Fallback to simulation
        this.logger.log(`[SIMULATION] Swap executed: ${amount} ${fromToken} to ${toToken} for agent ${agent.name}`);
        const simTxHash = '0x' + Math.random().toString(16).substring(2, 66);
        
        await this.prisma.activityLog.create({
          data: {
            agentId: agent.id,
            actionType: 'rule_trigger',
            status: 'success',
            txHash: simTxHash,
            payload: {
              ruleId: rule.id,
              ruleText: rule.naturalRuleText,
              actionExecuted: 'swap',
              amountIn: amount,
              tokenIn: fromToken,
              tokenOut: toToken,
              txHash: simTxHash,
              isSimulation: true,
            },
          },
        });

        await this.prisma.rule.update({
          where: { id: rule.id },
          data: { status: 'inactive' },
        });
      }
    } else {
      this.logger.warn(`Action type "${action.type}" is not supported yet.`);
    }
  }
}
