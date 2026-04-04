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
      <div className="mb-5">
        <p className="arena-kicker text-[var(--arena-gold)]">Arena panel</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
