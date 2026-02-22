const SummaryPill = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-white/10 px-3 py-1 text-right">
      <div className="text-[10px] leading-tight text-white/40">{label}</div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
};

export default function PlayerScorecardHeader({
  playerName,
  totalStrokes,
  stableford,
}: {
  playerName: string;
  totalStrokes?: number;
  stableford?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white/5 p-3 shadow-sm mb-3">
      <div className="min-w-0">
        <div className="text-xs text-white/40">Player</div>
        <div className="text-sm font-semibold text-white truncate">
          {playerName}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SummaryPill
          label="Total strokes"
          value={totalStrokes && totalStrokes > 0 ? String(totalStrokes) : "—"}
        />
        <SummaryPill
          label="Stableford"
          value={typeof stableford === "number" ? String(stableford) : "—"}
        />
      </div>
    </div>
  );
}
