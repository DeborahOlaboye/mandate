# Mandate

Mandate is a Stellar testnet payments dApp built for the Stellar Journey to
Mastery challenge — White Belt (Level 1). It connects to the Freighter
wallet, displays the connected account's testnet XLM balance, and sends XLM
payments on the Stellar testnet with clear success/failure feedback.

## Features

- Connect and disconnect a Freighter wallet
- Fetch and display the connected account's testnet XLM balance, with a
  Friendbot funding shortcut for unfunded accounts
- Send an XLM payment to any address on the Stellar testnet
- Transaction feedback: success/failure state, transaction hash, and a link
  to view the transaction on Stellar Expert

## Tech stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) for building/submitting transactions
- [`@stellar/freighter-api`](https://www.npmjs.com/package/@stellar/freighter-api) for wallet connection and signing

## Prerequisites

- Node.js 18+
- [Freighter wallet](https://freighter.app) browser extension, installed and unlocked
- Freighter set to **Test Net** (Settings → Network → Test Net)
- A funded testnet account (the app can fund it for you via Friendbot if it's empty)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser with the
Freighter extension installed.

## Usage

1. Click **Connect Freighter Wallet** and approve the connection in the
   Freighter popup.
2. Your testnet XLM balance loads automatically. If the account doesn't
   exist yet on testnet, click **Fund with Friendbot**.
3. Enter a destination address (starts with `G...`) and an amount, then
   click **Send XLM**.
4. Approve the transaction in Freighter. The result — success or failure,
   with the transaction hash — appears below the form.

## Project structure

```
app/page.tsx              # Main page, wires wallet + balance + payment flow together
lib/stellar.ts             # Horizon client, balance fetch, transaction build/submit, Friendbot
lib/useWallet.ts            # Freighter connect/disconnect state hook
components/WalletConnect.tsx    # Connect/disconnect UI
components/BalanceCard.tsx      # Balance display + refresh
components/SendPaymentForm.tsx  # Destination/amount input form
components/TransactionResult.tsx # Success/failure feedback with tx hash link
```

## Screenshots

<!-- Add screenshots here before submitting: -->
<!-- 1. Wallet connected state -->
<!-- 2. Balance displayed -->
<!-- 3. Successful testnet transaction with the result shown to the user -->
