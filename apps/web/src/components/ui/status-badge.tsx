import type { ReactNode } from "react";

const toneClasses = {
  trusted:
    "border-[#153d73]/15 bg-[linear-gradient(180deg,#7fe7bf,#56d39d)] text-[#0f4b38] shadow-[0_4px_0_#2ba275,0_12px_18px_rgba(22,95,71,0.2)]",
  untrusted:
    "border-[#6e2414]/14 bg-[linear-gradient(180deg,#ffb16f,#ff8055)] text-[#6f2c17] shadow-[0_4px_0_#d95a3f,0_12px_18px_rgba(174,71,49,0.18)]",
  neutral:
    "border-[#14305d]/14 bg-[linear-gradient(180deg,#fff2d8,#ffd894)] text-[#71480d] shadow-[0_4px_0_#ddb15f,0_12px_18px_rgba(118,79,16,0.16)]",
  info:
    "border-[#103d72]/15 bg-[linear-gradient(180deg,#8fe4ff,#55c7ff)] text-[#0f3a70] shadow-[0_4px_0_#1c91c9,0_12px_18px_rgba(28,145,201,0.18)]"
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
      className={`inline-flex rounded-[999px] border px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
