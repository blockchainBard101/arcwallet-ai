---
name: Privy
description: Use when building authentication systems, embedded wallets, wallet infrastructure, transaction signing, user onboarding, or implementing wallet controls and policies. Agents should reach for this skill when working with wallet creation, user authentication, transaction management, policy enforcement, or integrating blockchain functionality into applications.
metadata:
    mintlify-proj: privy
    version: "1.0"
---

# Privy Skill Reference

## Product summary

Privy is an authentication and wallet infrastructure platform that enables developers to onboard users with embedded wallets, manage wallet infrastructure across 50+ blockchains, and securely sign transactions. It provides both client-side SDKs (React, React Native, Swift, Android, Flutter, Unity) and server-side SDKs (Node.js, Java, Go, Rust, Ruby) plus a REST API. Key entry points: `PrivyProvider` (React), `PrivyClient` (Node.js backend), REST API at `https://api.privy.io/v1/`. Agents authenticate with app ID and app secret. Primary docs: https://docs.privy.io

## When to use

Reach for this skill when:
- Building user authentication flows (email, SMS, social login, passkeys, wallet login)
- Creating or managing embedded wallets for users or servers
- Implementing wallet controls (owners, signers, policies)
- Signing transactions on Ethereum, Solana, or other blockchains
- Setting up transaction policies and approval workflows
- Integrating wallet funding (fiat onramps, bank deposits)
- Managing user accounts and linking multiple authentication methods
- Building trading apps, treasury wallets, or agent wallets
- Handling wallet actions (transfers, swaps, earn/yield)
- Setting up webhooks for transaction or user events

## Quick reference

### SDK Installation

| Platform | Command | Entry Point |
|----------|---------|-------------|
| React | `npm install @privy-io/react-auth@latest` | `PrivyProvider` + `usePrivy()` hook |
| Node.js | `npm install @privy-io/node` | `PrivyClient` class |
| React Native | `npm install @privy-io/react-native` | `PrivyProvider` + hooks |
| REST API | N/A | POST/GET to `https://api.privy.io/v1/` |

### Core Configuration

**React Setup:**
```tsx
<PrivyProvider
  appId="your-app-id"
  clientId="your-app-client-id"
  config={{
    embeddedWallets: {
      ethereum: { createOnLogin: 'users-without-wallets' }
    }
  }}
>
  {children}
</PrivyProvider>
```

**Node.js Setup:**
```ts
const privy = new PrivyClient({
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});
```

**REST API Authentication:**
- Header: `Authorization: Basic Auth` (app ID as username, app secret as password)
- Header: `privy-app-id: your-app-id`
- Optional: `privy-authorization-signature` for signed requests
- Optional: `privy-idempotency-key` for idempotent operations

### Key API Endpoints

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Create wallet | `/v1/wallets` | POST |
| Get wallet | `/v1/wallets/{wallet_id}` | GET |
| Create user | `/v1/users` | POST |
| Get user | `/v1/users/{user_id}` | GET |
| Sign transaction | `/v1/wallets/{wallet_id}/rpc` | POST |
| Create policy | `/v1/policies` | POST |
| Get policy | `/v1/policies/{policy_id}` | GET |

### Authentication Methods

Privy supports: email, SMS/WhatsApp, passkeys, Google, Apple, Twitter, Discord, GitHub, LinkedIn, Spotify, Telegram, Farcaster, wallet login (SIWE/SIWS), custom OAuth, guest accounts.

### Wallet Types

- **Embedded wallets**: Created by Privy, secured by key management system, users can export keys
- **External wallets**: User-managed (MetaMask, Phantom, etc.), linked to Privy accounts
- **Custodial wallets**: Third-party custodian operates on behalf of beneficiary
- **Global wallets**: Cross-app wallets users can launch and integrate

## Decision guidance

| Scenario | Use Privy Auth | Use Custom Auth |
|----------|---|---|
| Building consumer app with no existing auth | Privy auth (email, socials, passkeys) | N/A |
| App has existing JWT-based auth | JWT-based auth integration | Your auth provider |
| Need multiple login methods | Privy auth (supports 10+ methods) | Custom OAuth setup |
| Require MFA for transactions | Privy MFA (SMS, TOTP, passkeys) | Custom MFA implementation |

| Wallet Control | User-Owned | User + Server | App-Owned | Custodial |
|---|---|---|---|---|
| **Use case** | Self-custodial consumer wallets | Automated trading, limit orders | Treasury, agents, bots | Regulated custody |
| **Owner** | User only | User (owner) + server (signer) | Server/app | Licensed custodian |
| **Key control** | User holds keys | User + server share control | Server controls keys | Custodian controls keys |
| **Policy enforcement** | User-level policies | Signer-level policies | Server-level policies | Custodian-level policies |

