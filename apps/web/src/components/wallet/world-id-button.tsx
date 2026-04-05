"use client";

import { IDKitWidget, type ISuccessResult, VerificationLevel } from "@worldcoin/idkit";

export function WorldIdButton({
  walletAddress,
  onVerified,
  disabled,
}: {
  walletAddress: string;
  onVerified: (result: ISuccessResult) => void;
  disabled?: boolean;
}) {
  const appId = process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID ?? "app_staging_demo";

  return (
    <IDKitWidget
      app_id={appId as `app_${string}`}
      action="enter-arena"
      signal={walletAddress}
      onSuccess={onVerified}
      verification_level={VerificationLevel.Orb}
      autoClose
    >
      {({ open }: { open: () => void }) => (
        <button
          type="button"
          onClick={open}
          disabled={disabled || !walletAddress}
          className="rounded-[1.4rem] border-2 border-[#0f3d72]/14 bg-[linear-gradient(180deg,rgba(134,235,196,0.3),rgba(76,171,135,0.12))] px-5 py-4 text-left transition hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <span className="inline-flex items-center gap-2 rounded-[999px] border border-[#153d73]/15 bg-[linear-gradient(180deg,#7fe7bf,#56d39d)] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0f4b38] shadow-[0_4px_0_#2ba275]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            World ID
          </span>
          <p className="mt-3 text-lg font-black text-white">Verify & Enter Prime</p>
          <p className="mt-1 text-xs text-[var(--arena-copy-muted)]">
            Prove you're human with World ID
          </p>
        </button>
      )}
    </IDKitWidget>
  );
}
