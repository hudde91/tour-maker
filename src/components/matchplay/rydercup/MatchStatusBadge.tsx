import { getMatchStatus } from "../../../lib/uiMatchPlay";

type Props = {
  match: any;
  totalHoles?: number; // optional override, defaults to 18
  className?: string;
};

export default function MatchStatusBadge({
  match,
  totalHoles = 18,
  className = "",
}: Props) {
  const { text, code } = getMatchStatus(match, totalHoles);
  const base =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
  const palette =
    code === "complete"
      ? "bg-green-600 text-white"
      : code === "dormie"
      ? "bg-amber-600 text-white"
      : code === "in-progress"
      ? "bg-blue-600 text-white"
      : "bg-gray-500 text-white";

  return <span className={`${base} ${palette} ${className}`}>{text}</span>;
}
