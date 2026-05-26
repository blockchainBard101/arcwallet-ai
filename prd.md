# ArcWallet AI PRD

**Product Name:** ArcWallet AI

**Version:** 1.0 MVP (Production-Ready / Architecture Revised)

**Date:** May 2026

**Status:** Approved for Development

---

### 1. Product Vision

ArcWallet AI is a **premium, intuitive AI Agent Platform** native to **Arc** (Circle’s stablecoin-native L1 blockchain) and the **Circle Agent Stack**. It empowers users to interact naturally with wallets and the blockchain, create persistent Personal Wallet Agents powered by dedicated Circle Agent Wallets, and access rich visual analytics.

**Tagline:** *“Chat with your wallet. Command the chain. Own your AI agent.”*

It bridges human intent with on-chain execution via natural language, while delivering institutional-grade analytics and autonomous agent capabilities on Arc’s high-performance infrastructure (0.5s deterministic finality, USDC-native gas, low predictable fees).

---

### 2. Objectives & Goals (MVP)

* Deliver a polished, production-ready web app MVP in 8-12 weeks.
* Achieve high user engagement through a seamless chat + visual dashboard experience.
* Leverage a dual-wallet architecture (Client-Side + Server-Side) for frictionless human identity and robust autonomous execution.
* Establish as the go-to interface for personal AI wallet agents on Arc.
* **Key Success Metrics:**
* 1,000+ active users in the first month post-launch.
* Greater than 70% retention for Personal Agent creators.
* High NPS (greater than 60) on UX.
* Average 5+ chats/sessions per active user.



---

### 3. Target Audience & User Personas

* **Crypto Power Users / Degens**: Active traders wanting analytics + natural language queries.
* **AI Enthusiasts / Builders**: Want persistent agents for automation (alerts, summaries, conditional actions).
* **Retail/Onboarding Users**: New to Arc, seeking intuitive entry via chat.
* **Primary Persona:** Alex, 28, crypto trader & AI hobbyist on Arc. Manages multiple wallets, wants quick insights without manual explorers, and desires an always-on agent for monitoring and simple executions.

---

### 4. Core Features (MVP Scope)

#### 4.1 Public Intelligence Layer (No wallet connect required initially)

* **Wallet Analysis Chat**: Enter any public wallet address $\rightarrow$ natural language Q&A (e.g., “What’s this wallet’s top swaps last 30d?”, “Risk profile?”).
* **Blockchain Explorer Q&A**: General Arc queries (“Recent high-volume bridges?”, “USDC flows today?”).
* Powered by LLM + on-chain indexing (Arc RPC, custom subgraphs, Circle APIs).

#### 4.2 Visual Analytics Dashboard (Key Differentiator)

Toggle between **Chat Mode** and **Dashboard Mode** for any wallet (public or connected).

**Dashboard Components** (interactive, responsive, dark/light mode):

* **Key Metric Cards**: Total Volume, Tx Count, Unique DEXes, Avg Swap Size, Unique Bridges, Portfolio Value (est.), Activity Score.
* **Volume Trend Line Chart**: 7d / 30d / 90d / All-time (zoomable, tooltip details).
* **DEX Distribution**: Pie/Donut chart.
* **Bridge Usage Breakdown**: Bar or pie.
* **Portfolio Value Over Time**: Area/line chart.
* **Top Transactions/Swaps Table**: Sortable, filterable (with links to explorer).
* **Activity Heatmap or Timeline**: Daily/weekly activity.

#### 4.3 Personal Agent Platform

* **Dual-Wallet Architecture (The Execution Engine)**:
* **Human Signer Wallet (Privy Embedded Wallet)**: Alexanders logs in instantly using **Login with Google**. Privy provisions a client-side non-custodial EVM wallet. This wallet is used to hold user capital, approve rule configurations, and execute manual transactions.
* **Autonomous Execution Wallet (Circle Agent Wallet)**: With one click, the backend provisions a dedicated, server-controlled wallet via the **Circle Agent Stack**. This wallet holds delegated automated funds and executes tasks 24/7 without requiring the user to be online.


