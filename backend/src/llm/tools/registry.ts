import Anthropic from '@anthropic-ai/sdk';

/**
 * Core tool registry for the ArcWallet AI agent.
 * Each tool maps to a handler in handlers.ts.
 * Claude 3.5 Sonnet will select and call these based on the user's prompt.
 */
export const CORE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_wallet_balance',
    description:
      'Fetch the live USDC token balance for a specific agent wallet from Circle. Use this when the user asks about wallet balance, funds, vault, or USDC amounts.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose wallet balance should be fetched.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'get_agent_info',
    description:
      'Retrieve full details about a specific AI agent: its name, status (active/paused), Circle wallet address, configured rules count, and current configuration. Use when the user asks what an agent is doing, its status, or its wallet address.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent to retrieve info for.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'list_agents',
    description:
      'List all AI agents owned by the authenticated user. Returns name, status, wallet address and balance for each agent. Use when the user asks "show me my agents", "how many agents do I have", or "list my wallets".',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_activity_log',
    description:
      'Retrieve the recent activity history for an agent: past transactions, rule triggers, errors, and swap executions. Use when the user asks "what happened", "show history", "last transactions", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose activity log to retrieve.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of log entries to return. Defaults to 10.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'prepare_transaction',
    description:
      'Prepare a USDC transfer transaction payload for the user to review and sign. Do NOT execute directly — always return to the user for confirmation first. Use when the user says "send", "transfer", "pay", or "move funds" but has NOT explicitly said "just do it", "execute", "go ahead", or "no confirmation".',
    input_schema: {
      type: 'object',
      properties: {
        fromAgentId: {
          type: 'string',
          description: 'The agent wallet ID to send from.',
        },
        toAddress: {
          type: 'string',
          description: 'The destination wallet address (0x...).',
        },
        amountUsdc: {
          type: 'number',
          description: 'Amount of USDC to transfer.',
        },
      },
      required: ['toAddress', 'amountUsdc'],
    },
  },
  {
    name: 'execute_transaction',
    description:
      'Autonomously send USDC from the agent\'s Circle vault wallet to any address WITHOUT requiring user confirmation. The transaction is signed server-side. Use ONLY when the user explicitly says "just do it", "send it now", "execute", "no confirmation needed", "go ahead", or has already confirmed the action. Never use this speculatively — only when the user has clearly authorised the transfer with amount and destination.',
    input_schema: {
      type: 'object',
      properties: {
        fromAgentId: {
          type: 'string',
          description: 'The database ID of the agent whose Circle wallet will send the USDC.',
        },
        toAddress: {
          type: 'string',
          description: 'Destination wallet address (0x...) to receive USDC.',
        },
        amountUsdc: {
          type: 'number',
          description: 'Amount of USDC to send.',
        },
        memo: {
          type: 'string',
          description: 'Optional note or reason for this transfer (e.g. "fund testing agent", "pay for API").',
        },
      },
      required: ['fromAgentId', 'toAddress', 'amountUsdc'],
    },
  },
  {
    name: 'fund_agent',
    description:
      'Look up an agent\'s wallet address so the user can fund it with USDC from their main wallet. Use when the user says "fund", "top up", "deposit into", "add money to" an agent, or asks for an agent\'s deposit address. Returns the wallet address and a ready-to-use funding action card. Accepts either an agentId or a partial agent name.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent to fund. Use this if you know the exact ID.',
        },
        agentName: {
          type: 'string',
          description: 'Partial or full name of the agent to fund (case-insensitive). Used when the user mentions the agent by name instead of ID.',
        },
        amountUsdc: {
          type: 'number',
          description: 'The amount of USDC the user wants to deposit. Optional — if not specified, return the address without an amount.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_public_wallet_stats',
    description:
      'Retrieve live analytics, balances, transaction counts, volume trends, and bridge volumes for ANY public wallet address on the Arc blockchain. Use this when the user enters or asks about a 0x... wallet address stats, transaction history, or portfolio value.',
    input_schema: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'The 0x EVM wallet address to get stats for.',
        },
      },
      required: ['address'],
    },
  },
  {
    name: 'bridge_usdc',
    description:
      'Bridge USDC tokens from an agent\'s vault to another chain (such as Solana, Base, Ethereum, Arbitrum, or Sui) using CCTP. Use when the user asks to bridge, move cross-chain, or send USDC from an agent to another chain.',
    input_schema: {
      type: 'object',
      properties: {
        fromAgentId: {
          type: 'string',
          description: 'The database ID of the sending agent.',
        },
        destinationChain: {
          type: 'string',
          description: 'The chain to bridge USDC to (e.g., "Solana", "Base", "Sui", "Ethereum", "Arbitrum").',
        },
        recipientAddress: {
          type: 'string',
          description: 'The recipient address on the destination chain (e.g. 0x... or Solana public key).',
        },
        amountUsdc: {
          type: 'number',
          description: 'Amount of USDC to bridge.',
        },
      },
      required: ['fromAgentId', 'destinationChain', 'recipientAddress', 'amountUsdc'],
    },
  },
];

