const phases = [
  "Wallet connected",
  "Trust mode chosen",
  "Runner healthy",
  "Lobby funded",
  "P1/P2 assigned at random",
  "6 public messages",
  "Final commit",
  "Reveal and settlement"
];

export function PhaseList() {
  return (
    <ol className="grid gap-3">
      {phases.map((phase, index) => (
        <li
          key={phase}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-semibold text-cyan-200">
            {index + 1}
          </span>
          <span className="text-sm text-slate-200">{phase}</span>
        </li>
      ))}
    </ol>
  );
}
