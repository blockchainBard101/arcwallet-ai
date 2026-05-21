# ArcWallet AI - Skills Registry

**Version:** 1.0 (MVP)  
**Last Updated:** May 21, 2026  
**Platform:** Arc + Circle Agent Stack

This document defines all core skills available to the ArcWallet AI Personal Wallet Agent.

---

## Skill Overview

Each skill is implemented as a collection of **tools** (functions) that the LLM can call.  
All tools must return:
- `status`: "success" | "error"
- `data`: structured JSON
- `message`: human-readable text

---

## 1. Wallet Intelligence

**Description:** Deep analysis of any wallet (user’s or public).

**Key Tools:**
- `get_wallet_details(address, chain="arc")`  
  Returns: balance, tokens, total value, last activity
- `get_transaction_history(address, limit=50, timeframe="30d")`  
  Returns: list of transactions with categorization
- `analyze_wallet_behavior(address)`  
  Returns: trader profile, risk level, activity score, common patterns
- `compare_wallets(address1, address2)`  
  Returns: side-by-side comparison

---

## 2. Visual Analytics Engine

**Description:** Powers all dashboard visuals and rich insights.

**Key Tools:**
- `get_analytics_data(address, timeframe="30d")`  
  Returns: volume_trend, dex_distribution, bridge_usage, portfolio_history, top_transactions, activity_heatmap
- `generate_chart_description(chart_type, data)`  
  Returns: natural language description of what the chart shows
- `get_key_metrics(address)`  
  Returns: total_volume, tx_count, unique_dexes, avg_swap_size, unique_bridges, portfolio_value

---

## 3. Rules & Automation Engine

**Description:** Natural language rule creation and management.

**Key Tools:**
- `create_rule(rule_text, user_id)`  
  Returns: rule_id, parsed_rule, status
- `list_rules(user_id, status="active")`  
  Returns: array of rules
- `update_rule(rule_id, new_text)`  
  Returns: updated rule
- `delete_rule(rule_id)`
- `simulate_rule(rule_text)`  
  Returns: expected behavior and risk assessment

---

## 4. Transaction & Execution

**Description:** Safe onchain actions with guardrails.

**Key Tools:**
- `get_quote(action_type, params)`  
  Example: swap USDC → ARC
- `prepare_transaction(action_type, params)`  
  Returns: transaction preview, gas estimate, risk_score
- `execute_transaction(signed_payload)`  
  Returns: tx_hash, status
- `get_execution_status(tx_hash)`

---

## 5. Monitoring & Alert System

**Description:** Real-time and scheduled monitoring.

**Key Tools:**
- `set_alert(condition, channel)`  
  Example: "balance < 1000 USDC" or "large inflow > 5000"
- `list_active_alerts()`
- `delete_alert(alert_id)`
- `trigger_manual_monitoring(address)`
- `get_monitoring_summary()`

---

## 6. Portfolio & DeFi Manager

**Description:** Portfolio tracking and optimization.

**Key Tools:**
- `get_portfolio_summary(address)`  
  Returns: holdings, allocation, PnL, yield opportunities
- `find_yield_opportunities(address)`  
  Returns: list of opportunities with APY and risk
- `rebalance_portfolio(target_allocation, max_slippage)`  
  Returns: proposed transactions
- `get_position_details(position_id)`

---

## 7. Blockchain Explorer & Research

**Description:** General knowledge about Arc blockchain.

**Key Tools:**
- `query_blockchain(natural_query)`  
  General purpose Arc data queries
- `get_token_info(token_address_or_symbol)`
- `analyze_contract(contract_address)`  
  Returns: risk score, verified status, known issues
- `get_recent_activity(filter="high_volume")`
- `track_whale_movement(min_amount)`

---

## 8. Agent Self-Management

**Description:** Manage the agent itself.

**Key Tools:**
- `get_agent_status()`  
  Returns: agent_wallet_address, balance, health, last_active
- `top_up_agent_wallet(amount_usdc)`
- `get_activity_logs(limit=20, category)`
- `update_agent_preferences(preferences)`
- `pause_agent()` / `resume_agent()`

---

## 9. Reporting & Summary

**Description:** Generate beautiful reports.

**Key Tools:**
- `generate_report(period="7d"|"30d"|"90d"|"all", format="text"|"structured")`
- `get_daily_summary()`
- `send_report(channel="in-app"|"email"|"push")`

---

## 10. Risk & Security Guardian

**Description:** Always-on safety layer.

**Key Tools:**
- `assess_transaction_risk(tx_payload)`  
  Returns: risk_score (0-100), reasons, recommendation
- `verify_contract(contract_address)`  
  Returns: verified, known_risks, score
- `enforce_spending_limits(action)`  
  Returns: allowed or blocked + reason
- `detect_anomaly(event)`

---

## Tool Calling Guidelines

- The agent can call **multiple tools in parallel**.
- Always run **Risk & Security Guardian** before any execution tool.
- Prefer `prepare_transaction` → show user → `execute_transaction`.
- Cache frequent reads (balances, analytics) for 30-60 seconds.

---

## Response Format (Recommended)

Every agent response should include:
```json
{
  "message": "Here is your portfolio summary...",
  "structured_data": { ... },     // for charts, tables, buttons
  "tools_used": ["get_portfolio_summary", "assess_risk"],
  "confidence": 0.95
}
