# BlockGENT — Business Model & Revenue Strategy

> **Tagline:** *"Chat with your wallet. Command the chain. Own your AI agent."*

---

## The Core Value Exchange

BlockGENT sits at the intersection of **AI automation** and **stablecoin-native finance**. Users delegate capital and intent to their Circle Agent Wallet — and *that delegation is where revenue is generated*.

Every time the agent acts autonomously (rebalances, alerts, pays for data, executes a transaction), it's delivering value the user couldn't get without the platform. That's the billing surface.

---

## Revenue Streams

### 1. 🔐 Agent Subscription Tiers *(Primary Revenue)*

The clearest SaaS motion — users pay a monthly USDC fee to maintain active Personal Agents.

| Tier | Price/mo | Agents | Rules | LLM Calls | Nanopay budget |
|---|---|---|---|---|---|
| **Free** | $0 | 1 | 3 | 50 | None |
| **Pro** | $15 USDC | 3 | Unlimited | 500 | $5 USDC/mo included |
| **Power** | $49 USDC | 10 | Unlimited | Unlimited | $25 USDC/mo included |
| **Enterprise** | Custom | Unlimited | Custom | Unlimited + SLA | Custom |

**Why USDC billing matters:** Subscription fees collected in USDC on Arc have near-zero processing costs (no Stripe fees, no chargebacks, instant settlement). A $15 USDC subscription = ~$15 gross margin before infra costs.

**Projected unit economics (Pro tier):**
- LLM API cost per active user: ~$2–4/mo
- Infrastructure per user: ~$1/mo
- Net margin per Pro user: **~$10–12/mo (~70–80%)**

---

### 2. ⚡ Nanopayment Fee Layer *(Recurring, usage-based)*

Every `nanopay_call` the agent makes to a Circle x402 endpoint costs USDC. A **platform fee** is embedded on top of the service's base price via the agent wallet relay.

| Example | Base cost | Platform fee (10%) | User pays |
|---|---|---|---|
| Crypto price lookup | $0.001 | $0.0001 | $0.0011 |
| Web search call | $0.005 | $0.0005 | $0.0055 |
| News API call | $0.01 | $0.001 | $0.011 |

At scale: 1,000 Pro users × 50 calls/mo × avg $0.003 fee = **$150/mo initially**, growing with usage.

---

### 3. 📈 DeFi Yield Commission *(High value, low friction)*

The `find_yield_opportunities` tool surfaces ArcLend and partner protocol pools. Revenue is earned via **referral/origination fees** when users deposit via the agent.

| Scenario | Deposit | Yield APY | Our fee (10% of yield) | Annual revenue per user |
|---|---|---|---|---|
| Conservative | $1,000 USDC | 5% | $5 | $5/yr |
| Mid | $10,000 USDC | 5% | $50 | $50/yr |
| Whale | $100,000 USDC | 5% | $500 | $500/yr |

> This scales with user **AUM**, not user count. One power user depositing $100k is worth 100 free users.

---

### 4. 🏢 Enterprise API & White-Label *(B2B revenue)*

The entire backend — Circle wallet management, LLM tools, portfolio analytics, spending policies — is a deployable API productizable as:

- **API access** for crypto dApps wanting an AI layer: $499–$2,999/mo
- **White-label deployments** for fintechs wanting branded agent wallet UX: $5k–50k integration fee + monthly rev share
- **SDK licensing** for Circle ecosystem builders embedding the LLM toolchain

---

### 5. 📊 Wallet Intelligence Data *(Emerging, high-margin)*

Anonymized on-chain behaviour data (aggregate DeFi flows, protocol usage trends, activity patterns) becomes a sellable intelligence product over time:

- **Institutional reports**: Monthly Arc chain intelligence for funds — $500–5,000/report
- **Custom analytics API**: Aggregated signal feeds for traders and hedge funds
- **Trend alerts**: Premium push alerts on whale movements and protocol anomalies

> **Privacy-first model:** Opt-in only. Users share anonymized aggregate data in exchange for a 20% subscription discount. Fully revocable. Nothing identifiable is collected.

---

## Revenue Mix Targets (12 months post-launch)

| Stream | Year 1 Target | % of Revenue |
|---|---|---|
| Subscriptions (Pro + Power) | $180k | 55% |
| Nanopayment fees | $36k | 11% |
| DeFi yield commissions | $60k | 18% |
| Enterprise / API | $45k | 14% |
| Data products | $12k | 4% |
| **Total** | **~$333k ARR** | |

---

## Strategic Decisions & Recommendations

### 1. Billing Chain → Arc primary, Base as fallback ✅

