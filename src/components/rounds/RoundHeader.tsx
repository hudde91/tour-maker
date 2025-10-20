import { Tour, Round } from "../../types";
import { FormatConfig } from "../../lib/roundFormatManager";
import { PageHeader } from "../ui/PageHeader";

interface RoundHeaderProps {
  tour: Tour;
  round: Round;
  formatConfig: FormatConfig;
  onCompleteRound: () => void;
}

export const RoundHeader = ({
  tour,
  round,
  formatConfig,
  onCompleteRound,
}: RoundHeaderProps) => {
  const breadcrumbs = [
    { label: "Home", path: "/", icon: "🏠" },
    { label: tour.name, path: `/tour/${tour.id}`, icon: "⛳" },
    { label: "Rounds", path: `/tour/${tour.id}/rounds`, icon: "📋" },
    { label: round.name, icon: "🏌️" },
  ];

  return (
    <>
      <PageHeader
        title={round.name}
        subtitle={`${round.courseName} • ${formatConfig.displayName}`}
        breadcrumbs={breadcrumbs}
        backPath={`/tour/${tour.id}/rounds`}
        actions={
          round.status === "in-progress" && (
            <button
              onClick={onCompleteRound}
              className="flex items-center gap-2 bg-emerald-600 bg-opacity-80 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-medium transition-all hover:bg-opacity-90 text-sm shadow-lg"
            >
              <span className="text-base">🏁</span>
              <span className="hidden sm:inline">Complete Round</span>
            </button>
          )
        }
      />
    </>
  );
};
