import { PrismaService } from '../../prisma/prisma.service';
import { CircleService } from '../../circle/circle.service';
import { AppService } from '../../app.service';
import { TransactionService } from '../../transaction/transaction.service';

export interface ToolContext {
  userId: string;
  prisma: PrismaService;
  circle: CircleService;
  transactionService: TransactionService;
}

/**
 * Executes the named tool and returns a plain string result
 * that will be sent back to Claude as a tool_result.
 */
export async function executeTool(
  toolName: string,
  toolInput: Record<string, any>,
  ctx: ToolContext,
): Promise<string> {
  switch (toolName) {
    case 'get_wallet_balance':
      return handleGetWalletBalance(toolInput as { agentId: string }, ctx);
    case 'get_agent_info':
      return handleGetAgentInfo(toolInput as { agentId: string }, ctx);
    case 'list_agents':
      return handleListAgents(ctx);
    case 'get_activity_log':
      return handleGetActivityLog(toolInput as { agentId: string; limit?: number }, ctx);
    case 'prepare_transaction':
      return handlePrepareTransaction(
        toolInput as { fromAgentId: string; toAddress: string; amountUsdc: number },
        ctx,
      );
    case 'execute_transaction':
      return handleExecuteTransaction(
        toolInput as { fromAgentId: string; toAddress: string; amountUsdc: number; memo?: string },
        ctx,
      );
    case 'fund_agent':
      return handleFundAgent(
        toolInput as { agentId?: string; agentName?: string; amountUsdc?: number },
        ctx,
      );
    case 'get_public_wallet_stats':
      return handleGetPublicWalletStats(toolInput as { address: string }, ctx);
    case 'bridge_usdc':
      return handleBridgeUsdc(
        toolInput as {
          fromAgentId: string;
          destinationChain: string;
          recipientAddress: string;
          amountUsdc: number;
        },
        ctx,
      );
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}


// ─────────────────────────────────────────────
// Tool Implementations
// ─────────────────────────────────────────────

async function handleGetWalletBalance(
  input: { agentId: string },
  ctx: ToolContext,
): Promise<string> {
  const agent = await ctx.prisma.agent.findFirst({
    where: { id: input.agentId, userId: ctx.userId },
    include: { wallet: true },
  });
  if (!agent) return JSON.stringify({ error: 'Agent not found or not owned by you.' });

  try {
    const balances = await ctx.circle.getWalletTokenBalance(agent.walletId);
    const usdcBalance = balances.find((b: any) =>
      b.token?.symbol?.toLowerCase().includes('usdc'),
    );
    return JSON.stringify({
      agentName: agent.name,
      walletAddress: agent.wallet.address,
      usdcBalance: usdcBalance?.amount ?? '0',
      allBalances: balances,
    });
  } catch {
    return JSON.stringify({ agentName: agent.name, usdcBalance: '0 (Circle unavailable)' });
  }
}

async function handleGetAgentInfo(
  input: { agentId: string },
  ctx: ToolContext,
): Promise<string> {
  const agent = await ctx.prisma.agent.findFirst({
    where: { id: input.agentId, userId: ctx.userId },
    include: { wallet: true, rules: true },
  });
  if (!agent) return JSON.stringify({ error: 'Agent not found.' });

  return JSON.stringify({
    id: agent.id,
    name: agent.name,
    status: agent.status,
    walletAddress: agent.wallet.address,
    chain: agent.wallet.chain,
    activeRules: agent.rules.filter((r) => r.status === 'active').length,
    totalRules: agent.rules.length,
    configuration: agent.configuration,
    createdAt: agent.createdAt,
  });
}

async function handleListAgents(ctx: ToolContext): Promise<string> {
  const agents = await ctx.prisma.agent.findMany({
    where: { userId: ctx.userId },
    include: { wallet: true, rules: true },
  });

  const summary = agents.map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    walletAddress: a.wallet.address,
    activeRules: a.rules.filter((r) => r.status === 'active').length,
  }));

  return JSON.stringify({ count: agents.length, agents: summary });
}

