import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { PrismaService } from '../prisma/prisma.service';
import { CircleService } from '../circle/circle.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let prismaService: PrismaService;
  let circleService: CircleService;

  const mockPrismaService = {
    rule: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockCircleService = {
    getWalletTokenBalance: jest.fn(),
    sendUsdcFromAgentWallet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CircleService, useValue: mockCircleService },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    prismaService = module.get<PrismaService>(PrismaService);
    circleService = module.get<CircleService>(CircleService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateRules', () => {
    it('should fetch and process active rules', async () => {
      const mockRule = {
        id: 'rule-123',
        status: 'active',
        naturalRuleText: 'If balance is below 10 USDC, transfer 5 USDC',
        parsedConditions: {
          trigger: {
            type: 'balance',
            token: 'USDC',
            operator: 'below',
            value: '10',
          },
          action: {
            type: 'transfer',
            amount: '5',
            to: '0xRecipient',
          },
        },
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          walletId: 'wallet-abc',
          wallet: {
            address: '0xAgentWallet',
          },
        },
      };

      mockPrismaService.rule.findMany.mockResolvedValue([mockRule]);
      mockCircleService.getWalletTokenBalance.mockResolvedValue([
        { token: { symbol: 'USDC' }, amount: '8.5' },
      ]);
      mockCircleService.sendUsdcFromAgentWallet.mockResolvedValue({
        transactionId: 'tx-999',
      });

      await service.evaluateRules();

      expect(mockPrismaService.rule.findMany).toHaveBeenCalled();
      expect(mockCircleService.getWalletTokenBalance).toHaveBeenCalledWith('wallet-abc');
      expect(mockCircleService.sendUsdcFromAgentWallet).toHaveBeenCalledWith(
        'wallet-abc',
        '0xRecipient',
        5,
      );
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentId: 'agent-1',
          actionType: 'rule_trigger',
          status: 'success',
          txHash: 'tx-999',
        }),
      });
      expect(mockPrismaService.rule.update).toHaveBeenCalledWith({
        where: { id: 'rule-123' },
        data: { status: 'inactive' },
      });
    });

    it('should handle price-based triggers using Pyth network Hermes updates', async () => {
      const mockRule = {
        id: 'rule-456',
        status: 'active',
        naturalRuleText: 'If ETH price is below 4200, swap 10 USDC to EURC',
        parsedConditions: {
          trigger: {
            type: 'price',
            token: 'ETH',
            operator: 'below',
            value: '4200',
          },
          action: {
            type: 'swap',
            fromToken: 'USDC',
            toToken: 'EURC',
            amount: '10',
          },
        },
        agent: {
          id: 'agent-2',
          name: 'Test Swapper',
          walletId: 'wallet-xyz',
          wallet: {
            address: '0xSwapperWallet',
          },
        },
      };

      // Mock Hermes API response: ETH price = $3500.12 (price: 350012, expo: -2)
      const mockFetchResponse = {
        ok: true,
        json: async () => ({
          parsed: [
            {
              price: {
                price: '350012',
                expo: -2,
              },
            },
          ],
        }),
      };
      
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

      mockPrismaService.rule.findMany.mockResolvedValue([mockRule]);

      await service.evaluateRules();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'),
      );
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          agentId: 'agent-2',
          actionType: 'rule_trigger',
          status: 'success',
          txHash: expect.any(String),
        }),
      });
      expect(mockPrismaService.rule.update).toHaveBeenCalledWith({
        where: { id: 'rule-456' },
        data: { status: 'inactive' },
      });

      global.fetch = originalFetch;
    });
  });
});
