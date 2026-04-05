const WALLET_STORAGE_KEY = "agent-duel.wallet-address";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadStoredWalletAddress() {
  if (!canUseStorage()) {
    return "";
  }

  return window.localStorage.getItem(WALLET_STORAGE_KEY) ?? "";
}

export function storeWalletAddress(walletAddress: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(WALLET_STORAGE_KEY, walletAddress);
}

export function clearStoredWalletAddress() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(WALLET_STORAGE_KEY);
}
