import { computeSips } from "../../lib/sipsUtils";

interface SipsBadgeProps {
  score: number | null | undefined;
  par: number;
  /** "compact" = small inline pill; "prominent" = larger callout under the player header. */
  variant?: "compact" | "prominent";
}

/**
 * Visual drinking penalty for a single hole, used by Irish Drunk Golf rounds.
 * Renders nothing if no score is entered.
 */
export const SipsBadge = ({
  score,
  par,
  variant = "compact",
}: SipsBadgeProps) => {
  if (score == null || score <= 0) return null;
  const result = computeSips(score, par);

  if (variant === "prominent") {
    return (
      <div
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${result.bg} ${result.text} text-sm font-semibold`}
      >
        <span className="text-base">{result.emoji}</span>
        <span>
          {result.label}
          {result.finishBeer
            ? null
            : result.sips > 0
              ? ` — drink ${result.sips} sip${result.sips === 1 ? "" : "s"}`
              : result.sipsToGive > 0
                ? ` — hand out ${result.sipsToGive} sip${result.sipsToGive === 1 ? "" : "s"}`
                : null}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${result.bg} ${result.text}`}
      title={result.label}
    >
      <span>{result.emoji}</span>
      <span>
        {result.finishBeer
          ? "Finish beer"
          : result.sips > 0
            ? `${result.sips} sip${result.sips === 1 ? "" : "s"}`
            : result.sipsToGive > 0
              ? `Hand out ${result.sipsToGive}`
              : "Free pass"}
      </span>
    </span>
  );
};
