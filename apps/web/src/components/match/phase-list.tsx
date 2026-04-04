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
          className="arena-surface flex items-center gap-3 px-4 py-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-400/10 text-sm font-semibold text-cyan-100">
            {index + 1}
          </span>
          <span className="text-sm text-[var(--arena-copy)]">{phase}</span>
        </li>
      ))}
    </ol>
  );
}
