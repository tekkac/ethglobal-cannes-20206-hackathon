import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

type Tone = "neutral" | "trusted" | "untrusted" | "info";

const metricToneClasses: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/5 text-[#f7f2df]",
  trusted: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
  untrusted: "border-amber-400/20 bg-amber-400/10 text-amber-100",
  info: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
};

export function BroadcastMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className={`arena-surface px-4 py-3 ${metricToneClasses[tone]}`}>
      <p className="arena-kicker text-[var(--arena-copy-muted)]">{label}</p>
      <p className="mt-3 text-lg font-semibold text-current">{value}</p>
    </div>
  );
}

function buildInitials(label: string) {
  const trimmed = label.trim();

  if (!trimmed) {
    return "AD";
  }

  const parts = trimmed
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return trimmed.slice(0, 2).toUpperCase();
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "AD";
}

export function IdentityAvatar({
  label,
  avatarUrl,
  trustStatus,
  size = "md",
}: {
  label: string;
  avatarUrl?: string | null;
  trustStatus: "trusted" | "untrusted";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses =
    size === "sm"
      ? "h-11 w-11 rounded-[1rem]"
      : size === "lg"
        ? "h-20 w-20 rounded-[1.55rem]"
        : "h-14 w-14 rounded-[1.2rem]";
  const ringClasses =
    trustStatus === "trusted"
      ? "border-emerald-300/35 bg-emerald-400/10 shadow-[0_0_0_1px_rgba(103,217,163,0.08),0_16px_28px_rgba(7,23,17,0.38)]"
      : "border-amber-300/35 bg-[linear-gradient(180deg,rgba(243,166,63,0.2),rgba(255,118,93,0.08))] shadow-[0_0_0_1px_rgba(243,166,63,0.08),0_16px_28px_rgba(32,18,8,0.38)]";

  return (
    <div className={`relative overflow-hidden border ${sizeClasses} ${ringClasses}`}>
      {avatarUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
      {!avatarUrl ? (
        <span className="relative z-10 flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.18em] text-white">
          {buildInitials(label)}
        </span>
      ) : null}
    </div>
  );
}

function ContestantCard({
  seat,
  label,
  detail,
  trustStatus,
  avatarUrl,
  align,
}: {
  seat: string;
  label: string;
  detail: string;
  trustStatus: "trusted" | "untrusted";
  avatarUrl?: string | null;
  align?: "left" | "right";
}) {
  const isTrusted = trustStatus === "trusted";

  return (
    <div
      className={`arena-surface relative overflow-hidden px-5 py-5 ${align === "right" ? "text-right" : ""} ${
        isTrusted
          ? "border-emerald-300/20 bg-emerald-400/10"
          : "border-amber-300/20 bg-[linear-gradient(180deg,rgba(243,166,63,0.18),rgba(255,118,93,0.06))]"
      }`}
    >
      <div
        className={`absolute inset-y-0 w-1.5 ${
          isTrusted ? "bg-emerald-300/70" : "bg-[var(--arena-amber)]"
        } ${align === "right" ? "right-0" : "left-0"}`}
      />
      <p className="arena-kicker text-[var(--arena-copy-muted)]">{seat}</p>
      <div className={`mt-4 flex items-center gap-4 ${align === "right" ? "justify-end" : ""}`}>
        {align === "right" ? null : (
          <IdentityAvatar label={label} avatarUrl={avatarUrl} trustStatus={trustStatus} size="lg" />
        )}
        <div>
          <p className="text-2xl font-semibold text-white">{label}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">{detail}</p>
        </div>
        {align === "right" ? (
          <IdentityAvatar label={label} avatarUrl={avatarUrl} trustStatus={trustStatus} size="lg" />
        ) : null}
      </div>
      <div className={`mt-4 flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <StatusBadge tone={trustStatus}>
          {isTrusted ? "Trusted entrant" : "Might be a sybil"}
        </StatusBadge>
      </div>
    </div>
  );
}

export function ArenaVsBanner({
  title,
  phase,
  timer,
  watchers,
  playerOneLabel,
  playerTwoLabel,
  playerOneAvatar,
  playerTwoAvatar,
  playerOneDetail,
  playerTwoDetail,
  playerOneTrust = "trusted",
  playerTwoTrust = "untrusted",
  footer,
}: {
  title: string;
  phase: string;
  timer: string;
  watchers: string;
  playerOneLabel: string;
  playerTwoLabel: string;
  playerOneAvatar?: string | null;
  playerTwoAvatar?: string | null;
  playerOneDetail: string;
  playerTwoDetail: string;
  playerOneTrust?: "trusted" | "untrusted";
  playerTwoTrust?: "trusted" | "untrusted";
  footer: string;
}) {
  return (
    <section className="arena-panel arena-rise px-5 py-5 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 rounded-full border border-[rgba(255,255,255,0.1)] bg-black/20 px-4 py-2">
          <span className="arena-live-dot h-2.5 w-2.5 rounded-full bg-[var(--arena-red)]" />
          <span className="arena-kicker text-[var(--arena-gold)]">Live arena feed</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
          <span className="rounded-full border border-white/10 px-3 py-2">{phase}</span>
          <span className="rounded-full border border-white/10 px-3 py-2">{timer}</span>
          <span className="rounded-full border border-white/10 px-3 py-2">{watchers}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <ContestantCard
          seat="Player 1"
          label={playerOneLabel}
          avatarUrl={playerOneAvatar}
          detail={playerOneDetail}
          trustStatus={playerOneTrust}
        />

        <div className="relative flex flex-col items-center justify-center py-2">
          <p className="arena-kicker text-[var(--arena-gold)]">{title}</p>
          <div className="relative mt-4 overflow-hidden rounded-[2rem] border border-[rgba(246,198,103,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(8,12,18,0.92))] px-7 py-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:px-11">
            <div className="arena-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(246,198,103,0.25),transparent)]" />
            <p className="arena-display text-6xl text-white sm:text-8xl">VS</p>
          </div>
          <p className="mt-4 max-w-xs text-center text-sm leading-6 text-[var(--arena-copy)]">
            Transcript stays center stage. Trust styling stays visible even after the duel goes live.
          </p>
        </div>

        <ContestantCard
          seat="Player 2"
          label={playerTwoLabel}
          avatarUrl={playerTwoAvatar}
          detail={playerTwoDetail}
          trustStatus={playerTwoTrust}
          align="right"
        />
      </div>

      <div className="arena-surface mt-6 flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="arena-kicker text-[var(--arena-copy-muted)]">Broadcast note</span>
        <p className="text-sm leading-6 text-[var(--arena-copy)]">{footer}</p>
      </div>
    </section>
  );
}

export function TranscriptPreview({
  eyebrow,
  title,
  description,
  turns,
}: {
  eyebrow: string;
  title: string;
  description: string;
  turns: Array<{
    marker: string;
    speaker: string;
    text: string;
    tone: "p1" | "p2" | "system";
  }>;
}) {
  return (
    <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="arena-kicker text-[var(--arena-gold)]">{eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--arena-copy)]">
            {description}
          </p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
          Transcript first
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {turns.map((turn) => (
          <div
            key={`${turn.marker}-${turn.speaker}`}
            className={`arena-transcript-bubble arena-transcript-bubble--${turn.tone}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="arena-kicker text-[var(--arena-copy-muted)]">{turn.marker}</p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white">
                  {turn.speaker}
                </p>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
                {turn.tone === "system" ? "Arena desk" : turn.tone === "p1" ? "Left lane" : "Right lane"}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--arena-copy)]">{turn.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ArenaCallout({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
      <p className="arena-kicker text-[var(--arena-gold)]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
