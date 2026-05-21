
```markdown
# ArcWallet AI - Personal Wallet Agent

**Version:** 1.0 (MVP)  
**Last Updated:** May 21, 2026  
**Platform:** Arc + Circle Agent Stack

## Overview

ArcWallet AI is a persistent, intelligent Personal Wallet Agent that allows users to chat naturally with their wallet, the Arc blockchain, and execute guarded actions.

The agent is built on top of the **Circle Agent Wallet** infrastructure and powered by a modular **Skill System** using LLM tool calling.

---

## Agent Architecture

- **Core LLM**: Claude 3.5/4 or Grok (with strong tool calling)
- **Memory**: Conversation history + persistent user wallet context + agent state
- **Tools**: Function calling (structured JSON input/output)
- **Execution Layer**: Circle Agent Wallet + Arc RPC
- **Safety Layer**: Risk Guardian + user confirmation for all actions above defined thresholds
- **Frontend Integration**: Returns both rich text and structured data for dashboards/charts

---

## Core Skills (10)

| # | Skill Name                        | Description                                      | Status   |
|---|-----------------------------------|--------------------------------------------------|----------|
| 1 | **Wallet Intelligence**           | Deep wallet analysis and insights                | Core     |
| 2 | **Visual Analytics Engine**       | Dashboard-style visual insights & chart data     | Core     |
| 3 | **Rules & Automation Engine**     | Natural language rules creation & management     | Core     |
| 4 | **Transaction & Execution**       | Safe onchain actions (swaps, transfers, bridges) | Core     |
| 5 | **Monitoring & Alert System**     | Real-time and scheduled alerts                   | Core     |
| 6 | **Portfolio & DeFi Manager**      | Portfolio tracking, yield, rebalancing           | High     |
| 7 | **Blockchain Explorer & Research**| General Arc blockchain intelligence              | Medium   |
| 8 | **Agent Self-Management**         | Manage agent wallet, logs, and settings          | Medium   |
| 9 | **Reporting & Summary**           | Automated and on-demand reports                  | Medium   |
|10 | **Risk & Security Guardian**      | Risk assessment and security enforcement         | Core     |

---

### Detailed Skill Breakdown

### 1. Wallet Intelligence
- Retrieve real-time balance and token holdings
- Transaction history analysis
- Behavioral profiling
- Wallet comparison

### 2. Visual Analytics Engine
- Volume trends (7d/30d/90d/All-time)
- DEX distribution
- Bridge usage
- Portfolio value over time
- Top transactions
- Activity heatmap insights

### 3. Rules & Automation Engine
- Create rules using natural language
- Conditional logic (if → then)
- Rule simulation, activation, and management

### 4. Transaction & Execution
- Prepare and execute swaps, transfers, bridges
- Always use `prepare_transaction` → user confirmation → `execute`
- Batch support

### 5. Monitoring & Alert System
- Balance thresholds
- Large transaction detection
- Price/volume movement
- Custom conditions

### 6. Portfolio & DeFi Manager
- Portfolio valuation
- Yield opportunity discovery
- Rebalancing suggestions
- Position monitoring

### 7. Blockchain Explorer & Research
- Token information
- Contract analysis
- Recent blocks and activity
- Whale/smart money tracking

### 8. Agent Self-Management
- Check agent wallet status
- Top-up agent wallet
- View activity logs
- Pause/resume agent

### 9. Reporting & Summary
- Daily, weekly, monthly reports
- Custom date range reports
- Performance summaries

### 10. Risk & Security Guardian
- Transaction risk scoring
- Contract verification
- Spending limit enforcement
- Anomaly detection

---

## System Prompt (Base)

```text
You are ArcWallet AI, a premium, helpful, and safety-first Personal Wallet Agent for the user on the Arc blockchain.

You have access to the user's connected wallets and a dedicated Circle Agent Wallet.
Always be concise, professional, and proactive.
Use tools to fetch fresh onchain data before answering.
Never execute high-value transactions without explicit user confirmation.
Prioritize clarity and user control.
```

---

## Safety & Guardrails

- All transactions above $50 require explicit confirmation
- High-risk actions (large swaps, unknown contracts) require extra confirmation
- Risk Guardian runs on every transaction
- User can set global spending limits
- All actions are logged with full audit trail

---

## Example Interactions

**User**: Show me my dashboard this month.  
**Agent**: Fetches analytics → returns summary + chart descriptions.

**User**: Alert me when my balance goes below 1000 USDC.  
**Agent**: Creates and confirms the rule.

**User**: Swap 150 USDC to ARC.  
**Agent**: Gets quote → shows risk + details → asks for confirmation.

---

## Implementation Notes

- Use structured tool calling
- Return both `message` (for chat) and `structured_data` (for UI components)
- Maintain long-term memory of user preferences and main wallet
- All tools must return clean JSON + human-readable text

---

## Future Skills (Phase 2+)

- Cross-chain Intelligence
- Agent Marketplace
- Social & Reputation Analysis
- Tax Reporting
- Advanced Yield Automation

---
