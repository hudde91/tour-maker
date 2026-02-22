import { useMemo } from "react";
import HoleScoreCell from "./HoleScoreCell";

export default function PlayerScoreGrid9({
  title,
  start,
  pars,
  si,
  scores,
  holesCount,
}: {
  title: string;
  start: number;
  pars: number[];
  si: number[];
  scores: (number | null)[];
  holesCount: number;
}) {
  const end = Math.min(start + 9, holesCount);
  const idx = useMemo(
    () => Array.from({ length: end - start }, (_, i) => start + i),
    [start, end]
  );

  const subtotalPar = useMemo(
    () => idx.reduce((a, i) => a + (pars[i] ?? 0), 0),
    [idx, pars]
  );
  const subtotalStrokes = useMemo(
    () =>
      idx.reduce(
        (a, i) => {
          const score = scores[i];
          // Count numeric scores, skip 0 (not played)
          return typeof score === "number" && score > 0 ? a + score : a;
        },
        0
      ),
    [idx, scores]
  );

  return (
    <div className="rounded-xl border bg-white/5 shadow-sm">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-white/50">
          Subtotal:{" "}
          <span className="font-semibold">{subtotalStrokes || "—"}</span> / Par{" "}
          <span className="font-semibold">{subtotalPar}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="m-2 w-full min-w-[560px] md:min-w-0 text-center">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-white/40">
              <th className="px-2 py-2 text-left">Hole</th>
              {idx.map((i) => (
                <th key={`h-${i}`} className="px-2 py-2 font-medium">
                  {i + 1}
                </th>
              ))}
              <th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-sm">
              <td className="px-2 py-2 text-left text-white/40">Par</td>
              {idx.map((i) => (
                <td key={`par-${i}`} className="px-2 py-2">
                  {pars[i]}
                </td>
              ))}
              <td className="px-2 py-2 text-right font-semibold">
                {subtotalPar}
              </td>
            </tr>
            <tr className="text-sm">
              <td className="px-2 py-2 text-left text-white/40">Index</td>
              {idx.map((i) => (
                <td key={`si-${i}`} className="px-2 py-2">
                  {si[i]}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-white/30">—</td>
            </tr>
            <tr className="text-sm">
              <td className="px-2 py-2 text-left font-medium text-white">
                Strokes
              </td>
              {idx.map((i) => (
                <HoleScoreCell
                  key={`sc-${i}`}
                  score={scores[i]}
                  par={pars[i]}
                />
              ))}
              <td className="px-2 py-2 text-right font-semibold">
                {subtotalStrokes || "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