Collecting subscriptions on Arc is a product statement: if we don't trust Arc enough to bill on it, why would users trust it with their agent wallets? Arc's 0.5s finality and USDC-native gas means a $15 subscription costs fractions of a cent in gas — zero friction.

**Implementation:** Accept Arc by default. Accept Base as a fallback for users who haven't bridged yet. The existing bridge integration handles USDC movement between chains.

---

### 2. Free Tier → Permanently free with a hard feature wall ✅

Time-limited trials punish users who need time to build trust — especially in crypto. A permanent free tier with hard capability limits (1 agent, 3 rules, 50 LLM calls) creates the right organic growth engine:

- Users experience agent value before seeing a paywall
- The first successful alert or rebalance is the natural upsell moment
- Crypto communities share tools aggressively when they work — free tiers fuel word of mouth

**The wall:** When a user hits their 3rd rule and tries to create a 4th, they get the upgrade prompt contextually — not a 30-day countdown.

---

### 3. Nanopayment Markup → Absorb into subscription tiers for MVP, build relay wallet in V2 ✅

A fee relay wallet adds real complexity (per-user relay accounts, routing logic, reconciliation) before you have any usage data. Without knowing whether the average Pro user makes 5 or 500 nanopay calls/month, you risk pricing wrong.

**V1 (MVP):** Include a fixed nanopay budget per tier ($5 for Pro, $25 for Power). Overages trigger an upgrade prompt. Simple, zero new infrastructure.

**V2 (post-traction):** Once 3–6 months of usage data is collected, build the relay wallet with a % markup calibrated to real usage distributions.

---

### 4. DeFi Partnership → Build the demo first, then pitch ✅

Approaching ArcLend or Circle with a proposal gets a *maybe*. Approaching them with a live integration that already routes to their pool and shows real yield data gets a *deal*.

`find_yield_opportunities` already surfaces ArcLend pools. The next step is fetching live APYs from their API and adding a deposit flow — a few hours of work — then the pitch becomes:

> *"We already have 500 users seeing your pool every week. Here's what a referral agreement looks like."*

**Tactical:** Apply for the Circle Developer Program immediately. It provides BD contacts and co-marketing opportunities that solo outreach doesn't.

---

### 5. Data Consent → Opt-in with economic incentive, ship in Year 2 ✅

Crypto users are the most privacy-conscious segment on the internet. Any passive data monetization generates trust damage and Twitter backlash.

**The right model:** Explicit opt-in, framed as *"earn by sharing"* — not *"we sell your data."*

- User toggles on "Share anonymized aggregate portfolio signals"
- They receive 20% off their Pro subscription ($3 USDC/mo saved)
- What's actually shared: aggregate stats like "X% of users moved to USDC this week" — nothing identifiable
- Fully revocable at any time from settings

**Don't build this for MVP.** It needs a data pipeline, privacy review, and an institutional buyer. Design the consent model architecture now, ship it as a Year 2 revenue unlock.

---

## Go-To-Market Phases

### Phase 1 — Hackathon → Community (Now)
- Win Circle/Arc hackathon → credibility, prizes, ecosystem visibility
- Open-source the LLM tool layer → developer adoption and trust
- Free tier is the product demo — target 500 signups before charging

### Phase 2 — Freemium Conversion (Month 2–4)
- Free users hit rule/agent limits → contextual upgrade prompt at the moment of value
- Email: *"Your agent triggered 3 alerts this week — upgrade to add 10 more rules"*
- Target: 5% free → Pro conversion = 25 paying users per 500 signups

### Phase 3 — DeFi Protocol Partnerships (Month 3–6)
- Build live ArcLend APY integration → use as partnership demo
- Negotiate referral agreements with Arc-native DeFi protocols
- They get TVL; we get yield commissions

### Phase 4 — Enterprise Outreach (Month 6+)
- Target crypto-native fintechs, neobanks, DAOs needing an AI treasury agent
- Package the NestJS backend as a deployable enterprise module

---

## Defensibility / Moat

| Moat | How BlockGENT builds it |
|---|---|
| **Network data** | More users → richer analytics → better agent recommendations → more users |
| **Circle ecosystem lock-in** | Deep integration with Circle CLI, Agent Wallets, x402 — switching requires rebuilding from scratch |
| **Agent persistence** | Rules, logs, wallets, and history accumulate over time — a user's personalized brain, not portable |
| **LLM tool surface** | 9 integrated tools (alerts, yield, bridge, contract analysis, nanopay) far exceed a simple chatbot |
| **USDC-native billing** | Zero-friction on-chain billing — no payment processing risk, no chargebacks |

---

*Last updated: July 2026*
