const SummaryPill = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-1 text-right">
      <div className="text-[10px] leading-tight text-slate-500">{label}</div>
      <div className="text-sm font-semibold text-slate-900">{value}</div>
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
    <div className="flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm mb-3">
      <div className="min-w-0">
        <div className="text-xs text-slate-500">Player</div>
        <div className="text-sm font-semibold text-slate-900 truncate">
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
