import { formatHoleScore } from "../../lib/scoringUtils";

function isValid(n: any): n is number {
  return typeof n === "number" && Number.isFinite(n) && n > 0;
}

/**
 * Visar slag för ett hål, med dekor baserat på (score - par):
 *  <= -2: 2 ringar (eagle)
 *  == -1: 1 ring  (birdie)
 *   ==  0: inget (par)
 *   == +1: 1 fyrkant (bogey)
 *  >= +2: 2 fyrkanter (double+)
 */
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
      {/* Nummer överst */}
      <span className="relative z-10 inline-block">{text}</span>
      {valid && diff !== null && (
        <>
          {/* Birdie & Eagle (ringar) */}
          {diff <= -2 && (
            <>
              <span className="pointer-events-none absolute inset-0 rounded-full border border-red-500" />
              <span className="pointer-events-none absolute -inset-0.5 rounded-full border border-red-500" />
            </>
          )}
          {diff === -1 && (
            <span className="pointer-events-none absolute inset-0 rounded-full border border-red-500" />
          )}

          {/* Bogey & Double bogey (fyrkanter, neutrala) */}
          {diff >= 2 && (
            <>
              <span className="pointer-events-none absolute inset-0 border border-slate-500" />
              <span className="pointer-events-none absolute -inset-0.5 border border-slate-500" />
            </>
          )}
          {diff === 1 && (
            <span className="pointer-events-none absolute inset-0 border border-slate-500" />
          )}
        </>
      )}
    </td>
  );
}
