import type { ReactNode } from "react";

export function Panel({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
      <div className="mb-5 border-b border-white/10 pb-5">
        <div className="inline-flex items-center gap-2 rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2 text-[var(--arena-copy-muted)]">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--arena-gold)]" />
          <p className="arena-kicker">Arena deck</p>
        </div>
        <h2 className="mt-4 text-[1.95rem] font-black tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--arena-copy)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
