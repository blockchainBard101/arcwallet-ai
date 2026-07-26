import Anthropic from '@anthropic-ai/sdk';

/**
 * Core tool registry for the BlockGENT agent.
 * Each tool maps to a handler in handlers.ts.
 * Claude 3.5 Sonnet will select and call these based on the user's prompt.
 */
export const CORE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'analyze_transaction',
    description:
      'Analyze an EVM blockchain transaction given its transaction hash. Fetches raw transaction data, receipt, and attempts to decode standard ERC-20 token events (Transfer, Approval) into plain English explanations.',
    input_schema: {
      type: 'object',
      properties: {
        txHash: {
          type: 'string',
          description: 'The 0x-prefixed transaction hash to analyze.',
        },
      },
      required: ['txHash'],
    },
  },
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
  {
    name: 'create_rule',
    description:
      'Create a new automation rule for an agent. Use when the user says "add a rule", "create a rule", "set up a rule", or similar condition (e.g., "if balance drops below X, transfer Y to Z"). The rule triggers automatically when conditions are met.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent to attach the rule to.',
        },
        naturalRuleText: {
          type: 'string',
          description: 'The raw natural language text of the rule.',
        },
        trigger: {
          type: 'object',
          description: 'The trigger condition config.',
          properties: {
            type: { type: 'string', enum: ['balance'], description: 'The type of trigger.' },
            token: { type: 'string', description: 'Token symbol to monitor (e.g. USDC).' },
            operator: { type: 'string', enum: ['below', 'above'], description: 'Comparison operator.' },
            value: { type: 'number', description: 'Threshold value.' },
          },
          required: ['type', 'token', 'operator', 'value'],
        },
        action: {
          type: 'object',
          description: 'The action config to execute when triggered.',
          properties: {
            type: { type: 'string', enum: ['transfer', 'swap'], description: 'Type of action.' },
            amount: { type: 'number', description: 'Amount of tokens to move or swap.' },
            to: { type: 'string', description: 'Recipient wallet address (0x...) for transfer actions.' },
            fromToken: { type: 'string', description: 'Source token symbol (e.g. USDC) for swap actions.' },
            toToken: { type: 'string', description: 'Target token symbol (e.g. EURC) for swap actions.' },
          },
          required: ['type', 'amount'],
        },
      },
      required: ['agentId', 'naturalRuleText', 'trigger', 'action'],
    },
  },
  {
    name: 'list_rules',
    description:
      'List all automation rules associated with a specific agent. Use when the user asks "what rules are set up", "show rules", "list my rules", or wants to see current automations.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose rules to retrieve.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'delete_rule',
    description:
      'Delete or cancel a specific automation rule using its rule ID. Use when the user says "delete rule X", "cancel rule Y", "remove this rule", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        ruleId: {
          type: 'string',
          description: 'The database ID of the rule to delete.',
        },
      },
      required: ['ruleId'],
    },
  },
  {
    name: 'set_alert',
    description:
      'Create a new alert/notification monitor for the user. Use when the user says "set an alert when...", "notify me when...", "warn me if...", or similar conditions (e.g. notify if gas exceeds 50 gwei, alert if balance drops below 10 USDC).',
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['balance', 'volume', 'custom'],
          description: 'The type of alert to set.',
        },
        condition: {
          type: 'object',
          description: 'The monitoring condition configuration.',
          properties: {
            token: { type: 'string', description: 'Token symbol if monitoring balance/volume (e.g. USDC).' },
            operator: { type: 'string', enum: ['below', 'above'], description: 'Comparison operator.' },
            value: { type: 'number', description: 'Threshold value.' },
            customDescription: { type: 'string', description: 'Detailed text for custom alerts (e.g. "gas price exceeds 50 Gwei").' },
          },
          required: [],
        },
      },
      required: ['type', 'condition'],
    },
  },
  {
    name: 'list_active_alerts',
    description:
      'List all active alerts and notifications configured by the user. Use when the user asks "what alerts do I have set up", "show active alerts", "list my alerts", or wants to see current monitoring criteria.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'delete_alert',
    description:
      'Delete or cancel a specific alert using its alert ID. Use when the user says "delete alert X", "remove alert Y", "dismiss notification rule", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'The database ID of the alert to delete.',
        },
      },
      required: ['alertId'],
    },
  },
  {
    name: 'find_yield_opportunities',
    description:
      'Scan and identify high-yield investment opportunities for USDC/EURC stablecoins on the Arc L1 network (e.g. liquidity pools, lending markets). Use when the user asks "where can I get yield", "show yield opportunities", "find pools", or similar.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'deposit_to_yield_pool',
    description:
      'Deposit USDC into a specified DeFi yield pool on the Arc L1 network. Use this when the user explicitly asks to "deposit into ArcLend", "supply USDC to yield pool", or similar actions to earn yield.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose wallet will supply the USDC.',
        },
        poolName: {
          type: 'string',
          description: 'The name of the pool to deposit into (e.g., "ArcLend USDC Core").',
        },
        amountUsdc: {
          type: 'number',
          description: 'Amount of USDC to deposit.',
        },
      },
      required: ['agentId', 'poolName', 'amountUsdc'],
    },
  },
  {
    name: 'rebalance_portfolio',
    description:
      'Rebalance the assets held in an agent\'s vault wallet according to target percentage splits (e.g. rebalance to 70% USDC and 30% EURC). Use when the user says "rebalance", "change my portfolio split", "set target allocation", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose vault should be rebalanced.',
        },
        targetAllocation: {
          type: 'object',
          description: 'The target token percentage split, mapping token symbols (e.g. USDC, EURC) to integer percent values (e.g. {"USDC": 70, "EURC": 30}). The total sum of percentages must be 100.',
          additionalProperties: { type: 'number' },
        },
      },
      required: ['agentId', 'targetAllocation'],
    },
  },
  {
    name: 'get_token_info',
    description:
      'Look up detailed metadata information for a specific token symbol on the Arc blockchain network. Use when the user asks "what is token X", "tell me about EURC contract", "token address for USDC", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'The token symbol to look up (e.g. USDC, EURC).',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'analyze_contract',
    description:
      'Analyze the smart contract byte-code or status of a specific 0x contract address. Determines if a given address is a smart contract, checks its deployment status, and provides a security/operational report. Use when the user asks "analyze contract X", "is Y a contract", "what is deployed at address Z", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        contractAddress: {
          type: 'string',
          description: 'The 0x EVM contract address to verify and analyze.',
        },
      },
      required: ['contractAddress'],
    },
  },
  {
    name: 'get_spending_policy',
    description:
      'Retrieve the current on-chain spending policy caps (per-transaction, daily, weekly, monthly USDC limits) for a specific agent wallet. Use when the user asks "show spending limits", "what are my caps", "check spending policy", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose spending policy to retrieve.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'set_spending_policy',
    description:
      'Generate the verbatim CLI command to configure USDC spending caps (per-transaction, daily, weekly, monthly) on an agent wallet. The agent NEVER executes this — it returns the command for the user to run themselves in their terminal because it requires OTP email confirmation. Use when the user asks to "set spending limit", "configure caps", "limit my agent wallet to X per day", or similar.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose spending caps to configure.',
        },
        perTx: {
          type: 'number',
          description: 'Maximum USDC allowed per single transaction.',
        },
        daily: {
          type: 'number',
          description: 'Maximum USDC allowed per day.',
        },
        weekly: {
          type: 'number',
          description: 'Maximum USDC allowed per week.',
        },
        monthly: {
          type: 'number',
          description: 'Maximum USDC allowed per month.',
        },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'discover_paid_services',
    description:
      'Search Circle\'s x402 marketplace for paid API services by keyword. Returns service name, description, price per call, and supported chains. Use when the user wants to find a paid service to call ("find a web search service", "what crypto price services are available?", "search for weather APIs"), or before making a nanopay_call to discover the right endpoint.',
    input_schema: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'Search term for the marketplace (e.g. "crypto", "web search", "weather", "news").',
        },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'nanopay_call',
    description:
      'Pay for and call a Circle x402 paid API endpoint using the agent\'s Circle wallet. Handles the full inspect → pay flow: inspects the endpoint to surface the per-call cost, pays in USDC from the agent wallet, and returns the response data. Use when the user wants to use a paid data service (crypto prices, web search, news, weather, etc.) or when free APIs are unavailable/rate-limited. Always search via discover_paid_services first if the exact service URL is not known.',
    input_schema: {
      type: 'object',
      properties: {
        agentId: {
          type: 'string',
          description: 'The database ID of the agent whose wallet will be charged.',
        },
        serviceUrl: {
          type: 'string',
          description: 'The full URL of the x402 paid API endpoint to call.',
        },
        chain: {
          type: 'string',
          description: 'The blockchain chain to pay from (e.g. "BASE", "MATIC", "ETH"). Defaults to BASE.',
        },
        data: {
          type: 'object',
          description: 'Optional JSON body/query parameters to send to the service endpoint.',
        },
      },
      required: ['agentId', 'serviceUrl'],
    },
  },
  {
    name: 'swap_tokens',
    description:
      'Swap tokens (such as USDC to EURC, or USDT to USDC) within an agent\'s vault wallet using Circle App Kit / Swap Kit. Use when the user asks to swap, exchange, trade, convert stablecoins, or perform token swaps.',
    input_schema: {
      type: 'object',
      properties: {
        fromAgentId: {
          type: 'string',
          description: 'The database ID of the agent whose wallet will execute the swap.',
        },
        tokenIn: {
          type: 'string',
          description: 'The symbol of the token to swap from (e.g. "USDC", "EURC", "USDT", "WETH").',
        },
        tokenOut: {
          type: 'string',
          description: 'The symbol of the token to swap to (e.g. "EURC", "USDC", "USDT", "WETH").',
        },
        amountIn: {
          type: 'number',
          description: 'The amount of tokenIn to swap.',
        },
        chain: {
          type: 'string',
          description: 'The chain identifier to run the swap on (e.g. "Arc_Testnet", "Ethereum", "Base", "Arbitrum", "Solana"). Defaults to "Arc_Testnet".',
        },
        slippageBps: {
          type: 'number',
          description: 'Optional slippage tolerance in basis points (e.g. 100 for 1%, 300 for 3%). Defaults to 100.',
        },
      },
      required: ['fromAgentId', 'tokenIn', 'tokenOut', 'amountIn'],
    },
  },
];
