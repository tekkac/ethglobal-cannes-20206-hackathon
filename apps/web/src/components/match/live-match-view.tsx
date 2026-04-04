"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  ArenaVsBanner,
  BroadcastMetric,
  IdentityAvatar,
} from "@/components/ui/arena-primitives";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { loadStoredWalletAddress } from "@/lib/client/session";

type MatchPlayer = {
  walletAddress: string;
  trustStatus: "trusted" | "untrusted";
  displayName: string | null;
  ensName: string | null;
  ensAvatar: string | null;
};

type MatchDetail = {
  id: string;
  stakeAmount: string;
  status: string;
  phase: string;
  phaseLabel: string;
  phaseIndex: number;
  totalPhases: number;
  watcherCount: number;
  timerLabel: string;
  readyToWatch: boolean;
  resolutionSummary: string | null;
  commitmentState: {
    playerOneCommitted: boolean;
    playerTwoCommitted: boolean;
    revealVerified: boolean;
    verificationError: string | null;
  };
  finalActions: {
    playerOne: "SPLIT" | "STEAL" | null;
    playerTwo: "SPLIT" | "STEAL" | null;
  };
  settlement: {
    status: "pending" | "claimable" | "settled";
    playerOnePayout: string;
    playerTwoPayout: string;
    playerOneClaimed: boolean;
    playerTwoClaimed: boolean;
  };
  playerA: MatchPlayer | null;
  playerB: MatchPlayer | null;
  playerOne: MatchPlayer | null;
  playerTwo: MatchPlayer | null;
  transcript: Array<{
    id: string;
    phase: string;
    turnIndex: number;
    speakerRole: "player" | "system";
    speakerLabel: string;
    seatLabel: "P1" | "P2" | null;
    body: string;
    tone: "p1" | "p2" | "system";
  }>;
};

const phaseLabels = [
  "Waiting to start",
  "Round 1",
  "Round 2",
  "Round 3",
  "Round 4",
  "Round 5",
  "Round 6",
  "Final commit",
  "Final reveal",
  "Resolved",
];

function renderName(player: MatchPlayer | null, fallback: string) {
  return player?.ensName ?? player?.displayName ?? player?.walletAddress ?? fallback;
}

function trustCopy(player: MatchPlayer | null) {
  if (!player) {
    return "Seat pending";
  }

  return player.trustStatus === "trusted" ? "Trusted entrant" : "Might be a sybil";
}

