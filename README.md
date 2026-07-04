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

The repository has two parts:

- **`frontend/`** — a Next.js app that connects a Stellar wallet, reads an
  account's XLM balance, sends payments, and provides a UI for creating,
  spending against, revoking, and looking up on-chain mandates.
- **`contracts/mandate/`** — a Soroban smart contract that stores mandates
  (owner, spender, limit, spent-so-far, expiration ledger, revoked flag) and
  enforces the spending rules on-chain.

### Deployed contract (Stellar testnet)

- Contract ID: `CASEWMVZAFZEDNFGHJSYBC47HI7UUR5U4CST2XHCQXIXEWE7HGNOQM22`
- Example `create_mandate` call: [`11a41f40de1e6a23e37631c6452444c71ff86c63b3307e75c89214f97eae198b`](https://stellar.expert/explorer/testnet/tx/11a41f40de1e6a23e37631c6452444c71ff86c63b3307e75c89214f97eae198b)
- Example `spend` call: [`56b8de2391ae3c862ddc320250ae68c9e9e1618ed61d2fb7e53f6ced8af3caf5`](https://stellar.expert/explorer/testnet/tx/56b8de2391ae3c862ddc320250ae68c9e9e1618ed61d2fb7e53f6ced8af3caf5)

### Implemented so far

**Wallet & payments**
- Connect/disconnect via [StellarWalletsKit](https://github.com/Creit-Tech/Stellar-Wallets-Kit), supporting Freighter, xBull, Albedo, LOBSTR, and Rabet
- Fetch and display the connected account's XLM balance, with a Friendbot
  funding shortcut for unfunded testnet accounts
- Send an XLM payment to any address, with client-side address validation

**Mandate contract**
- `create_mandate(owner, spender, limit, expiration_ledger)` — owner-authorized, write
- `spend(mandate_id, amount, destination)` — spender-authorized, enforces limit/expiry/revocation, write
- `revoke(mandate_id)` — owner-authorized, write
- `get_mandate(mandate_id)` — read
- Each action emits a contract event (`mandate_created`, `mandate_spent`, `mandate_revoked`)

**Frontend integration**
- Contract calls made directly from the browser using `@stellar/stellar-sdk`'s
  generic `contract.Client` (built from the on-chain contract spec, no
  separate codegen step)
- A live event feed polls Soroban RPC for the contract's events and updates
  in real time
- Every write call surfaces a visible pending → success/fail status with the
  transaction hash
- Error handling covers: no wallet detected, transaction rejected in the
  wallet, and contract-level errors (e.g. spending past a mandate's limit)

### Planned

- Real token movement tied to a mandate's `spend` (currently the contract
  tracks and enforces the spending policy; wiring it to an actual SEP-41
  token transfer/allowance is the next step)
- Destination allowlists per mandate, not just an amount limit
- A dashboard listing all mandates for a connected account

## Tech stack

- Next.js (App Router) + TypeScript + Tailwind CSS — `frontend/`
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) for Horizon/Soroban RPC calls, transaction building, and the contract client
- [`@creit.tech/stellar-wallets-kit`](https://www.npmjs.com/package/@creit.tech/stellar-wallets-kit) for multi-wallet connection and signing
- Soroban (Rust) — `contracts/mandate/`

## Prerequisites

- Node.js 18+
- Rust with the `wasm32v1-none` target, and the [`stellar` CLI](https://developers.stellar.org/docs/tools/cli/install-cli) (only needed to rebuild/redeploy the contract)
- A Stellar wallet browser extension (Freighter, xBull, LOBSTR, or Rabet) or Albedo, set to **Test Net**
- A funded testnet account (the app can fund it for you via Friendbot if it's empty)

## Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser with a
Stellar wallet available.

## Usage

1. Click **Connect Wallet** and pick a wallet from the list.
2. Your XLM balance loads automatically. If the account doesn't exist yet
   on testnet, click **Fund with Friendbot**.
3. Send a plain XLM payment, or scroll to **Mandates (Soroban)** to create a
   mandate, spend against it, revoke it, or look one up — each action shows
   a pending → success/fail status with a transaction hash, and confirmed
   events appear in the live feed.

## Rebuilding/redeploying the contract

```bash
cd contracts
cargo test
stellar contract build
stellar contract deploy \
  --wasm target/wasm32v1-none/release/mandate.wasm \
  --source <your-identity> \
  --network testnet \
  --alias mandate
```

If you redeploy, update `MANDATE_CONTRACT_ID` in `frontend/lib/mandateContract.ts`.

## Repository structure

```
contracts/mandate/src/lib.rs          # Mandate contract: create/spend/revoke/get_mandate + events
contracts/mandate/src/test.rs         # Contract unit tests

frontend/app/page.tsx                 # Main page: wallet, balance, payment, and mandate UI
frontend/lib/stellar.ts               # Horizon client, balance fetch, payment build/submit, Friendbot
frontend/lib/useWallet.ts             # Wallet connect/disconnect state hook
frontend/lib/walletKit.ts             # StellarWalletsKit setup (multi-wallet) and signing wrapper
frontend/lib/mandateContract.ts       # Contract client, write-call runner, event parsing
frontend/lib/useMandateEvents.ts      # Polls Soroban RPC for live contract events
frontend/components/WalletConnect.tsx     # Connect/disconnect UI
frontend/components/BalanceCard.tsx       # Balance display + refresh
frontend/components/SendPaymentForm.tsx   # XLM payment form
frontend/components/MandateSection.tsx    # Create/spend/revoke/lookup mandate UI
frontend/components/EventFeed.tsx         # Live contract event feed
frontend/components/TransactionResult.tsx # Pending/success/fail feedback with tx hash link
```
