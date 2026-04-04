import type { ReactNode } from "react";

const toneClasses = {
  trusted: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  untrusted: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  neutral: "border-white/10 bg-white/5 text-slate-200",
  info: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
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
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