export function LiveMatchView({
  matchId,
  initialMatch,
}: {
  matchId: string;
  initialMatch: MatchDetail;
}) {
  const [match, setMatch] = useState(initialMatch);
  const [claimMessage, setClaimMessage] = useState("");
  const [isClaimPending, startClaimTransition] = useTransition();
  const storedWalletAddress = loadStoredWalletAddress().toLowerCase();

  useEffect(() => {
    const interval = window.setInterval(async () => {
      const response = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { match: MatchDetail };
      setMatch(payload.match);
    }, 2_000);

    return () => window.clearInterval(interval);
  }, [matchId]);

  const viewerIsPlayerOne = Boolean(match.playerOne?.walletAddress.toLowerCase() === storedWalletAddress);
  const viewerIsPlayerTwo = Boolean(match.playerTwo?.walletAddress.toLowerCase() === storedWalletAddress);
  const viewerPayout = viewerIsPlayerOne
    ? match.settlement.playerOnePayout
    : viewerIsPlayerTwo
      ? match.settlement.playerTwoPayout
      : "0.00";
  const viewerAlreadyClaimed = viewerIsPlayerOne
    ? match.settlement.playerOneClaimed
    : viewerIsPlayerTwo
      ? match.settlement.playerTwoClaimed
      : false;
  const canClaim =
    match.commitmentState.revealVerified &&
    (viewerIsPlayerOne || viewerIsPlayerTwo) &&
    Number.parseFloat(viewerPayout) > 0 &&
    !viewerAlreadyClaimed;

  return (
    <main className="arena-shell min-h-screen text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 sm:py-6">
        <section className="arena-panel px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                <span className="arena-live-dot h-2.5 w-2.5 rounded-full bg-[var(--arena-red)]" />
                <span className="arena-kicker text-[var(--arena-gold)]">Live duel feed</span>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
                Match {match.id.slice(-6)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/lobby" className="arena-button-secondary">
                Back to lobby
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <BroadcastMetric label="Phase" value={match.phaseLabel} tone="info" />
            <BroadcastMetric label="Timer" value={match.timerLabel} tone="neutral" />
            <BroadcastMetric label="Watchers" value={`${match.watcherCount} online`} tone="trusted" />
            <BroadcastMetric label="Stake" value={`${match.stakeAmount} USDC`} tone="neutral" />
          </div>

          <div className="mt-6">
            <ArenaVsBanner
              title="Player 1 vs Player 2"
              phase={match.phaseLabel}
              timer={match.timerLabel}
              watchers={`${match.watcherCount} watchers`}
              playerOneLabel={renderName(match.playerOne, "Player 1 pending")}
              playerTwoLabel={renderName(match.playerTwo, "Player 2 pending")}
              playerOneAvatar={match.playerOne?.ensAvatar}
              playerTwoAvatar={match.playerTwo?.ensAvatar}
              playerOneTrust={match.playerOne?.trustStatus ?? "trusted"}
              playerTwoTrust={match.playerTwo?.trustStatus ?? "untrusted"}
              playerOneDetail={
                match.readyToWatch
                  ? `${trustCopy(match.playerOne)}. P1 speaks first and frames the duel in the transcript lane.`
                  : "Seat assignment reveals right before the match starts."
              }
              playerTwoDetail={
                match.readyToWatch
                  ? `${trustCopy(match.playerTwo)}. P2 answers under the same public spotlight.`
                  : "Second seat opens as soon as the lobby fills."
              }
              footer={
                match.readyToWatch
                  ? "The transcript below auto-refreshes as the duel advances through public rounds, final commit, and final reveal."
                  : "This waiting room stays watchable before the duel is live. P1/P2 are only revealed when both sides are locked in."
              }
            />
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Panel
            title={match.readyToWatch ? "Live transcript" : "Waiting room feed"}
            description={
              match.readyToWatch
                ? "Transcript is the dominant element. Player turns stay explicit and system phases are visible instead of hidden behind backend state."
                : "The duel has not started yet. This screen holds the broadcast frame until the second player joins and seats are assigned."
            }
          >
            <div className="grid gap-3">
              {match.transcript.length > 0 ? (
                match.transcript.map((entry) => (
                  <article
                    key={entry.id}
                    className={`arena-transcript-bubble arena-transcript-bubble--${entry.tone}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="arena-kicker text-[var(--arena-copy-muted)]">{entry.phase.replaceAll("_", " ")}</p>
                        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-white">
                          {entry.speakerLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.seatLabel ? (
                          <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
                            {entry.seatLabel}
                          </div>
                        ) : null}
                        <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.28em] text-[var(--arena-copy-muted)]">
                          Turn {entry.turnIndex}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--arena-copy)]">{entry.body}</p>
                  </article>
                ))
              ) : (
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                  No public transcript yet. The broadcast will open as soon as the second player joins and seat assignment is revealed.
                </div>
              )}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel
              title="Phase HUD"
              description="Phase, trust, and timer stay visible on small screens so the match is readable without side-by-side crowding."
            >
              <div className="grid gap-3">
                {phaseLabels.map((label, index) => {
                  const isActive = index + 1 === match.phaseIndex;
                  const isReached = index + 1 < match.phaseIndex;

                  return (
                    <div
                      key={label}
                      className={`arena-surface flex items-center justify-between gap-3 px-4 py-3 ${
                        isActive
                          ? "border-cyan-300/30 bg-cyan-400/10"
                          : isReached
                            ? "border-emerald-300/20 bg-emerald-400/10"
                            : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <span className="text-sm text-[var(--arena-copy)]">{label}</span>
                      </div>
                      {isActive ? <StatusBadge tone="info">Live</StatusBadge> : null}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Contestant trust"
              description="Trust is a visual property of the duel, not a tiny badge tucked into metadata."
            >
              <div className="grid gap-3">
                {[
                  { seat: "Player 1", player: match.playerOne },
                  { seat: "Player 2", player: match.playerTwo },
                ].map(({ seat, player }) => (
                  <div key={seat} className="arena-surface px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-4">
                        {player ? (
                          <IdentityAvatar
                            label={renderName(player, `${seat} pending`)}
                            avatarUrl={player.ensAvatar}
                            trustStatus={player.trustStatus}
                            size="lg"
                          />
                        ) : null}
                        <div>
                          <p className="arena-kicker text-[var(--arena-copy-muted)]">{seat}</p>
                          <p className="mt-2 text-lg font-semibold text-white">{renderName(player, `${seat} pending`)}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">{trustCopy(player)}</p>
                        </div>
                      </div>
                      {player ? (
                        <StatusBadge tone={player.trustStatus}>
                          {player.trustStatus === "trusted" ? "Trusted" : "Might be a sybil"}
                        </StatusBadge>
                      ) : (
                        <StatusBadge tone="neutral">Pending</StatusBadge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              title="Settlement"
              description="Verified reveal now flows into payout state, and the owning player can claim if a payout exists."
            >
              <div className="grid gap-3">
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy)]">
                  {match.readyToWatch
                    ? "This match now persists transcript progression and reveal state in storage. The page is reading a real evolving match record, not just a static mock screen."
                    : "The waiting room is live now. Once the second entrant joins, the page will reveal P1/P2, begin the transcript cadence, and advance through the final commit and reveal phases."}
                </div>
                {match.finalActions.playerOne || match.finalActions.playerTwo ? (
                  <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy)]">
                    <p className="arena-kicker text-[var(--arena-copy-muted)]">Reveal state</p>
                    <p className="mt-3 text-white">
                      P1: {match.finalActions.playerOne ?? "Hidden"} | P2: {match.finalActions.playerTwo ?? "Hidden"}
                    </p>
                    {match.resolutionSummary ? (
                      <p className="mt-3 text-[var(--arena-copy)]">{match.resolutionSummary}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy)]">
                  <p className="arena-kicker text-[var(--arena-copy-muted)]">Commit integrity</p>
                  <p className="mt-3 text-white">
                    P1 committed: {match.commitmentState.playerOneCommitted ? "yes" : "no"} | P2 committed: {match.commitmentState.playerTwoCommitted ? "yes" : "no"}
                  </p>
                  <p className="mt-2 text-white">
                    Reveal verified: {match.commitmentState.revealVerified ? "yes" : "pending"}
                  </p>
                  {match.commitmentState.verificationError ? (
                    <p className="mt-3 text-amber-200">{match.commitmentState.verificationError}</p>
                  ) : null}
                </div>
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy)]">
                  <p className="arena-kicker text-[var(--arena-copy-muted)]">Payout board</p>
                  <div className="mt-3 grid gap-3">
                    {[
                      {
                        seat: "P1",
                        player: match.playerOne,
                        payout: match.settlement.playerOnePayout,
                        claimed: match.settlement.playerOneClaimed,
                      },
                      {
                        seat: "P2",
                        player: match.playerTwo,
                        payout: match.settlement.playerTwoPayout,
                        claimed: match.settlement.playerTwoClaimed,
                      },
                    ].map(({ seat, player, payout, claimed }) => (
                      <div key={seat} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {player ? (
                              <IdentityAvatar
                                label={renderName(player, seat)}
                                avatarUrl={player.ensAvatar}
                                trustStatus={player.trustStatus}
                              />
                            ) : null}
                            <div>
                              <p className="arena-kicker text-[var(--arena-copy-muted)]">{seat}</p>
                              <p className="mt-1 font-semibold text-white">{renderName(player, seat)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">{payout} USDC</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--arena-copy-muted)]">
                              {claimed ? "Claimed" : "Available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[var(--arena-copy)]">Settlement status: {match.settlement.status}</p>
                  {claimMessage ? <p className="mt-3 text-cyan-100">{claimMessage}</p> : null}
                  {canClaim ? (
                    <button
                      type="button"
                      onClick={() => {
                        startClaimTransition(async () => {
                          const response = await fetch(`/api/matches/${matchId}/claim`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              walletAddress: storedWalletAddress,
                            }),
                          });
                          const payload = await response.json();
                          if (!response.ok) {
                            setClaimMessage(payload.error ?? "Claim failed.");
                            return;
                          }
                          setClaimMessage(`Claim submitted for ${payload.claim.payout} USDC.`);
                          if (payload.match) {
                            setMatch(payload.match);
                          }
                        });
                      }}
                      disabled={isClaimPending}
                      className="arena-button-primary mt-4"
                    >
                      Claim payout
                    </button>
                  ) : null}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}
