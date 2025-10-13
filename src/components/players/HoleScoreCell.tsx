import { formatHoleScore } from "../../lib/scoringUtils";

function isValid(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

export default function HoleScoreCell({
  score,
  par,
}: {
  score?: number | null;
  par: number;
}) {
  const valid = isValid(score);
  const diff = valid ? (score as number) - par : null;

  const text = formatHoleScore(valid ? (score as number) : null);

  return (
    <td
      className={`px-2 py-2 relative ${
        valid ? "font-semibold text-slate-900" : "text-slate-400"
      }`}
    >
      <span className="relative z-10 inline-block">{text}</span>
      {valid && diff !== null && (
        <>
          {diff <= -2 && (
            <>
              <span className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-red-500" />
              <span className="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-red-500" />
            </>
          )}

          {diff === -1 && (
            <span className="pointer-events-none absolute inset-0.5 rounded-full border-2 border-red-500" />
          )}

          {diff >= 2 && (
            <>
              <span className="pointer-events-none absolute inset-0.5 border-2 border-slate-500 rounded-sm" />
              <span className="pointer-events-none absolute -inset-0.5 border-2 border-slate-500 rounded-sm" />
            </>
          )}

          {diff === 1 && (
            <span className="pointer-events-none absolute inset-0.5 border-2 border-slate-500 rounded-sm" />
          )}
        </>
      )}
    </td>
  );
}
