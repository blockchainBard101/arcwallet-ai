import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { PrismaService } from '../prisma/prisma.service';
import { CircleService } from '../circle/circle.service';
import { X402ClientService } from '../circle/x402-client.service';
import { CORE_TOOLS } from './tools/registry';
import { executeTool } from './tools/handlers';
import { TransactionService } from '../transaction/transaction.service';
import { SubscriptionService } from '../subscription/subscription.service';

// ──────────────────────────────────────────────────────────
// Provider config resolved from agent.configuration in DB
// ──────────────────────────────────────────────────────────
interface AgentLlmConfig {
  provider: 'anthropic' | 'openai' | 'grok';
  apiKey: string;
  model: string;
  agentId?: string;
  agentName: string;
}

const PROVIDER_MODELS: Record<AgentLlmConfig['provider'], string> = {
  anthropic: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  grok: 'grok-2-1212',
};

const GROK_BASE_URL = 'https://api.x.ai/v1';

const BASE_SYSTEM_PROMPT = `You are ArcAgent, an intelligent AI wallet assistant for BlockGENT — a DeFi automation platform on the Arc blockchain where USDC is the native gas token.

You help users:
- Check their Circle agent wallet balances and on-chain activity
- Understand and manage their AI automation rules
- Prepare USDC transfers for user approval
- Explain blockchain data in plain, accessible language
- Search for and execute paid marketplace API services (such as sending emails, sending SMS messages, checking weather or crypto price feeds) using x402 marketplace tools

Rules you MUST follow:
1. ALWAYS call the appropriate tool before answering any question about wallet balances, agents, or transactions. Never guess numbers.
2. When the user says "my balance", "my wallet", "this agent", or similar — use the CURRENT AGENT ID provided below. Do NOT call list_agents.
3. For transfer vs bridge actions:
   - If the user asks to "bridge", "cross-chain", or send USDC to another chain (Base, Solana, Ethereum, Sui, Arbitrum), call 'bridge_usdc'.
   - **DEFAULT FOR TRANSFERS**: If the user asks to send or transfer USDC to an address on Arc, ALWAYS default to autonomous server-side execution via 'execute_transaction' using the agent's vault wallet.
   - **PRIVY ONLY**: Call 'prepare_transaction' ONLY when the user explicitly requests to send from their personal/primary wallet, mentions Privy, or states they want to sign/approve the transaction manually on the frontend.
4. Keep responses concise, clear, and human-friendly. Format numbers properly (e.g. "1,250.00 USDC").
5. If the user asks to perform an action not covered by your core tools (such as sending an email, sending an SMS, or fetching dynamic external data), search for a paid service using 'discover_paid_services' and invoke it via 'nanopay_call'.
6. If a tool returns an error, explain it plainly and suggest next steps.

## CRITICAL RULE-CREATION GUIDELINES (never deviate from these)

When calling 'create_rule', you MUST choose the correct action type:

### action.type = 'swap'  ← Use when user says: convert, exchange, swap, turn X into Y
  - Required fields: fromToken (e.g. "USDC"), toToken (e.g. "EURC"), amount (number)
  - NEVER set 'to' field for swap actions — it is irrelevant and must be omitted
  - Example: "convert 1 USDC to EURC" → { type: "swap", fromToken: "USDC", toToken: "EURC", amount: 1 }

### action.type = 'transfer'  ← Use ONLY when user specifies a wallet address recipient
  - Required fields: to (a 0x wallet address), amount (number)
  - NEVER set 'to' to a token symbol like "EURC" — that is NOT a wallet address
  - Example: "send 2 USDC to 0xABC..." → { type: "transfer", to: "0xABC...", amount: 2 }

### trigger.type choices:
  - 'balance': Evaluates current balance every 30s. Use when user says "if balance is above/below X"
  - 'received': Fires once when a deposit arrives. Use when user says "when I receive X", "if it receives X", "when X USDC arrives"
  - For "receives more than 2 USDC" → trigger: { type: "received", token: "USDC", value: 2, operator: "above" }
  - For "balance goes above 2 USDC" → trigger: { type: "balance", token: "USDC", value: 2, operator: "above" }

### IMPORTANT: Never confuse 'swap' and 'transfer'. Converting USDC to EURC is ALWAYS a swap, never a transfer.`;