async function handleGetActivityLog(
  input: { agentId: string; limit?: number },
  ctx: ToolContext,
): Promise<string> {
  const agent = await ctx.prisma.agent.findFirst({
    where: { id: input.agentId, userId: ctx.userId },
  });
  if (!agent) return JSON.stringify({ error: 'Agent not found.' });

  const logs = await ctx.prisma.activityLog.findMany({
    where: { agentId: input.agentId },
    orderBy: { createdAt: 'desc' },
    take: input.limit ?? 10,
  });

  return JSON.stringify({
    agentId: input.agentId,
    count: logs.length,
    logs: logs.map((l) => ({
      action: l.actionType,
      status: l.status,
      txHash: l.txHash,
      createdAt: l.createdAt,
    })),
  });
}

async function handlePrepareTransaction(
  input: { fromAgentId: string; toAddress: string; amountUsdc: number },
  ctx: ToolContext,
): Promise<string> {
  try {
    const result = await ctx.transactionService.prepareTransaction(
      ctx.userId,
      input.fromAgentId,
      input.toAddress,
      input.amountUsdc,
    );
    return JSON.stringify(result);
  } catch (err: any) {
    return JSON.stringify({ error: err.message ?? 'Failed to prepare transaction' });
  }
}

async function handleFundAgent(
  input: { agentId?: string; agentName?: string; amountUsdc?: number },
  ctx: ToolContext,
): Promise<string> {
  let agent: any = null;

  if (input.agentId) {
    agent = await ctx.prisma.agent.findFirst({
      where: { id: input.agentId, userId: ctx.userId },
      include: { wallet: true },
    });
  } else if (input.agentName) {
    // Fuzzy name match — find agents whose name contains the search term
    const agents = await ctx.prisma.agent.findMany({
      where: { userId: ctx.userId },
      include: { wallet: true },
    });
    agent = agents.find((a) =>
      a.name.toLowerCase().includes(input.agentName!.toLowerCase()),
    );
  } else {
    // No identifier given — list agents for the user to pick
    const agents = await ctx.prisma.agent.findMany({
      where: { userId: ctx.userId },
      include: { wallet: true },
    });
    return JSON.stringify({
      error: 'Please specify which agent to fund.',
      availableAgents: agents.map((a) => ({ id: a.id, name: a.name, address: a.wallet.address })),
    });
  }

  if (!agent) return JSON.stringify({ error: 'Agent not found.' });

  return JSON.stringify({
    action: 'fund_agent',
    agentId: agent.id,
    agentName: agent.name,
    depositAddress: agent.wallet.address,
    chain: 'arc-testnet',
    token: 'USDC',
    requestedAmount: input.amountUsdc ?? null,
    instruction:
      'Send USDC to the depositAddress on arc-testnet from your connected Privy wallet. The frontend will open the Fund Vault modal pre-filled with this address.',
  });
}
async function handleExecuteTransaction(
  input: { fromAgentId: string; toAddress: string; amountUsdc: number; memo?: string },
  ctx: ToolContext,
): Promise<string> {
  const agent = await ctx.prisma.agent.findFirst({
    where: { id: input.fromAgentId, userId: ctx.userId },
    include: { wallet: true },
  });
  if (!agent) return JSON.stringify({ error: 'Source agent not found or not owned by you.' });

  // Safety floor — never execute if amount is zero or negative
  if (input.amountUsdc <= 0) {
    return JSON.stringify({ error: 'Amount must be greater than 0 USDC.' });
  }

  try {
    const result = await ctx.circle.sendUsdcFromAgentWallet(
      agent.walletId,
      input.toAddress,
      input.amountUsdc,
    );

    // Log it in the activity history
    await ctx.prisma.activityLog.create({
      data: {
        agentId: agent.id,
        actionType: 'TRANSFER',
        status: result.state,
        txHash: result.transactionId,
        payload: {
          to: input.toAddress,
          amountUsdc: input.amountUsdc,
          memo: input.memo ?? '',
          initiatedBy: 'agent_autonomous',
        },
      },
    });

    return JSON.stringify({
      success: true,
      transactionId: result.transactionId,
      state: result.state,
      from: agent.wallet.address,
      to: input.toAddress,
      amountUsdc: input.amountUsdc,
      memo: input.memo ?? '',
      explorerUrl: `https://testnet.arcscan.app/tx/${result.transactionId}`,
      message: `${input.amountUsdc} USDC sent from ${agent.name}'s vault to ${input.toAddress}. Transaction is ${result.state}.`,
    });
  } catch (err: any) {
    return JSON.stringify({
      success: false,
      error: err.message ?? 'Transaction failed.',
      suggestion: 'Check the agent vault has sufficient USDC balance and the destination address is valid.',
    });
  }
}

