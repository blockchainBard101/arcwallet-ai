import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CircleService } from '../circle/circle.service';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly circleService: CircleService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  /**
   * Creates a new personal AI agent, provisions a Smart Contract Wallet (SCA) on Arc Testnet via Circle,
   * and saves the resulting records in PostgreSQL via Prisma.
   * @param userId Privy user ID
   * @param name Name of the agent
   * @param configuration Initial configuration JSON
   */
  async createAgent(userId: string, name: string, configuration: any) {
    try {
      this.logger.log(`Provisioning Agent "${name}" for User: ${userId}`);

      // 0. Enforce subscription agent limits
      await this.subscriptionService.checkAgentLimit(userId);

      // 1. Create a WalletSet in Circle
      const walletSetName = `Agent-${name.replace(/\s+/g, '-')}-${Date.now()}`;
      const walletSetId = await this.circleService.createWalletSet(walletSetName);

      // 2. Create the SCA wallet inside the WalletSet on Arc Testnet
      const { address: walletAddress, id: circleWalletId } =
        await this.circleService.createAgentWallet(walletSetId);

      this.logger.log(
        `Circle agent wallet successfully provisioned: ${walletAddress} (ID: ${circleWalletId})`,
      );

      // 3. Store the Wallet in the database
      const wallet = await this.prisma.wallet.create({
        data: {
          id: circleWalletId, // Save Circle wallet ID as our wallet ID
          userId,
          address: walletAddress,
          type: 'agent',
          chain: 'arc',
        },
      });

      // 4. Store the Agent profile in the database
      const agent = await this.prisma.agent.create({
        data: {
          userId,
          walletId: wallet.id,
          name,
          status: 'active',
          configuration: configuration || {},
        },
        include: {
          wallet: true,
        },
      });

      return agent;
    } catch (error) {
      this.logger.error(`Failed to create agent: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieves all agents owned by a user, querying Circle in parallel for their live balances.
   * @param userId Privy user ID
   */
  async listAgents(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      include: {
        wallet: true,
      },
    });

    return Promise.all(
      agents.map(async (agent) => {
        try {
          const balances = await this.circleService.getWalletTokenBalance(agent.walletId);
          return {
            ...agent,
            balances,
          };
        } catch (error) {
          this.logger.warn(
            `Failed to retrieve live balances from Circle for agent ${agent.id} (wallet: ${agent.walletId}): ${error.message}`,
          );
          return {
            ...agent,
            balances: [],
          };
        }
      }),
    );
  }

  /**
   * Retrieves a specific agent by ID and queries Circle for live on-chain USDC token balances.
   * @param userId Privy user ID
   * @param agentId Unique ID of the agent
   */
  async getAgent(userId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
      include: {
        wallet: true,
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    try {
      // Query Circle live balances for this developer-controlled wallet ID
      const balances = await this.circleService.getWalletTokenBalance(agent.walletId);
      return {
        ...agent,
        balances,
      };
    } catch (error) {
      this.logger.warn(`Failed to retrieve live balances from Circle for wallet ${agent.walletId}: ${error.message}`);
      return {
        ...agent,
        balances: [], // Fallback if live balance check fails (e.g. invalid config or rate limit)
      };
    }
  }
}
