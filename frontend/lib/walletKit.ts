"use client";

import type { contract } from "@stellar/stellar-sdk";

type KitModule = typeof import("@creit.tech/stellar-wallets-kit");

let kitModulePromise: Promise<KitModule> | null = null;

async function loadKitModule(): Promise<KitModule> {
  if (!kitModulePromise) {
    kitModulePromise = (async () => {
      const [kitModule, { FreighterModule }, { xBullModule }, { AlbedoModule }, { LobstrModule }, { RabetModule }] =
        await Promise.all([
          import("@creit.tech/stellar-wallets-kit"),
          import("@creit.tech/stellar-wallets-kit/modules/freighter"),
          import("@creit.tech/stellar-wallets-kit/modules/xbull"),
          import("@creit.tech/stellar-wallets-kit/modules/albedo"),
          import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
          import("@creit.tech/stellar-wallets-kit/modules/rabet"),
        ]);

      kitModule.StellarWalletsKit.init({
        network: kitModule.Networks.TESTNET,
        modules: [
          new FreighterModule(),
          new xBullModule(),
          new AlbedoModule(),
          new LobstrModule(),
          new RabetModule(),
        ],
      });

      return kitModule;
    })();
  }
  return kitModulePromise;
}

export async function hasAnyWalletAvailable(): Promise<boolean> {
  const { StellarWalletsKit } = await loadKitModule();
  const wallets = await StellarWalletsKit.refreshSupportedWallets();
  return wallets.some((wallet) => wallet.isAvailable);
}

export async function connectWallet(): Promise<string> {
  const { StellarWalletsKit } = await loadKitModule();

  const anyAvailable = await hasAnyWalletAvailable();
  if (!anyAvailable) {
    throw new Error(
      "No Stellar wallet detected. Install Freighter, xBull, Albedo, Lobstr, or Rabet to continue."
    );
  }

  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  const { StellarWalletsKit } = await loadKitModule();
  await StellarWalletsKit.disconnect();
}

export async function getWalletNetwork(): Promise<{ network: string; networkPassphrase: string }> {
  const { StellarWalletsKit } = await loadKitModule();
  return StellarWalletsKit.getNetwork();
}

/**
 * Wraps the kit's signTransaction so it always resolves (never throws),
 * matching the SEP-43 SignTransaction shape that @stellar/stellar-sdk's
 * contract.Client expects. Any thrown signing error (declined in the wallet
 * popup, wallet locked, etc.) is reported back as a user-rejection so callers
 * get a single, predictable error path.
 */
export async function getSignTransaction(): Promise<contract.SignTransaction> {
  const { StellarWalletsKit } = await loadKitModule();

  return async (xdr, opts) => {
    try {
      const result = await StellarWalletsKit.signTransaction(xdr, opts);
      return { signedTxXdr: result.signedTxXdr, signerAddress: result.signerAddress };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transaction signing was declined";
      return {
        signedTxXdr: "",
        error: { message, code: -4 },
      };
    }
  };
}