async function handleGetPublicWalletStats(
  input: { address: string },
  ctx: ToolContext,
): Promise<string> {
  try {
    const statsService = new AppService(ctx.prisma);
    const stats = await statsService.getWalletStats(input.address);
    return JSON.stringify(stats);
  } catch (err) {
    return JSON.stringify({ error: `Failed to fetch stats for wallet: ${err.message}` });
  }
}

async function handleBridgeUsdc(
  input: {
    fromAgentId: string;
    destinationChain: string;
    recipientAddress: string;
    amountUsdc: number;
  },
  ctx: ToolContext,
): Promise<string> {
  const agent = await ctx.prisma.agent.findFirst({
    where: { id: input.fromAgentId, userId: ctx.userId },
    include: { wallet: true },
  });
  if (!agent) return JSON.stringify({ error: 'Source agent not found.' });

  // Map chain string to CCTP Chain name
  const chainMapping: Record<string, string> = {
    solana: 'Solana_Devnet',
    base: 'Base_Sepolia',
    sui: 'Sui_Testnet',
    ethereum: 'Ethereum_Sepolia',
    arbitrum: 'Arbitrum_Sepolia',
    arc: 'Arc_Testnet',
  };

  const destChainKey = input.destinationChain.toLowerCase();
  const destChain = chainMapping[destChainKey];
  if (!destChain) {
    return JSON.stringify({
      error: `Unsupported destination chain: ${input.destinationChain}. Supported chains are: Solana, Base, Sui, Ethereum, Arbitrum, Arc.`,
    });
  }

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    return JSON.stringify({ error: 'Circle API configuration missing on the server.' });
  }

  try {
    const { AppKit } = await import('@circle-fin/app-kit');
    const { createCircleWalletsAdapter } = await import('@circle-fin/adapter-circle-wallets');

    const kit = new AppKit();
    const adapter = createCircleWalletsAdapter({
      apiKey,
      entitySecret,
    });

    const result = await kit.bridge({
      from: {
        adapter,
        chain: 'Arc_Testnet',
        address: agent.wallet.address,
      },
      to: {
        recipientAddress: input.recipientAddress,
        chain: destChain as any,
        useForwarder: true,
      },
      amount: input.amountUsdc.toFixed(2),
    });

    await ctx.prisma.activityLog.create({
      data: {
        agentId: agent.id,
        actionType: 'transfer',
        status: result.state,
        txHash: result.steps?.find((s: any) => s.name === 'burn')?.txHash || null,
        payload: JSON.parse(JSON.stringify({
          to: input.recipientAddress,
          amountUsdc: input.amountUsdc,
          destinationChain: destChain,
          bridgeResult: result,
        })),
      },
    });

    return JSON.stringify({
      success: true,
      state: result.state,
      steps: result.steps,
      message: `USDC bridge initiated successfully from ${agent.name} to ${input.destinationChain}. Status: ${result.state}`,
    });
  } catch (err: any) {
    return JSON.stringify({
      success: false,
      error: err.message ?? 'Cross-chain bridge transfer failed.',
    });
  }
}