function buildSystemPrompt(agentId: string | undefined, agentName: string, tier: string = 'free'): string {
  const agentContext = agentId ? `
## Current Agent Context
You are currently acting as the agent named "${agentName}" (ID: ${agentId}).
When the user refers to "my balance", "my wallet", "this agent", or asks anything without specifying another agent,
ALWAYS default to agentId "${agentId}". Do NOT call list_agents for single-agent questions.` : `
## Current Agent Context
You are currently acting as the Public Explorer Agent (${agentName}). You can query public wallet statistics and help the user explore the Arc blockchain.
CRITICAL: As the Public Explorer Agent, you do not have an agent wallet vault. Therefore, you CANNOT execute transactions autonomously. If the user asks to send, transfer, or move USDC, you MUST call 'prepare_transaction' so the user can sign and execute it from their own primary (Privy) wallet on the frontend. Never attempt to call 'execute_transaction'.`;

  const tierContext = `
## Subscription Tier & Marketplace Restrictions
The current user is on the "${tier.toUpperCase()}" plan.
- If the user is on the "FREE" tier, they do NOT have access to external paid marketplace services/nanopayments (budget is $0.00). If they ask you to perform any paid services or query marketplace APIs (e.g. CoinGecko, sending emails/SMS, retrieving off-chain data), you MUST refuse and explicitly tell them they must upgrade to the Pro plan to access these services.
`;

  const serviceCatalog = `
## Marketplace Service Catalog (x402 Paid APIs)
You have direct access to the following services via \`nanopay_call\`. When a user references any of these by name (even partially), use the URL below DIRECTLY — do NOT call \`discover_paid_services\` first:

| Service Name | Category | URL |
|---|---|---|
| Exa Neural Search | search | https://exa.ai/x402 |
| Perplexity Sonar API | search | https://perplexity.ai/x402 |
| Tavily Deep Research | search | https://tavily.com/x402 |
| Firecrawl Web Scraper | search | https://firecrawl.dev/x402 |
| Brave Web Search API | search | https://brave.com/x402 |
| Goldsky Crypto Intelligence | crypto | https://goldsky.com/x402 |
| CoinGecko Market Data | crypto | https://coingecko.com/x402 |
| DexScreener Pair Analytics | crypto | https://dexscreener.com/x402 |
| DefiLlama Yield & TVL | crypto | https://defillama.com/x402 |
| Birdeye Trader Analytics | crypto | https://birdeye.so/x402 |
| Dune Analytics Query Runner | crypto | https://dune.com/x402 |
| Bland AI Voice Calling | communication | https://bland.ai/x402 |
| Twilio SMS Gateway | communication | https://twilio.com/x402 |
| Resend Email Dispatch | communication | https://resend.com/x402 |
| ElevenLabs Voice Synthesis | communication | https://elevenlabs.io/x402 |
| SendGrid Email Relay | communication | https://sendgrid.com/x402 |
| Telegram Dispatcher | communication | https://telegram.org/x402 |
| StableEnrich Data | data | https://stableenrich.dev/x402 |
| Clearbit Person & Company | data | https://clearbit.com/x402 |
| Hunter Email Verifier | data | https://hunter.io/x402 |
| Abstract IP Geolocation | data | https://abstractapi.com/x402 |
| Proxycurl Professional Graph | data | https://proxycurl.com/x402 |
| StableDomains Registrar | domains | https://stabledomains.dev/x402 |
| ENS Identity Resolver | domains | https://ens.domains/x402 |
| Cloudflare DNS & Security | domains | https://cloudflare.com/x402 |
| Unstoppable Web3 Domains | domains | https://unstoppabledomains.com/x402 |
| X Social Analytics | social | https://api.x.com/x402 |
| Reddit Web3 Sentiment | social | https://reddit.com/x402 |
| Farcaster Hub Casts | social | https://farcaster.xyz/x402 |
| YouTube Video Insights | social | https://youtube.com/x402 |
| OpenAI GPT-4o Inference | compute | https://openai.com/x402 |
| Anthropic Claude 3.5 Sonnet | compute | https://anthropic.com/x402 |
| DeepSeek V3 Inference | compute | https://deepseek.com/x402 |
| Replicate Open Model Host | compute | https://replicate.com/x402 |

**IMPORTANT**: When a user says "run task using X Social Analytics", "use CoinGecko", "fetch with Exa", or names ANY service from the table above — look up the URL directly and call \`nanopay_call\` with it. Pass any relevant user data (account handle, query, email, etc.) in the \`data\` field. Only fall back to \`discover_paid_services\` if the user mentions a service NOT in this catalog.
`;

  return `${BASE_SYSTEM_PROMPT}
${agentContext}
${tierContext}
${tier !== 'free' ? serviceCatalog : ''}`;
}

const MAX_HISTORY_MESSAGES = 20;

