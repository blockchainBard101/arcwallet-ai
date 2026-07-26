"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useApp, getBackendUrl } from "../context/AppContext";
import {
  Search,
  Zap,
  Globe,
  Sparkles,
  ExternalLink,
  Bot,
  ArrowRight,
  ShieldCheck,
  Phone,
  BarChart3,
  FileText,
  DollarSign,
  Mail,
  Cpu,
  Layers,
  Share2,
  Database,
  Lock,
  X,
  Plus,
  Wallet,
  Copy,
  Terminal,
  Check,
} from "lucide-react";

interface ServiceEndpoint {
  path: string;
  method: "GET" | "POST";
  description: string;
  priceUsdc: number;
  examplePayload?: string;
}

const SERVICE_ENDPOINTS: Record<string, ServiceEndpoint[]> = {
  "exa-search": [
    { path: "/search", method: "POST", description: "Semantic search across the web for complex queries.", priceUsdc: 0.02, examplePayload: '{\n  "query": "Circle Agent Stack standards",\n  "numResults": 5\n}' },
    { path: "/findSimilar", method: "POST", description: "Find web pages structurally similar to a target URL.", priceUsdc: 0.02, examplePayload: '{\n  "url": "https://circle.com",\n  "numResults": 3\n}' },
    { path: "/contents", method: "POST", description: "Retrieve parsed clean text/markdown content from target URLs.", priceUsdc: 0.02, examplePayload: '{\n  "ids": ["https://example.com"]\n}' }
  ],
  "perplexity-sonar": [
    { path: "/chat/completions", method: "POST", description: "Query Perplexity's Sonar reasoning model with citations.", priceUsdc: 0.03, examplePayload: '{\n  "model": "sonar",\n  "messages": [\n    { "role": "user", "content": "Recent updates on USDC on Arc L1" }\n  ]\n}' }
  ],
  "tavily-research": [
    { path: "/search", method: "POST", description: "Deep search optimized for autonomous LLM research runs.", priceUsdc: 0.015, examplePayload: '{\n  "query": "Arc blockchain performance benchmarks",\n  "search_depth": "advanced"\n}' }
  ],
  "firecrawl-scraper": [
    { path: "/scrape", method: "POST", description: "Scrape any web page and output clean markdown.", priceUsdc: 0.01, examplePayload: '{\n  "url": "https://developers.circle.com"\n}' },
    { path: "/crawl", method: "POST", description: "Crawl sub-pages of a domain recursively.", priceUsdc: 0.01, examplePayload: '{\n  "url": "https://circle.com",\n  "limit": 10\n}' }
  ],
  "brave-search": [
    { path: "/web/search", method: "GET", description: "Brave independent privacy search index query.", priceUsdc: 0.01 }
  ],
  "coingecko-pro": [
    { path: "/simple/price", method: "GET", description: "Retrieve current prices of tokens in USD/EUR.", priceUsdc: 0.02 },
    { path: "/coins/markets", method: "GET", description: "List coin market values, volume, and rank.", priceUsdc: 0.02 },
    { path: "/coins/{id}/history", method: "GET", description: "Historical pricing checkpoints by date.", priceUsdc: 0.02 }
  ],
  "goldsky": [
    { path: "/subgraphs", method: "POST", description: "Query indexed blockchain data nodes via GraphQL.", priceUsdc: 0.04, examplePayload: '{\n  "query": "{ transfers(first: 5) { id amount sender } }"\n}' }
  ],
  "resend-email": [
    { path: "/emails", method: "POST", description: "Send modern transactional HTML emails.", priceUsdc: 0.02, examplePayload: '{\n  "from": "agent@blockgent.ai",\n  "to": "user@example.com",\n  "subject": "Agent Vault Balance Alert",\n  "html": "<p>Vault balance is below 10 USDC.</p>"\n}' }
  ],
  "sendgrid-email": [
    { path: "/mail/send", method: "POST", description: "Relay delivery emails through SendGrid.", priceUsdc: 0.03, examplePayload: '{\n  "personalizations": [\n    { "to": [{ "email": "user@example.com" }] }\n  ],\n  "from": { "email": "agent@blockgent.ai" },\n  "subject": "Alert",\n  "content": [\n    { "type": "text/plain", "value": "Vault warning." }\n  ]\n}' }
  ],
  "twilio-sms": [
    { path: "/2010-04-01/Accounts/{Sid}/Messages.json", method: "POST", description: "Dispatch SMS text messages globally.", priceUsdc: 0.08, examplePayload: '{\n  "To": "+1234567890",\n  "Body": "Your vault swap rule executed."\n}' }
  ],
  "openai-gpt4o": [
    { path: "/v1/chat/completions", method: "POST", description: "High-speed multimodal LLM inference.", priceUsdc: 0.05, examplePayload: '{\n  "model": "gpt-4o",\n  "messages": [\n    { "role": "user", "content": "Perform yield analysis" }\n  ]\n}' }
  ],
  "anthropic-claude": [
    { path: "/v1/messages", method: "POST", description: "Claude 3.5 Sonnet long-context analysis engine.", priceUsdc: 0.06, examplePayload: '{\n  "model": "claude-3-5-sonnet",\n  "max_tokens": 1024,\n  "messages": [\n    { "role": "user", "content": "Review smart contract bytecode" }\n  ]\n}' }
  ],
  "deepseek-v3": [
    { path: "/v1/chat/completions", method: "POST", description: "Cost-effective mathematical and coding reasoning.", priceUsdc: 0.01, examplePayload: '{\n  "model": "deepseek-chat",\n  "messages": [\n    { "role": "user", "content": "Optimize LP coefficients" }\n  ]\n}' }
  ]
};