* **Agent Capabilities** (Natural language rule engine):
* **Alerts & Notifications**: (e.g., “Alert me on greater than $1k swaps or balance less than 50 USDC”).
* **Summaries**: Daily/weekly activity reports via email/push/in-app.
* **Conditional Actions**: (e.g., “Auto-swap token X to Y if price greater than Z” or “Rebalance portfolio weekly”).
* **Nanopayments Protocol**: Leverages Circle’s native Nanopayments infrastructure to process gas-free machine-to-machine transactions down to $0.000001 for high-frequency agent actions or automated data-fetching rows.


* **Agent Management UI**:
* Dashboard for active agents (status, balance, last activity).
* Rule creation/editing UI (natural language + visual builder for complex rules).
* Activity logs & audit trail.



---

### 5. UI/UX Requirements

* **Modern, clean, futuristic dark theme** (Arc/Circle branding: blues, greens, sharp accents).
* **Sidebar Navigation**: Home (Public Chat), My Agents, Dashboard Explorer, Settings.
* **Seamless Mode Switching**: Prominent toggle (Chat $\leftrightarrow$ Dashboard) with persistent context (selected wallet/agent).
* **Onboarding Flow**:

1. **Google OAuth Authentication:** Frictionless Start.
User clicks "Login with Google". Privy handles the OAuth flow and spins up an embedded non-custodial EVM wallet behind the scenes.


2. **Public Wallet Demo Exploration:** Instant Value Hook.
User is brought directly into the Public Intelligence Layer to see instant visual analytics charts using a test wallet.


3. **Agent Initialization Wizard:** Agent Deployment.
User enters an automation goal. System triggers Circle Agent Stack APIs to deploy a secure, server-side Circle Agent Wallet bound by explicit spending limits.


---

### 6. Technical Stack & Non-Functional Requirements

* **Performance**: Less than 2s page loads, real-time updates, charts render in less than 1s.
* **Security & Compliance**: Standard EVM WalletConnect integrations; no human private keys stored on servers (Privy embedded). Server-side wallets protected using Circle's programmable permission policies, strict spending limits, and cryptographic guardrails.
* **Architecture Stack Blueprint**:
* **Frontend**: Next.js 15 (App Router), Tailwind CSS, shadcn/ui, Recharts/Tremor for visualizations.
* **Authentication**: **Privy SDK** (Handling client-side identity, Login with Google, and human wallet generation).
* **Agent Framework**: **Circle Agent Stack SDK** (Handling programmatic Circle CLI infrastructure, Agent Wallets, and Nanopayments orchestration via backend LLM tools).
* **Blockchain Execution**: Web3Auth / `viem` configured for **Arc Testnet (Chain ID: 5042002)** using Reth execution endpoints.
* **AI/LLM Layer**: Claude 3.5 Sonnet or GPT-4o via API utilizing structured tools for parsing on-chain intent.
* **Database & Indexing**: Supabase (PostgreSQL) for user account/rule storage; custom subgraphs or indexers tracking Arc blockchain states.



---

### 7. Out of Scope for MVP

* Multi-agent cross-chain orchestration (focus strictly on Arc L1).
* Full execution autonomy beyond user-defined cryptographic guardrails.
* Desktop or native mobile apps (MVP is responsive PWA web-first).

---

### 8. Risks & Mitigations

* **AI Hallucinations**: Mitigation $\rightarrow$ Strict grounding using retrieved data from Arc RPC endpoints. All agent actions exceeding a 100 USDC threshold require an explicit frontend signature from the user's Privy wallet.
* **Unpredictable Infrastructure Costs**: Mitigation $\rightarrow$ Native use of Arc’s stablecoin-denominated gas structure ensures fixed, predictable micro-transaction costs, preventing fee spikes.

---

> **Design Directive:** The user interface must seamlessly support fluid switching between Chat and Dashboard modes without losing the active session state or interrupting active background charts.