export interface ChatResponse {
  sessionId: string;
  message: string;
  structuredData: {
    charts: Record<string, any>;
    transactions: any[];
    actions: any[];
  };
  toolsUsed: string[];
  confidence: number;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly circle: CircleService,
    private readonly x402: X402ClientService,
    private readonly transactionService: TransactionService,
    private readonly subscriptionService: SubscriptionService,
  ) {}

  // ──────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────

  async chat(
    userId: string,
    userMessage: string,
    sessionId?: string,
    agentId?: string,
  ): Promise<ChatResponse> {
    // 0. Enforce subscription LLM limits
    await this.subscriptionService.checkLlmLimit(userId);

    // 1. Resolve agent LLM config from DB (provider + user's API key)
    const llmConfig = await this.resolveLlmConfig(userId, agentId);

    // 2. Resolve or create a session
    const session = await this.resolveSession(userId, sessionId, agentId);

    // 3. Load conversation history
    const history = await this.loadHistory(session.id);

    // 4. Persist incoming user message
    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: userMessage },
    });

    // 5. Build context-aware system prompt and run the tool-calling loop
    const sub = await this.subscriptionService.getSubscription(userId);
    const systemPrompt = buildSystemPrompt(llmConfig.agentId, llmConfig.agentName, sub.tier);
    const { finalText, toolsUsed, structuredData } =
      llmConfig.provider === 'anthropic'
        ? await this.runAnthropicLoop(history, userMessage, userId, llmConfig, systemPrompt)
        : await this.runOpenAILoop(history, userMessage, userId, llmConfig, systemPrompt);

    // 6. Persist assistant reply and update limits
    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: finalText },
    });
    await this.subscriptionService.incrementLlmUsage(userId);

    // 7. Prune to rolling window
    await this.pruneHistory(session.id);

    return {
      sessionId: session.id,
      message: finalText,
      structuredData,
      toolsUsed,
      confidence: toolsUsed.length > 0 ? 0.97 : 0.85,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Provider resolution — reads the agent's configuration JSON
  // ──────────────────────────────────────────────────────────

  private async resolveLlmConfig(
    userId: string,
    agentId?: string,
  ): Promise<AgentLlmConfig> {
    if (!agentId) {
      const provider = (process.env.LLM_PROVIDER || 'openai') as AgentLlmConfig['provider'];
      const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        throw new BadRequestException('No default LLM API key configured on the server.');
      }
      return {
        provider,
        apiKey,
        model: PROVIDER_MODELS[provider] ?? PROVIDER_MODELS.openai,
        agentName: 'Public Explorer Agent',
      };
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new BadRequestException('Agent not found or not owned by you.');
    }

    const config = agent.configuration as Record<string, any>;
    let provider = config?.provider as AgentLlmConfig['provider'] | undefined;
    let apiKey = config?.apiKey as string;

    if (!apiKey || apiKey.trim() === '') {
      // Fallback to server default provider and its key
      provider = (process.env.LLM_PROVIDER || 'openai') as AgentLlmConfig['provider'];
      apiKey = (provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY) || '';
    }

    if (!apiKey || apiKey.trim() === '') {
      throw new BadRequestException(
        `This agent has no API key configured. Please update the agent settings or configure ${provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'} in the server environment.`,
      );
    }

    // Default to the resolved provider's standard model
    const resolvedProvider = provider || 'openai';

    return {
      provider: resolvedProvider,
      apiKey,
      model: PROVIDER_MODELS[resolvedProvider] ?? PROVIDER_MODELS.openai,
      agentId,
      agentName: agent.name,
    };
  }

  // ──────────────────────────────────────────────────────────
  // Anthropic loop (Claude 3.5 Sonnet)
  // ──────────────────────────────────────────────────────────

  private async runAnthropicLoop(
    history: Anthropic.MessageParam[],
    userMessage: string,
    userId: string,
    config: AgentLlmConfig,
    systemPrompt: string,
  ): Promise<{ finalText: string; toolsUsed: string[]; structuredData: ChatResponse['structuredData'] }> {
    const client = new Anthropic({ apiKey: config.apiKey });
    const toolsUsed: string[] = [];
    const structuredData: ChatResponse['structuredData'] = { charts: {}, transactions: [], actions: [] };

    let messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: userMessage },
    ];

    for (let i = 0; i < 8; i++) {
      const response = await client.messages.create({
        model: config.model,
        max_tokens: 2048,
        system: systemPrompt,
        tools: CORE_TOOLS,
        messages,
      });

      this.logger.debug(`[Anthropic] stop_reason: ${response.stop_reason}`);

      if (response.stop_reason === 'end_turn') {
        const textBlock = response.content.find((b) => b.type === 'text');
        return {
          finalText: textBlock?.type === 'text' ? textBlock.text : '(No response)',
          toolsUsed,
          structuredData,
        };
      }

      if (response.stop_reason === 'tool_use') {
        const toolBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
        );
        messages.push({ role: 'assistant', content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        for (const tool of toolBlocks) {
          this.logger.log(`[Anthropic] Tool call: ${tool.name}`);
          toolsUsed.push(tool.name);
          const result = await executeTool(
            tool.name,
            tool.input as Record<string, any>,
            {
              userId,
              prisma: this.prisma,
              circle: this.circle,
              x402: this.x402,
              transactionService: this.transactionService,
              subscriptionService: this.subscriptionService,
            },
          );
          this.enrichStructuredData(tool.name, result, structuredData);
          toolResults.push({ type: 'tool_result', tool_use_id: tool.id, content: result });
        }
        messages.push({ role: 'user', content: toolResults });
      }
    }

    return { finalText: 'Unable to complete after multiple steps.', toolsUsed, structuredData };
  }

  // ──────────────────────────────────────────────────────────
  // OpenAI / Grok loop (GPT-4o or grok-2-1212)
  // Grok uses the OpenAI-compatible REST API — same SDK, different baseURL
  // ──────────────────────────────────────────────────────────

  private async runOpenAILoop(
    history: Anthropic.MessageParam[],
    userMessage: string,
    userId: string,
    config: AgentLlmConfig,
    systemPrompt: string,
  ): Promise<{ finalText: string; toolsUsed: string[]; structuredData: ChatResponse['structuredData'] }> {
    const client = new OpenAI({
      apiKey: config.apiKey,
      ...(config.provider === 'grok' ? { baseURL: GROK_BASE_URL } : {}),
    });

    const toolsUsed: string[] = [];
    const structuredData: ChatResponse['structuredData'] = { charts: {}, transactions: [], actions: [] };

    // Convert Anthropic-style history to OpenAI format
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
      })),
      { role: 'user', content: userMessage },
    ];

    // Convert Anthropic tool registry to OpenAI function format
    const openaiTools: OpenAI.Chat.ChatCompletionTool[] = CORE_TOOLS.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));

    for (let i = 0; i < 8; i++) {
      const response = await client.chat.completions.create({
        model: config.model,
        messages,
        tools: openaiTools,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      this.logger.debug(`[OpenAI] finish_reason: ${choice.finish_reason}`);

      if (choice.finish_reason === 'stop') {
        return {
          finalText: choice.message.content ?? '(No response)',
          toolsUsed,
          structuredData,
        };
      }

      if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
        messages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          if (toolCall.type !== 'function') continue;
          const name = toolCall.function.name;
          const input = JSON.parse(toolCall.function.arguments || '{}');
          this.logger.log(`[OpenAI] Tool call: ${name}`);
          toolsUsed.push(name);

          const result = await executeTool(name, input, {
            userId,
            prisma: this.prisma,
            circle: this.circle,
            x402: this.x402,
            transactionService: this.transactionService,
            subscriptionService: this.subscriptionService,
          });
          this.enrichStructuredData(name, result, structuredData);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          });
        }
      }
    }

    return { finalText: 'Unable to complete after multiple steps.', toolsUsed, structuredData };
  }

  // ──────────────────────────────────────────────────────────
  // Session & history helpers
  // ──────────────────────────────────────────────────────────

  private async resolveSession(userId: string, sessionId?: string, agentId?: string) {
    if (sessionId) {
      const existing = await this.prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (existing) return existing;
    }
    return this.prisma.chatSession.create({
      data: { userId, agentId: agentId ?? null },
    });
  }

  private async loadHistory(sessionId: string): Promise<Anthropic.MessageParam[]> {
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_MESSAGES,
    });
    return messages.reverse().map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })) as Anthropic.MessageParam[];
  }

  private async pruneHistory(sessionId: string) {
    const all = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (all.length > MAX_HISTORY_MESSAGES) {
      const toDelete = all.slice(0, all.length - MAX_HISTORY_MESSAGES).map((m) => m.id);
      await this.prisma.chatMessage.deleteMany({ where: { id: { in: toDelete } } });
    }
  }

  private enrichStructuredData(
    toolName: string,
    resultJson: string,
    structuredData: ChatResponse['structuredData'],
  ) {
    try {
      const data = JSON.parse(resultJson);
      if (toolName === 'prepare_transaction') {
        structuredData.actions.push({ type: 'sign_transaction', payload: data });
      }
      if (toolName === 'fund_agent' && data.depositAddress) {
        structuredData.actions.push({ type: 'fund_agent', payload: data });
      }
      if (toolName === 'get_public_wallet_stats') {
        if (data.charts) {
          structuredData.charts = data.charts;
        }
        if (data.transactions) {
          structuredData.transactions.push(...data.transactions);
        }
      }
    } catch {
      // silently skip malformed results
    }
  }

}