const getServiceEndpoints = (service: ServiceItem): ServiceEndpoint[] => {
  const specific = SERVICE_ENDPOINTS[service.id];
  if (specific) return specific;
  
  const price = typeof service.priceUsdc === 'number' ? service.priceUsdc : parseFloat(service.priceUsdc as any) || 0.02;
  
  // Dynamic fallback endpoints
  return [
    {
      path: "/execute",
      method: "POST",
      description: `Default pay-per-call API endpoint for ${service.name}.`,
      priceUsdc: price,
      examplePayload: JSON.stringify({ query: service.examplePrompt }, null, 2)
    },
    {
      path: "/status",
      method: "GET",
      description: `Get real-time health and usage status for ${service.name}.`,
      priceUsdc: 0.005
    }
  ];
};

interface ServiceItem {
  id: string;
  name: string;
  provider: string;
  category: "search" | "crypto" | "communication" | "domains" | "social" | "data" | "compute";
  description: string;
  priceUsdc: number;
  type: "1P" | "3P";
  serviceUrl: string;
  icon: any;
  examplePrompt: string;
}

const MARKETPLACE_SERVICES: ServiceItem[] = [
  // Search & AI Research
  {
    id: "exa-search",
    name: "Exa Neural Search",
    provider: "Exa AI",
    category: "search",
    description: "Deep AI web search across research papers, news, technical documentation, and live web contents.",
    priceUsdc: 0.02,
    type: "1P",
    serviceUrl: "https://exa.ai/x402",
    icon: Search,
    examplePrompt: "Research the latest news on AI agent autonomous payment standards",
  },
  {
    id: "perplexity-sonar",
    name: "Perplexity Sonar API",
    provider: "Perplexity",
    category: "search",
    description: "Real-time web reasoning engine with citation backing and structured JSON responses.",
    priceUsdc: 0.03,
    type: "1P",
    serviceUrl: "https://perplexity.ai/x402",
    icon: Search,
    examplePrompt: "Summarize recent macro updates on USDC adoption across L2s",
  },
  {
    id: "tavily-research",
    name: "Tavily Deep Research",
    provider: "Tavily AI",
    category: "search",
    description: "Optimized search engine tailored for LLM autonomous research agents.",
    priceUsdc: 0.015,
    type: "3P",
    serviceUrl: "https://tavily.com/x402",
    icon: Search,
    examplePrompt: "Perform deep research on Arc blockchain performance benchmarks",
  },
  {
    id: "firecrawl-scraper",
    name: "Firecrawl Web Scraper",
    provider: "Firecrawl",
    category: "search",
    description: "Turn any website URL into clean, LLM-ready markdown format.",
    priceUsdc: 0.01,
    type: "3P",
    serviceUrl: "https://firecrawl.dev/x402",
    icon: Layers,
    examplePrompt: "Scrape and convert circle.com developers documentation to markdown",
  },
  {
    id: "brave-search",
    name: "Brave Web Search API",
    provider: "Brave Software",
    category: "search",
    description: "Privacy-focused independent web search index for AI queries.",
    priceUsdc: 0.01,
    type: "1P",
    serviceUrl: "https://brave.com/x402",
    icon: Search,
    examplePrompt: "Search brave web index for top DeFi yield aggregators in 2026",
  },

  // Crypto & Market Intelligence
  {
    id: "goldsky",
    name: "Goldsky Crypto Intelligence",
    provider: "Goldsky",
    category: "crypto",
    description: "Real-time indexed blockchain data, DEX pool volume, whale alerts, and token analytics.",
    priceUsdc: 0.04,
    type: "1P",
    serviceUrl: "https://goldsky.com/x402",
    icon: BarChart3,
    examplePrompt: "Analyze USDC liquidity pool volume and top holder activity on Arc Testnet",
  },
  {
    id: "coingecko-pro",
    name: "CoinGecko Market Data",
    provider: "CoinGecko",
    category: "crypto",
    description: "Global cryptocurrency prices, market cap, historical volume, and exchange orderbooks.",
    priceUsdc: 0.02,
    type: "1P",
    serviceUrl: "https://coingecko.com/x402",
    icon: BarChart3,
    examplePrompt: "Get realtime prices and 24h market metrics for USDC, EURC, and ETH",
  },
  {
    id: "dexscreener-api",
    name: "DexScreener Pair Analytics",
    provider: "DexScreener",
    category: "crypto",
    description: "Realtime DEX trading pairs, liquidity pool depths, and instant price charts.",
    priceUsdc: 0.01,
    type: "3P",
    serviceUrl: "https://dexscreener.com/x402",
    icon: BarChart3,
    examplePrompt: "Fetch top trending liquidity pairs on Arc Testnet DEXs",
  },
  {
    id: "defillama-yield",
    name: "DefiLlama Yield & TVL",
    provider: "DefiLlama",
    category: "crypto",
    description: "Crosschain TVL tracking, protocol yield APYs, stablecoin market caps, and risk metrics.",
    priceUsdc: 0.015,
    type: "1P",
    serviceUrl: "https://defillama.com/x402",
    icon: Database,
    examplePrompt: "Get highest yielding USDC pools with APY > 5% on EVM chains",
  },
  {
    id: "birdeye-data",
    name: "Birdeye Trader Analytics",
    provider: "Birdeye Data Hub",
    category: "crypto",
    description: "Token holder distribution, smart money wallet tracking, and DEX transaction feeds.",
    priceUsdc: 0.03,
    type: "3P",
    serviceUrl: "https://birdeye.so/x402",
    icon: BarChart3,
    examplePrompt: "Check wallet concentration and smart money buying flow for EURC",
  },
  {
    id: "dune-api",
    name: "Dune Analytics Query Runner",
    provider: "Dune Analytics",
    category: "crypto",
    description: "Execute custom SQL analytics queries against raw blockchain data tables.",
    priceUsdc: 0.05,
    type: "1P",
    serviceUrl: "https://dune.com/x402",
    icon: Database,
    examplePrompt: "Execute query for daily CCTP bridge transfers to Arc Testnet",
  },

  // Communications (Voice, SMS, Email)
  {
    id: "bland-ai-voice",
    name: "Bland AI Voice Calling",
    provider: "Bland.ai",
    category: "communication",
    description: "Automated AI phone calling agent to brief users, deliver notifications, or handle voice confirmations.",
    priceUsdc: 0.55,
    type: "3P",
    serviceUrl: "https://bland.ai/x402",
    icon: Phone,
    examplePrompt: "Send a voice call summary notification to my verified phone number",
  },
  {
    id: "twilio-sms",
    name: "Twilio SMS Gateway",
    provider: "Twilio",
    category: "communication",
    description: "Global SMS text messaging dispatch with delivery status callbacks.",
    priceUsdc: 0.08,
    type: "1P",
    serviceUrl: "https://twilio.com/x402",
    icon: Phone,
    examplePrompt: "Send an SMS notification with my agent wallet balance alert",
  },
  {
    id: "resend-email",
    name: "Resend Email Dispatch",
    provider: "Resend",
    category: "communication",
    description: "Modern developer email API for transactional emails, reports, and alerts.",
    priceUsdc: 0.02,
    type: "1P",
    serviceUrl: "https://resend.com/x402",
    icon: Mail,
    examplePrompt: "Send a daily yield digest email to user@example.com",
  },
  {
    id: "elevenlabs-voice",
    name: "ElevenLabs Voice Synthesis",
    provider: "ElevenLabs",
    category: "communication",
    description: "Ultra-realistic AI text-to-speech audio generation in 29 languages.",
    priceUsdc: 0.05,
    type: "3P",
    serviceUrl: "https://elevenlabs.io/x402",
    icon: Phone,
    examplePrompt: "Generate audio mp3 brief for my agent portfolio strategy",
  },
  {
    id: "sendgrid-email",
    name: "SendGrid Email Relay",
    provider: "Twilio SendGrid",
    category: "communication",
    description: "Enterprise email delivery infrastructure with inbox placement guarantee.",
    priceUsdc: 0.03,
    type: "1P",
    serviceUrl: "https://sendgrid.com/x402",
    icon: Mail,
    examplePrompt: "Send transactional alert email for deposit auto-conversion",
  },
  {
    id: "telegram-bot",
    name: "Telegram Dispatcher",
    provider: "Telegram Bot Protocol",
    category: "communication",
    description: "Send instant encrypted Telegram messages, alerts, and rich media cards.",
    priceUsdc: 0.01,
    type: "3P",
    serviceUrl: "https://telegram.org/x402",
    icon: Share2,
    examplePrompt: "Broadcast agent trade execution message to Telegram channel",
  },

  // Data & B2B Enrichment
  {
    id: "stable-enrich",
    name: "StableEnrich Data",
    provider: "StableEnrich",
    category: "data",
    description: "Instant B2B company intelligence, identity verification, and executive contact metadata.",
    priceUsdc: 0.10,
    type: "3P",
    serviceUrl: "https://stableenrich.dev/x402",
    icon: FileText,
    examplePrompt: "Enrich company metadata and check verified details for circle.com",
  },
  {
    id: "clearbit-enrichment",
    name: "Clearbit Person & Company",
    provider: "Clearbit / HubSpot",
    category: "data",
    description: "Lookup company headcount, tech stack, funding rounds, and verified social profiles.",
    priceUsdc: 0.12,
    type: "1P",
    serviceUrl: "https://clearbit.com/x402",
    icon: FileText,
    examplePrompt: "Lookup domain intelligence and tech stack for circle.com",
  },
  {
    id: "hunter-email-verifier",
    name: "Hunter Email Verifier",
    provider: "Hunter.io",
    category: "data",
    description: "Verify email deliverability, MX records, and catch-all domain status.",
    priceUsdc: 0.02,
    type: "3P",
    serviceUrl: "https://hunter.io/x402",
    icon: Mail,
    examplePrompt: "Verify deliverability score for contact@blockgent.ai",
  },
  {
    id: "abstract-ip-geo",
    name: "Abstract IP Geolocation",
    provider: "Abstract API",
    category: "data",
    description: "IP address to country, city, ISP, proxy detection, and threat level risk score.",
    priceUsdc: 0.01,
    type: "3P",
    serviceUrl: "https://abstractapi.com/x402",
    icon: Globe,
    examplePrompt: "Inspect IP address security score and origin location",
  },
  {
    id: "proxycurl-linkedin",
    name: "Proxycurl Professional Graph",
    provider: "Proxycurl",
    category: "data",
    description: "Structured public company profiles, employee growth velocity, and job listings.",
    priceUsdc: 0.15,
    type: "3P",
    serviceUrl: "https://proxycurl.com/x402",
    icon: FileText,
    examplePrompt: "Get headcount growth rate and engineering openings for Circle",
  },

  // Domains & Web Infrastructure
  {
    id: "stable-domains",
    name: "StableDomains Registrar",
    provider: "StableDomains",
    category: "domains",
    description: "Check domain availability, registrar pricing, and instant web domain registration status.",
    priceUsdc: 0.30,
    type: "3P",
    serviceUrl: "https://stabledomains.dev/x402",
    icon: Globe,
    examplePrompt: "Check if blockgent-agent.eth and arcagent.io are available for registration",
  },
  {
    id: "ens-lookup",
    name: "ENS Identity Resolver",
    provider: "Ethereum Name Service",
    category: "domains",
    description: "Resolve .eth domain names to EVM addresses, avatar URIs, and text records.",
    priceUsdc: 0.01,
    type: "1P",
    serviceUrl: "https://ens.domains/x402",
    icon: Globe,
    examplePrompt: "Resolve vitalik.eth address and avatar metadata",
  },
  {
    id: "cloudflare-dns",
    name: "Cloudflare DNS & Security",
    provider: "Cloudflare",
    category: "domains",
    description: "Query DNS records (A, AAAA, MX, TXT) and Cloudflare WAF threat scores.",
    priceUsdc: 0.02,
    type: "1P",
    serviceUrl: "https://cloudflare.com/x402",
    icon: Lock,
    examplePrompt: "Lookup DNS A records and SSL status for arc.network",
  },
  {
    id: "unstoppable-domains",
    name: "Unstoppable Web3 Domains",
    provider: "Unstoppable Domains",
    category: "domains",
    description: "Resolve .crypto, .nft, .x domains and check Web3 domain availability.",
    priceUsdc: 0.05,
    type: "3P",
    serviceUrl: "https://unstoppabledomains.com/x402",
    icon: Globe,
    examplePrompt: "Check if blockgent.crypto is available for purchase",
  },

  // Social & Sentiment
  {
    id: "x-api-insights",
    name: "X Social Analytics",
    provider: "X / Twitter Protocol",
    category: "social",
    description: "Real-time social media sentiment monitoring, trending Web3 topics, and viral token mentions.",
    priceUsdc: 0.05,
    type: "1P",
    serviceUrl: "https://api.x.com/x402",
    icon: Zap,
    examplePrompt: "Fetch trending Web3 agent topics and sentiment score for #ArcChain",
  },
  {
    id: "reddit-sentiment",
    name: "Reddit Web3 Sentiment",
    provider: "Reddit API",
    category: "social",
    description: "Monitor subreddits (r/crypto, r/DeFi) for sentiment spikes and discussions.",
    priceUsdc: 0.02,
    type: "3P",
    serviceUrl: "https://reddit.com/x402",
    icon: Share2,
    examplePrompt: "Analyze r/DeFi sentiment score for USDC yield protocols",
  },
  {
    id: "farcaster-hub",
    name: "Farcaster Hub Casts",
    provider: "Farcaster Network",
    category: "social",
    description: "Query decentralized social casts, frame interactions, and user FIDs.",
    priceUsdc: 0.01,
    type: "1P",
    serviceUrl: "https://farcaster.xyz/x402",
    icon: Share2,
    examplePrompt: "Search recent Farcaster casts about AI agent micropayments",
  },
  {
    id: "youtube-data",
    name: "YouTube Video Insights",
    provider: "Google YouTube",
    category: "social",
    description: "Extract video transcripts, view counts, and comment sentiment metrics.",
    priceUsdc: 0.03,
    type: "1P",
    serviceUrl: "https://youtube.com/x402",
    icon: Share2,
    examplePrompt: "Fetch transcript and summary for latest Circle developer video",
  },

  // AI Compute & Inference
  {
    id: "openai-gpt4o",
    name: "OpenAI GPT-4o Inference",
    provider: "OpenAI",
    category: "compute",
    description: "High-speed multimodal reasoning and code generation per token call.",
    priceUsdc: 0.05,
    type: "1P",
    serviceUrl: "https://openai.com/x402",
    icon: Cpu,
    examplePrompt: "Run complex financial analysis prompt on GPT-4o model",
  },
  {
    id: "anthropic-claude",
    name: "Anthropic Claude 3.5 Sonnet",
    provider: "Anthropic",
    category: "compute",
    description: "State-of-the-art coding and long-context analysis engine.",
    priceUsdc: 0.06,
    type: "1P",
    serviceUrl: "https://anthropic.com/x402",
    icon: Cpu,
    examplePrompt: "Analyze smart contract bytecode for security vulnerabilities",
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3 Inference",
    provider: "DeepSeek AI",
    category: "compute",
    description: "Cost-effective open model reasoning for mathematical & code processing.",
    priceUsdc: 0.01,
    type: "3P",
    serviceUrl: "https://deepseek.com/x402",
    icon: Cpu,
    examplePrompt: "Run mathematical yield optimization formula on DeepSeek V3",
  },
  {
    id: "replicate-models",
    name: "Replicate Open Model Host",
    provider: "Replicate",
    category: "compute",
    description: "Run open-source image generation, Whisper audio transcription, and LLMs.",
    priceUsdc: 0.04,
    type: "3P",
    serviceUrl: "https://replicate.com/x402",
    icon: Cpu,
    examplePrompt: "Transcribe voice note audio file to text using Whisper model",
  },
];

