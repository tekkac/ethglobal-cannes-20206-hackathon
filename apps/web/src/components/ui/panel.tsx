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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur">
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
