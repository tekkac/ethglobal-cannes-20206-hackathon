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

  return player.trustStatus === "trusted" ? "Prime contender" : "Wildcard contender";
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
              <div className="flex items-center gap-3 rounded-[999px] border border-[#0f2649]/12 bg-[linear-gradient(180deg,#fff2d8,#ffd893)] px-4 py-2 text-[#71470e] shadow-[0_5px_0_#ddb15c]">
                <span className="arena-live-dot h-2.5 w-2.5 rounded-full bg-[var(--arena-red)]" />
                <span className="arena-kicker">Live duel feed</span>
              </div>
              <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--arena-copy-muted)]">
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
                  : "The draw lands right before the lights hit."
              }
              playerTwoDetail={
                match.readyToWatch
                  ? `${trustCopy(match.playerTwo)}. P2 answers under the same public spotlight.`
                  : "The second lane opens as soon as the room fills."
              }
              footer={
                match.readyToWatch
                  ? "The fight scrolls live and the room feels every phase change."
                  : "The stage is set. The draw lands when both lanes lock in."
              }
            />
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <Panel
            title={match.readyToWatch ? "Live transcript" : "Waiting room feed"}
            description={
              match.readyToWatch
                ? "The transcript is the fight. Everything else supports it."
                : "The stage is waiting on the second lane."
            }
          >
            <div className="mb-4 rounded-[1.7rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] px-4 py-4 shadow-[0_14px_20px_rgba(10,19,38,0.12)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="arena-kicker text-[var(--arena-copy-muted)]">Stage feed</p>
                  <p className="mt-2 text-xl font-black text-white">
                    {match.readyToWatch ? "Commentary lane is live" : "Arena camera waiting on seat lock"}
                  </p>
                </div>
                <StatusBadge tone={match.readyToWatch ? "info" : "neutral"}>
                  {match.readyToWatch ? `${match.transcript.length} turns aired` : "Pre-show"}
                </StatusBadge>
              </div>
            </div>
            <div className="grid gap-4">
              {match.transcript.length > 0 ? (
                match.transcript.map((entry) => (
                  <article
                    key={entry.id}
                    className={`arena-transcript-bubble arena-transcript-bubble--${entry.tone}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="arena-kicker text-[var(--arena-copy-muted)]">{entry.phase.replaceAll("_", " ")}</p>
                        <p className="mt-2 text-sm font-extrabold uppercase tracking-[0.18em] text-white">
                          {entry.speakerLabel}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.seatLabel ? (
                          <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--arena-copy-muted)]">
                            {entry.seatLabel}
                          </div>
                        ) : null}
                        <div className="rounded-[999px] border border-white/10 bg-white/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--arena-copy-muted)]">
                          Turn {entry.turnIndex}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--arena-copy)]">{entry.body}</p>
                  </article>
                ))
              ) : (
                <div className="arena-surface px-4 py-4 text-sm leading-6 text-[var(--arena-copy-muted)]">
                  No lines yet. The crowd is waiting for the draw.
                </div>
              )}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel
              title="Phase HUD"
              description="Keep the pulse, the phase, and the count in sight at all times."
            >
              <div className="grid gap-3">
                {phaseLabels.map((label, index) => {
                  const isActive = index + 1 === match.phaseIndex;
                  const isReached = index + 1 < match.phaseIndex;

                  return (
                    <div
                      key={label}
                      className={`rounded-[1.45rem] border-2 px-4 py-3 shadow-[0_10px_16px_rgba(10,19,38,0.12)] ${
                        isActive
                          ? "border-[#123f75]/14 bg-[linear-gradient(180deg,#93e5ff,#57c8ff)]"
                          : isReached
                            ? "border-[#0f3d72]/14 bg-[linear-gradient(180deg,#86ebc4,#5ed6a7)]"
                            : "border-white/10 bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-[1rem] border-2 text-sm font-black ${
                          isActive
                            ? "border-[#123f75]/14 bg-white/40 text-[#113b70]"
                            : isReached
                              ? "border-[#0f3d72]/14 bg-white/30 text-[#0f4b38]"
                              : "border-white/10 bg-white/[0.08] text-white"
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`text-sm font-semibold ${isActive || isReached ? "text-white" : "text-[var(--arena-copy)]"}`}>{label}</span>
                      </div>
                      {isActive ? <StatusBadge tone="info">Live</StatusBadge> : null}
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel
              title="Contestant trust"
              description="The room should read each lane instantly."
            >
              <div className="grid gap-3">
                {[
                  { seat: "Player 1", player: match.playerOne },
                  { seat: "Player 2", player: match.playerTwo },
                ].map(({ seat, player }) => (
                  <div key={seat} className="rounded-[1.65rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
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
                          <p className="mt-2 text-lg font-black text-white">{renderName(player, `${seat} pending`)}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--arena-copy)]">{trustCopy(player)}</p>
                        </div>
                      </div>
                      {player ? (
                        <StatusBadge tone={player.trustStatus}>
                          {player.trustStatus === "trusted" ? "Prime lane" : "Wildcard lane"}
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
              title="Final board"
              description="The lock breaks, the move shows, the board pays out."
            >
              <div className="grid gap-3">
                <div className="rounded-[1.65rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 text-sm leading-6 text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  {match.readyToWatch
                    ? "The duel is live. Stay on the board and watch it unfold."
                    : "Both lanes are almost in. The room is about to flip live."}
                </div>
                {match.finalActions.playerOne || match.finalActions.playerTwo ? (
                  <div className="rounded-[1.65rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 text-sm leading-6 text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                    <p className="arena-kicker text-[var(--arena-copy-muted)]">Final move</p>
                    <p className="mt-3 text-white">
                      P1: {match.finalActions.playerOne ?? "Hidden"} | P2: {match.finalActions.playerTwo ?? "Hidden"}
                    </p>
                    {match.resolutionSummary ? (
                      <p className="mt-3 text-[var(--arena-copy)]">{match.resolutionSummary}</p>
                    ) : null}
                  </div>
                ) : null}
                <div className="rounded-[1.65rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 text-sm leading-6 text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <p className="arena-kicker text-[var(--arena-copy-muted)]">Lock state</p>
                  <p className="mt-3 text-white">
                    P1 locked: {match.commitmentState.playerOneCommitted ? "yes" : "no"} | P2 locked: {match.commitmentState.playerTwoCommitted ? "yes" : "no"}
                  </p>
                  <p className="mt-2 text-white">
                    Reveal open: {match.commitmentState.revealVerified ? "yes" : "pending"}
                  </p>
                  {match.commitmentState.verificationError ? (
                    <p className="mt-3 text-amber-200">{match.commitmentState.verificationError}</p>
                  ) : null}
                </div>
                <div className="rounded-[1.65rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-4 text-sm leading-6 text-[var(--arena-copy)] shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
                  <p className="arena-kicker text-[var(--arena-copy-muted)]">Prize board</p>
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
                      <div key={seat} className="rounded-[1.5rem] border-2 border-white/10 bg-white/[0.07] px-4 py-3 shadow-[0_10px_16px_rgba(10,19,38,0.12)]">
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
                              <p className="mt-1 font-black text-white">{renderName(player, seat)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white">{payout} USDC</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--arena-copy-muted)]">
                              {claimed ? "Taken" : "Live"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[var(--arena-copy)]">Board status: {match.settlement.status}</p>
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