const CATEGORIES = [
  { id: "all", label: "ALL" },
  { id: "search", label: "WEB SEARCH RESEARCH" },
  { id: "crypto", label: "FINANCIAL ANALYSIS" },
  { id: "prediction", label: "PREDICTION MARKETS" },
  { id: "social", label: "SOCIAL INTELLIGENCE" },
  { id: "infrastructure", label: "INFRASTRUCTURE" },
  { id: "creative", label: "CREATIVE" },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { agents } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [services, setServices] = useState<ServiceItem[]>(MARKETPLACE_SERVICES);
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ServiceItem | null>(null);
  const [noAgentModalOpen, setNoAgentModalOpen] = useState(false);
  const [selectedServiceForEndpoints, setSelectedServiceForEndpoints] = useState<ServiceItem | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch dynamic live services from backend / Circle marketplace registry
  React.useEffect(() => {
    const getServiceIcon = (cat: string) => {
      switch (cat) {
        case 'crypto': return BarChart3;
        case 'communication': return Phone;
        case 'domains': return Globe;
        case 'social': return Share2;
        case 'compute': return Cpu;
        case 'data': return FileText;
        default: return Search;
      }
    };

    const fetchLiveServices = async () => {
      try {
        const res = await fetch(`${getBackendUrl()}/marketplace/services`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: ServiceItem[] = data.map((s: any, idx: number) => ({
              id: s.id || `live-${idx}`,
              name: s.name || 'Agent Service',
              provider: s.provider || 'Circle Registry',
              category: (s.category as any) || 'search',
              description: s.description || 'x402-enabled pay-per-call API service',
              priceUsdc: s.priceUsdc || 0.02,
              type: s.type || (idx % 2 === 0 ? '1P' : '3P'),
              serviceUrl: s.url || 'https://agents.circle.com/x402',
              icon: getServiceIcon(s.category),
              examplePrompt: s.examplePrompt || `Run task using ${s.name}`,
            }));
            setServices(mapped);
          }
        }
      } catch {
        // Maintain fallback catalog
      }
    };
    fetchLiveServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesCategory =
      selectedCategory === "all" ||
      service.category === selectedCategory ||
      (selectedCategory === "creative" && service.category === "compute") ||
      (selectedCategory === "infrastructure" && (service.category === "domains" || service.category === "data")) ||
      (selectedCategory === "prediction" && service.category === "crypto");
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRunWithAgent = (service: ServiceItem) => {
    if (!agents || agents.length === 0) {
      setSelectedServiceForModal(service);
      setNoAgentModalOpen(true);
      return;
    }

    if (agents.length === 1) {
      localStorage.setItem("blockgent_pending_prompt", service.examplePrompt);
      router.push(`/agents/${agents[0].id}`);
      return;
    }

    // Multiple agents exist — open modal so user can pick target agent
    setSelectedServiceForModal(service);
  };

  const handleSelectAgentAndRun = (agentId: string) => {
    if (selectedServiceForModal) {
      localStorage.setItem("blockgent_pending_prompt", selectedServiceForModal.examplePrompt);
      router.push(`/agents/${agentId}`);
    }
    setSelectedServiceForModal(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-5 sm:gap-8 pb-16 px-1 sm:px-0 min-w-0">
      {/* Hero Banner */}
      <div className="glass-panel p-5 sm:p-8 relative overflow-hidden bg-gradient-to-r from-[#11131F] via-[#0D101C] to-[#15192C] border-[#22252F] flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6 rounded-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-2xl z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-cyan text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider">
              Circle Agent Marketplace
            </span>
            <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-400 font-mono font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              40 SERVICES &middot; 636 ENDPOINTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Discover what your agent can do.
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Browse the curated catalog of x402-enabled APIs accepting micro-payments directly from your agent's USDC vault.
            No API keys or checkout pages — your agent pays per call on-chain.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 z-10 w-full md:w-auto md:flex sm:flex-row">
          <div className="glass-panel p-3.5 sm:p-4 flex flex-col gap-1 border-[#292D3D] bg-[#090A0F]/80 min-w-0 sm:min-w-[140px] rounded-xl">
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Catalog Volume</span>
            <span className="text-base sm:text-lg font-bold text-white font-mono">40 Services</span>
          </div>
          <div className="glass-panel p-3.5 sm:p-4 flex flex-col gap-1 border-[#292D3D] bg-[#090A0F]/80 min-w-0 sm:min-w-[140px] rounded-xl">
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Active Endpoints</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">636 Endpoints</span>
          </div>
        </div>
      </div>

      {/* Controls: Search & Category Filter */}
      <div className="flex flex-col md:flex-row gap-3.5 sm:gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all 40 services, providers..."
            className="w-full bg-[#11131F] border border-[#22252F] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-neon-blue/50 transition-colors h-11 sm:h-10"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-4 text-xs font-mono text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">1P</span>
            <span className="text-[11px] sm:text-xs">Direct Provider</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded border border-neon-blue/40 bg-neon-blue/10 text-neon-cyan text-[10px] font-bold">3P</span>
            <span className="text-[11px] sm:text-xs">Third-Party Protocol</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none touch-pan-x w-full min-w-0">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer min-h-[38px] flex items-center justify-center shrink-0 active:scale-[0.98] ${
                isActive
                  ? "bg-neon-blue text-slate-950 shadow-lg shadow-neon-blue/20"
                  : "bg-[#11131F] border border-[#22252F] text-slate-400 hover:text-white hover:border-[#333748]"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredServices.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className="glass-panel p-5 sm:p-6 border-[#22252F] bg-[#11131F]/90 hover:border-neon-blue/40 transition-all duration-300 flex flex-col justify-between gap-4 sm:gap-5 group relative overflow-hidden rounded-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-colors pointer-events-none" />

              <div className="flex flex-col gap-3.5 sm:gap-4 z-10">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-cyan shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white text-sm sm:text-base group-hover:text-neon-cyan transition-colors truncate">
                        {service.name}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-400 truncate">{service.provider}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${
                      service.type === "1P"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-neon-blue/30 bg-neon-blue/10 text-neon-cyan"
                    }`}
                  >
                    {service.type}
                  </span>
                </div>

                <p className="text-slate-300 text-xs leading-relaxed font-sans line-clamp-3">
                  {service.description}
                </p>

                <div className="p-3 rounded-xl bg-[#090A0F] border border-[#22252F] flex flex-col gap-1.5">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
                    Example Prompt
                  </span>
                  <p className="text-xs text-slate-200 font-mono line-clamp-2">
                    "{service.examplePrompt}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3.5 border-t border-[#22252F] z-10 gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-mono">Cost Per Call</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono truncate">
                      {(Number(service.priceUsdc) || 0).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setSelectedServiceForEndpoints(service)}
                    className="px-2.5 py-1.5 min-h-[34px] rounded-xl border border-[#22252F] bg-[#15161C] hover:bg-[#22252F] hover:border-neon-cyan/50 text-slate-300 text-[11px] font-bold transition-all duration-200 cursor-pointer active:scale-[0.98]"
                  >
                    Endpoints
                  </button>
                  <button
                    onClick={() => handleRunWithAgent(service)}
                    className="px-3 py-1.5 min-h-[34px] rounded-xl bg-neon-blue text-slate-950 text-[11px] font-bold transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-md shadow-neon-blue/10"
                  >
                    <span>Run</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="glass-panel p-8 sm:p-12 text-center flex flex-col items-center gap-3 border-[#22252F] bg-[#11131F] rounded-2xl">
          <Bot className="w-10 h-10 text-slate-500" />
          <h3 className="text-base sm:text-lg font-bold text-white">No services found</h3>
          <p className="text-slate-400 text-xs max-w-sm">
            Try searching with broader terms like "search", "crypto", "data", or select "All Services".
          </p>
        </div>
      )}

      {/* Select Target Agent Modal (when multiple agents exist) */}
      {selectedServiceForModal && !noAgentModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-md w-full p-5 sm:p-6 border-[#22252F] bg-[#11131F] rounded-2xl flex flex-col gap-4 sm:gap-5 shadow-2xl relative max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-[#22252F] pb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-cyan shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider truncate">Select Target Agent</h3>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {selectedServiceForModal.name} (${(Number(selectedServiceForModal.priceUsdc) || 0).toFixed(2)} USDC)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#22252F] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Choose which agent's Circle vault will execute this service call and pay <strong>{(Number(selectedServiceForModal.priceUsdc) || 0).toFixed(2)} USDC</strong> on Arc Testnet.
            </p>

            <div className="flex flex-col gap-2.5 max-h-[50vh] sm:max-h-72 overflow-y-auto pr-1">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleSelectAgentAndRun(agent.id)}
                  className="p-3 sm:p-3.5 rounded-xl bg-[#090A0F]/70 border border-[#22252F] hover:border-neon-cyan/50 flex items-center justify-between cursor-pointer transition-all group min-h-[52px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan group-hover:scale-105 transition-transform shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-neon-cyan transition-colors truncate">
                        {agent.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 truncate">
                        {agent.wallet ? `${agent.wallet.substring(0, 6)}...${agent.wallet.substring(agent.wallet.length - 4)}` : agent.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="flex flex-col text-right font-mono">
                      <span className="text-xs font-bold text-neon-blue">{agent.balance} {agent.token}</span>
                      <span className="text-[9px] text-slate-500">Vault</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-neon-cyan group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-[#22252F] flex justify-between items-center">
              <button
                onClick={() => {
                  setSelectedServiceForModal(null);
                  router.push("/agents");
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-neon-blue" />
                Create New Agent
              </button>

              <button
                onClick={() => setSelectedServiceForModal(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* No Agent Found Modal (when user has 0 agents) */}
      {noAgentModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-sm w-full p-5 sm:p-6 border-[#22252F] bg-[#11131F] rounded-2xl flex flex-col gap-4 text-center items-center shadow-2xl relative">
            <button
              onClick={() => setNoAgentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#22252F] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue mt-2">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">No Agent Vault Found</h3>
              <p className="text-xs text-slate-400">
                You need an active Circle AI agent vault to execute x402 marketplace services on Arc Testnet.
              </p>
            </div>

            <div className="flex flex-col w-full gap-2 mt-2">
              <button
                onClick={() => {
                  setNoAgentModalOpen(false);
                  router.push("/agents");
                }}
                className="w-full h-10 rounded-xl bg-neon-cyan hover:bg-neon-blue text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-neon-cyan/10 min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                Create Your First Agent
              </button>
              <button
                onClick={() => setNoAgentModalOpen(false)}
                className="w-full h-9 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[38px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Endpoints & API Documentation Modal */}
      {selectedServiceForEndpoints && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="glass-panel max-w-2xl w-full p-5 sm:p-6 border-[#22252F] bg-[#11131F] rounded-2xl flex flex-col gap-4 sm:gap-5 shadow-2xl relative max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#22252F] pb-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-neon-cyan shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {selectedServiceForEndpoints.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    API Endpoints & Price Registry
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForEndpoints(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#22252F] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              <div className="p-3 rounded-xl bg-[#090A0F]/60 border border-[#22252F]">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 font-bold block mb-1">
                  Base URL (X402 API Gateway)
                </span>
                <div className="flex items-center justify-between gap-3 bg-[#050608] px-3 py-2 rounded-lg border border-[#22252F] font-mono text-xs">
                  <span className="text-neon-cyan truncate">{selectedServiceForEndpoints.serviceUrl}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedServiceForEndpoints.serviceUrl);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all p-1"
                    title="Copy Base URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Available Sub-Endpoints
                </h4>
                
                <div className="flex flex-col gap-3">
                  {getServiceEndpoints(selectedServiceForEndpoints).map((ep, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#090A0F] border border-[#22252F] flex flex-col gap-3"
                    >
                      {/* Endpoint Signature & Price */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#22252F] pb-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ep.method === "POST"
                                ? "bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan"
                                : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-white font-semibold">{ep.path}</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-400 font-mono">
                          {(Number(ep.priceUsdc) || 0).toFixed(3)} USDC
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-slate-400 text-xs leading-relaxed">
                        {ep.description}
                      </p>

                      {/* Payload Example */}
                      {ep.examplePayload && (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                            <span>Request Payload JSON</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ep.examplePayload!);
                              }}
                              className="text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all p-1 flex items-center gap-1"
                              title="Copy Payload JSON"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="bg-[#050608] p-3 rounded-lg border border-[#22252F] font-mono text-[10px] text-slate-300 overflow-x-auto max-h-36 scrollbar-none">
                            {ep.examplePayload}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#22252F] flex justify-end shrink-0">
              <button
                onClick={() => setSelectedServiceForEndpoints(null)}
                className="px-4 py-2 rounded-xl bg-[#15161C] hover:bg-[#22252F] border border-[#22252F] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Close Documentation
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
