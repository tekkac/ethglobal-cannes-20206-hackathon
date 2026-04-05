"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ArenaConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="arena-button-primary"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="arena-button-warning"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <button
                  onClick={openAccountModal}
                  type="button"
                  className="flex items-center gap-3 rounded-[1.2rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-white/20"
                >
                  {account.ensAvatar ? (
                    <img
                      src={account.ensAvatar}
                      alt=""
                      className="h-7 w-7 rounded-full"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(180deg,#86ebc4,#5ed6a7)] text-xs font-black text-[#0f4b38]">
                      {account.displayName.slice(0, 2)}
                    </span>
                  )}
                  <span>{account.displayName}</span>
                  {account.displayBalance ? (
                    <span className="text-[var(--arena-copy-muted)]">
                      {account.displayBalance}
                    </span>
                  ) : null}
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
