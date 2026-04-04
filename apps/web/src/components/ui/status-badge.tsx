import type { ReactNode } from "react";

const toneClasses = {
  trusted:
    "border-emerald-300/30 bg-[linear-gradient(180deg,rgba(103,217,163,0.22),rgba(103,217,163,0.08))] text-emerald-100 shadow-[0_0_18px_rgba(103,217,163,0.12)]",
  untrusted:
    "border-amber-300/30 bg-[linear-gradient(180deg,rgba(243,166,63,0.22),rgba(255,118,93,0.08))] text-amber-100 shadow-[0_0_18px_rgba(243,166,63,0.12)]",
  neutral: "border-white/10 bg-white/5 text-[#f7f2df]",
  info: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_18px_rgba(101,231,255,0.1)]"
} as const;

export function StatusBadge({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
