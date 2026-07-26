import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('rules')
@UseGuards(AuthGuard)
export class RulesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  @Post()
  async createRule(
    @Req() req: any,
    @Body('agentId') agentId: string,
    @Body('naturalRuleText') naturalRuleText: string,
    @Body('trigger') trigger: any,
    @Body('action') action: any,
  ) {
    const userId = req.user.id;

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) {
      return { success: false, error: 'Agent not found or not owned by you.' };
    }

    await this.subscriptionService.checkRuleLimit(userId);

    const rule = await this.prisma.rule.create({
      data: {
        agentId,
        naturalRuleText,
        parsedConditions: {
          trigger,
          action,
        },
        status: 'active',
      },
    });

    return {
      success: true,
      ruleId: rule.id,
      naturalRuleText: rule.naturalRuleText,
      status: rule.status,
    };
  }

  @Get('agent/:agentId')
  async listRules(@Req() req: any, @Param('agentId') agentId: string) {
    const userId = req.user.id;

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });
    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    const rules = await this.prisma.rule.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      agentId,
      rules: rules.map((r) => ({
        id: r.id,
        text: r.naturalRuleText,
        status: r.status,
        createdAt: r.createdAt,
      })),
    };
  }

  @Delete(':ruleId')
  async deleteRule(@Req() req: any, @Param('ruleId') ruleId: string) {
    const userId = req.user.id;

    const rule = await this.prisma.rule.findFirst({
      where: { id: ruleId },
      include: { agent: true },
    });

    if (!rule || rule.agent.userId !== userId) {
      return { success: false, error: 'Rule not found or unauthorized' };
    }

    await this.prisma.rule.delete({
      where: { id: ruleId },
    });

    return { success: true };
  }
}