| Transaction Method | Client-side | Server-side |
|---|---|---|
| **Use case** | User-initiated transactions | Automated/delegated actions |
| **Auth** | User access token | API secret + authorization signature |
| **Best for** | Transfers, swaps initiated by user | Limit orders, rebalancing, agents |

## Workflow

### 1. Set up authentication and wallets (React frontend)

1. Install `@privy-io/react-auth` and wrap app with `PrivyProvider`
2. Configure `appId`, `clientId`, and wallet creation settings in config
3. Wait for `ready` flag from `usePrivy()` before consuming state
4. Use `useLogin()` to trigger login modal or `usePrivy()` to access user state
5. Access user object with linked accounts and wallet addresses

### 2. Create a wallet (server-side)

1. Initialize `PrivyClient` with app ID and app secret
2. Call `privy.wallets().createWallet({ chain_type: 'ethereum' })`
3. Save returned wallet ID and address
4. Optionally attach policies during creation or after

### 3. Sign a transaction (server-side)

1. Prepare transaction payload (method, params)
2. Call `privy.wallets().ethereum().sendTransaction(walletId, { ... })`
3. SDK automatically signs with authorization key if configured
4. Monitor transaction status via returned hash or webhooks

### 4. Implement policies

1. Define policy rules (amount limits, recipient whitelist, time windows)
2. Create policy via `POST /v1/policies` with condition sets
3. Attach to wallet during creation or via `POST /v1/wallets/{id}/policies`
4. Policies evaluated at request time; violations rejected automatically

### 5. Set up webhooks

1. Register webhook endpoint in Privy Dashboard
2. Subscribe to events (user.created, wallet.funds_deposited, transaction.confirmed)
3. Verify webhook signatures using app secret
4. Handle events and update application state

## Common gotchas

- **Forgetting to wait for `ready`**: Always check `usePrivy().ready` before accessing user state in React. Stale state causes silent failures.
- **Exposing app secret**: Never expose app secret in client-side code. Keep it server-only. Lost secrets cannot be recovered; regenerate immediately.
- **Missing authorization signatures**: Server-side requests to protected resources require `privy-authorization-signature` header. Omitting it returns 401.
- **Policy evaluation timing**: Policies are evaluated at request time, not creation time. Changes take effect immediately on next transaction.
- **Wallet creation on login**: `createOnLogin: 'all-users'` creates wallets for every login. Use `'users-without-wallets'` to avoid duplicates.
- **Idempotency keys**: Use `privy-idempotency-key` header for wallet creation and critical operations to prevent duplicates on retries.
- **Rate limits**: REST API has rate limits. Implement exponential backoff on 429 responses. Batch operations where possible.
- **Webhook verification**: Always verify webhook signatures using your app secret. Unverified webhooks are a security risk.
- **Chain type mismatch**: Wallet chain_type (ethereum, solana) must match transaction method. Signing Solana tx on Ethereum wallet fails.
- **User key expiry**: User keys from `authenticate` endpoint are time-bound. Request fresh keys for each signing session.

## Verification checklist

Before submitting work with Privy:

- [ ] App ID and app secret are correctly configured (secret not exposed client-side)
- [ ] `PrivyProvider` wraps entire app and `ready` flag is checked before consuming state
- [ ] Wallet creation includes appropriate `chain_type` (ethereum, solana, etc.)
- [ ] Policies are attached to wallets if transaction limits are required
- [ ] Authorization signatures are included in server-side API requests
- [ ] Idempotency keys are used for wallet creation and critical operations
- [ ] Webhooks are registered and signatures are verified
- [ ] Error handling covers POLICY_VIOLATION, INSUFFICIENT_FUNDS, and request_expired
- [ ] Rate limit handling includes exponential backoff
- [ ] User authentication method is enabled in Dashboard (email, OAuth, etc.)

## Resources

- **Comprehensive navigation**: https://docs.privy.io/llms.txt
- **Key concepts and architecture**: https://docs.privy.io/basics/key-concepts
- **REST API reference**: https://docs.privy.io/api-reference/introduction
- **React SDK setup**: https://docs.privy.io/basics/react/setup
- **Node.js SDK setup**: https://docs.privy.io/basics/nodeJS/setup

---

> For additional documentation and navigation, see: https://docs.privy.io/llms.txt