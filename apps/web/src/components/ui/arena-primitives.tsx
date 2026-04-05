import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui/status-badge";

type Tone = "neutral" | "trusted" | "untrusted" | "info";

const metricToneClasses: Record<Tone, string> = {
  neutral:
    "border-[#14305d]/14 bg-[linear-gradient(180deg,#fff2d8,#ffd894)] text-[#71480d] shadow-[0_7px_0_#ddb15f,0_16px_24px_rgba(118,79,16,0.16)]",
  trusted:
    "border-[#0f3d72]/14 bg-[linear-gradient(180deg,#86ebc4,#5ed6a7)] text-[#0f4b38] shadow-[0_7px_0_#2ca779,0_16px_24px_rgba(44,167,121,0.18)]",
  untrusted:
    "border-[#6f2414]/14 bg-[linear-gradient(180deg,#ffb47b,#ff855b)] text-[#742e18] shadow-[0_7px_0_#dc5d41,0_16px_24px_rgba(174,71,49,0.18)]",
  info:
    "border-[#103d72]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)] text-[#0f3a70] shadow-[0_7px_0_#1d92ca,0_16px_24px_rgba(29,146,202,0.18)]",
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
    <div className={`rounded-[1.45rem] border-2 px-4 py-4 ${metricToneClasses[tone]}`}>
      <p className="arena-kicker opacity-70">{label}</p>
      <p className="mt-3 text-lg font-black text-current">{value}</p>
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
      ? "border-[#0f3d72]/14 bg-[linear-gradient(180deg,#86ebc4,#5ed6a7)] shadow-[0_6px_0_#2da97b,0_16px_24px_rgba(44,167,121,0.18)]"
      : "border-[#6f2414]/14 bg-[linear-gradient(180deg,#ffb47b,#ff855b)] shadow-[0_6px_0_#dc5d41,0_16px_24px_rgba(174,71,49,0.18)]";

  return (
    <div className={`relative overflow-hidden border ${sizeClasses} ${ringClasses}`}>
      {avatarUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.04))]" />
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
      className={`relative overflow-hidden rounded-[1.9rem] border-2 px-5 py-5 shadow-[0_14px_24px_rgba(10,19,38,0.18)] ${align === "right" ? "text-right" : ""} ${
        isTrusted
          ? "border-[#0f3d72]/12 bg-[linear-gradient(180deg,rgba(134,235,196,0.3),rgba(76,171,135,0.12))]"
          : "border-[#6f2414]/14 bg-[linear-gradient(180deg,rgba(255,180,123,0.3),rgba(255,107,94,0.12))]"
      }`}
    >
      <div
        className={`absolute inset-x-5 top-0 h-1.5 rounded-b-full ${
          isTrusted ? "bg-[#86ebc4]" : "bg-[#ffb47b]"
        }`}
      />
      <p className="arena-kicker text-white/72">{seat}</p>
      <div className={`mt-4 flex items-center gap-4 ${align === "right" ? "justify-end" : ""}`}>
        {align === "right" ? null : (
          <IdentityAvatar label={label} avatarUrl={avatarUrl} trustStatus={trustStatus} size="lg" />
        )}
        <div>
          <p className="text-2xl font-black text-white">{label}</p>
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
  footer?: string;
}) {
  return (
    <section className="arena-panel arena-rise px-5 py-5 sm:px-7 sm:py-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 rounded-[999px] border border-[#0f2649]/12 bg-[linear-gradient(180deg,#fff2d8,#ffd893)] px-4 py-2 text-[#71470e] shadow-[0_5px_0_#ddb15c]">
          <span className="arena-live-dot h-2.5 w-2.5 rounded-full bg-[var(--arena-red)]" />
          <span className="arena-kicker">Live arena feed</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-[var(--arena-copy-muted)]">
          <span className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2">{phase}</span>
          <span className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2">{timer}</span>
          <span className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2">{watchers}</span>
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
          <div className="relative mt-4 overflow-hidden rounded-[2.2rem] border-2 border-[#17315c]/14 bg-[linear-gradient(180deg,#fff1d1,#ffc969)] px-8 py-5 shadow-[0_12px_0_#de9f39,0_28px_40px_rgba(118,79,16,0.2)] sm:px-12">
            <div className="arena-sweep pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
            <p className="arena-display text-6xl text-[#8a340b] sm:text-8xl">VS</p>
          </div>
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

      {footer ? (
        <div className="arena-surface mt-6 flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="arena-kicker text-[var(--arena-copy-muted)]">Broadcast note</span>
          <p className="text-sm leading-6 text-[var(--arena-copy)]">{footer}</p>
        </div>
      ) : null}
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
          <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--arena-copy)]">
            {description}
          </p>
        </div>
        <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2 text-xs uppercase tracking-[0.22em] text-[var(--arena-copy-muted)]">
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
                <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.18em] text-white">
                  {turn.speaker}
                </p>
              </div>
              <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--arena-copy-muted)]">
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
      <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
