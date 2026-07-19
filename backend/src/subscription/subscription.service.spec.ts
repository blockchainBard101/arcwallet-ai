import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

const mockPrismaService = {
  subscription: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  agent: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  rule: {
    count: jest.fn(),
  },
};

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('checkAgentLimit', () => {
    it('should allow agent creation if below limit on free tier', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'free' });
      prisma.agent.count.mockResolvedValue(0);

      await expect(service.checkAgentLimit('user_1')).resolves.toBeUndefined();
    });

    it('should block agent creation if at limit on free tier', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'free' });
      prisma.agent.count.mockResolvedValue(1);

      await expect(service.checkAgentLimit('user_1')).rejects.toThrow(ForbiddenException);
    });

    it('should allow unlimited agents on enterprise tier', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'enterprise' });
      
      await expect(service.checkAgentLimit('user_1')).resolves.toBeUndefined();
      expect(prisma.agent.count).not.toHaveBeenCalled();
    });
  });

  describe('checkRuleLimit', () => {
    it('should block rule creation if at limit on free tier', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'free' });
      prisma.agent.findMany.mockResolvedValue([{ id: 'agent_1' }]);
      prisma.rule.count.mockResolvedValue(3);

      await expect(service.checkRuleLimit('user_1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkLlmLimit', () => {
    it('should block LLM usage if at limit', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'free', llmCallsUsed: 50 });

      await expect(service.checkLlmLimit('user_1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkNanopayBudget', () => {
    it('should block nanopay call if cost exceeds remaining budget', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'pro', nanopayUsed: 4.5 });

      await expect(service.checkNanopayBudget('user_1', 1.0)).rejects.toThrow(ForbiddenException);
    });

    it('should block all nanopay calls on free tier (budget 0)', async () => {
      prisma.subscription.findUnique.mockResolvedValue({ tier: 'free', nanopayUsed: 0 });

      await expect(service.checkNanopayBudget('user_1', 0.1)).rejects.toThrow(ForbiddenException);
    });
  });
});
