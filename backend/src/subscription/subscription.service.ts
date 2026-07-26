import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CircleService } from '../circle/circle.service';

export const TIER_LIMITS = {
  free:       { maxAgents: 1,   maxRules: 3,         maxLlmCalls: 50,  nanopayBudget: 0     },
  pro:        { maxAgents: 3,   maxRules: Infinity,  maxLlmCalls: 500, nanopayBudget: 5.0   },
  power:      { maxAgents: 10,  maxRules: Infinity,  maxLlmCalls: Infinity, nanopayBudget: 25.0 },
  enterprise: { maxAgents: Infinity, maxRules: Infinity, maxLlmCalls: Infinity, nanopayBudget: Infinity },
};

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly circleService: CircleService,
  ) {}

  async getSubscription(userId: string) {
    let sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      sub = await this.prisma.subscription.create({
        data: {
          userId,
          tier: 'free',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });
    }
    return sub;
  }

  getTierLimits(tier: string) {
    return TIER_LIMITS[tier as keyof typeof TIER_LIMITS] || TIER_LIMITS.free;
  }

  async checkAgentLimit(userId: string) {
    const sub = await this.getSubscription(userId);
    const limits = this.getTierLimits(sub.tier);
    
    if (limits.maxAgents === Infinity) return;

    const count = await this.prisma.agent.count({ where: { userId } });
    if (count >= limits.maxAgents) {
      throw new ForbiddenException(`You have reached the ${limits.maxAgents}-agent limit on the ${sub.tier} plan. Please upgrade to create more.`);
    }
  }

  async checkRuleLimit(userId: string) {
    const sub = await this.getSubscription(userId);
    const limits = this.getTierLimits(sub.tier);
    
    if (limits.maxRules === Infinity) return;

    const agents = await this.prisma.agent.findMany({ where: { userId }, select: { id: true } });
    const agentIds = agents.map(a => a.id);
    
    const count = await this.prisma.rule.count({ where: { agentId: { in: agentIds } } });
    if (count >= limits.maxRules) {
      throw new ForbiddenException(`You have reached the ${limits.maxRules}-rule limit on the ${sub.tier} plan. Please upgrade to create more.`);
    }
  }

  async checkLlmLimit(userId: string) {
    const sub = await this.getSubscription(userId);
    const limits = this.getTierLimits(sub.tier);
    
    if (limits.maxLlmCalls === Infinity) return;

    if (sub.llmCallsUsed >= limits.maxLlmCalls) {
      throw new ForbiddenException(`You have reached the ${limits.maxLlmCalls}-call limit on the ${sub.tier} plan. Please upgrade for more LLM calls.`);
    }
  }

  async incrementLlmUsage(userId: string) {
    await this.prisma.subscription.update({
      where: { userId },
      data: { llmCallsUsed: { increment: 1 } },
    });
  }

  async checkNanopayBudget(userId: string, amountUsdc: number) {
    const sub = await this.getSubscription(userId);
    const limits = this.getTierLimits(sub.tier);
    
    if (limits.nanopayBudget === Infinity) return;

    if (sub.nanopayUsed + amountUsdc > limits.nanopayBudget) {
      throw new ForbiddenException(`This call costs $${amountUsdc} USDC, which exceeds your remaining monthly budget of $${limits.nanopayBudget - sub.nanopayUsed}. Please upgrade.`);
    }
  }

  async incrementNanopayUsage(userId: string, amountUsdc: number) {
    await this.prisma.subscription.update({
      where: { userId },
      data: { nanopayUsed: { increment: amountUsdc } },
    });
  }

  async resetMonthlyUsage() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    await this.prisma.subscription.updateMany({
      data: {
        llmCallsUsed: 0,
        nanopayUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
      },
    });
  }

  async getUserUsdcBalance(userId: string): Promise<number> {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      include: { wallet: true },
    });
    let totalUsdc = 0;
    for (const agent of agents) {
      if (agent.walletId) {
        try {
          const balances = await this.circleService.getWalletTokenBalance(agent.walletId);
          const usdcObj = balances.find((b: any) => b.token?.symbol === 'USDC' || b.token?.name?.includes('USDC'));
          if (usdcObj) {
            totalUsdc += parseFloat(usdcObj.amount || '0');
          } else if (agent.wallet) {
            totalUsdc += parseFloat((agent.wallet as any).balanceUSDC?.toString() || '0');
          }
        } catch {
          if (agent.wallet) {
            totalUsdc += parseFloat((agent.wallet as any).balanceUSDC?.toString() || '0');
          }
        }
      } else if (agent.wallet) {
        totalUsdc += parseFloat((agent.wallet as any).balanceUSDC?.toString() || '0');
      }
    }
    return totalUsdc;
  }

  async updateTier(userId: string, tier: string) {
    // Ensure subscription exists first
    await this.getSubscription(userId);
    await this.prisma.subscription.update({
      where: { userId },
      data: { tier },
    });
  }
}
