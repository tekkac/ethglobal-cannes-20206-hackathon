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
          className="rounded-[1.5rem] border-2 border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3 shadow-[0_10px_16px_rgba(10,19,38,0.12)]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[1rem] border-2 border-[#123f75]/14 bg-[linear-gradient(180deg,#8fe4ff,#58c8ff)] text-sm font-black text-[#0f3a70] shadow-[0_4px_0_#1d92ca]">
              {index + 1}
            </span>
            <span className="text-sm font-semibold text-[var(--arena-copy)]">{phase}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
