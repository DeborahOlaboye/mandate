# Mandate

Mandate is a policy-bound payment platform for the Stellar network. The core
idea: a spending **mandate** is a scoped, revocable authorization — instead
of handing an agent, app, or automation your full wallet keys, you grant it
a mandate that only lets it spend within rules you define (an amount limit,
a destination allowlist, a time window, etc.), enforced on-chain rather than
by convention or client-side trust.

This matters most for autonomous/agentic use cases: an AI agent that pays
for API calls, subscriptions, or services on your behalf should never hold
unrestricted signing power over your account. Mandate's goal is to make
"grant a scoped, enforceable spending policy" as easy as a normal payment.

## Current state

The repository currently contains the foundational payment layer this will
be built on top of: a Stellar wallet and payment client (`frontend/`) that
connects to Freighter, reads an account's XLM balance, and builds/signs/
submits payments on the network. This is the base primitive — send XLM
from an authenticated wallet — that the policy/mandate layer (Soroban
smart contracts enforcing spending rules) will sit on top of.

### Implemented so far

- Connect and disconnect a Freighter wallet
- Fetch and display the connected account's XLM balance, with a Friendbot
  funding shortcut for unfunded testnet accounts
- Send an XLM payment to any address
- Client-side validation of Stellar public key format before submitting
- Transaction feedback: success/failure state, transaction hash, and a link
  to view the transaction on Stellar Expert

### Planned

- Soroban smart contract defining a "mandate": spending limit, allowed
  destinations, expiry, and revocation, enforced at the contract level
- An agent-facing SDK/API so an autonomous process can request a payment
  under an existing mandate without ever holding the owner's private key
- A dashboard for creating, inspecting, and revoking mandates
- Support for stablecoin/custom asset mandates, not just native XLM

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS — `frontend/`
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) for building/submitting transactions
- [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) for wallet connection and signing
- Soroban (Rust) — planned, for the on-chain mandate/policy contract

## Prerequisites

- Node.js 18+
- [Freighter wallet](https://freighter.app) browser extension, installed and unlocked
- Freighter set to **Test Net** (Settings → Network → Test Net)
- A funded testnet account (the app can fund it for you via Friendbot if it's empty)

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser with the
Freighter extension installed.

## Usage

1. Click **Connect Freighter Wallet** and approve the connection in the
   Freighter popup.
2. Your XLM balance loads automatically. If the account doesn't exist yet
   on testnet, click **Fund with Friendbot**.
3. Enter a destination address (starts with `G...`) and an amount, then
   click **Send XLM**.
4. Approve the transaction in Freighter. The result — success or failure,
   with the transaction hash — appears below the form.

## Repository structure

```
frontend/                          # Wallet + payment client (Next.js)
  app/page.tsx                     # Main page, wires wallet + balance + payment flow together
  lib/stellar.ts                   # Horizon client, balance fetch, transaction build/submit, Friendbot
  lib/useWallet.ts                 # Freighter connect/disconnect state hook
  components/WalletConnect.tsx     # Connect/disconnect UI
  components/BalanceCard.tsx       # Balance display + refresh
  components/SendPaymentForm.tsx   # Destination/amount input form
  components/TransactionResult.tsx # Success/failure feedback with tx hash link
```

A `contracts/` directory (Soroban) will be added once the mandate/policy
contract work begins.

## Screenshots

<!-- Add screenshots here: -->
<!-- 1. Wallet connected state -->
<!-- 2. Balance displayed -->
<!-- 3. Successful testnet transaction with the result shown to the user -->
