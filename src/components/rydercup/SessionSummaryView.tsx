import { useMemo } from "react";
import { MatchPlayRound } from "../../types/matchplay";
import { Tour } from "@/types";

interface SessionSummaryViewProps {
  rounds: Tour["rounds"];
  players: Tour["players"];
  teamAName: string;
  teamBName: string;
  teamAColor?: string;
  teamBColor?: string;
}

interface RoundGroup {
  roundId: string;
  roundName: string;
  formatSections: {
    format: string;
    formatName: string;
    matches: MatchPlayRound[];
    teamAPoints: number;
    teamBPoints: number;
  }[];
  roundTotalA: number;
  roundTotalB: number;
}

export const SessionSummaryView = ({
  rounds,
  players,
  teamAName,
  teamBName,
  teamAColor = "#1e40af",
  teamBColor = "#dc2626",
}: SessionSummaryViewProps) => {
  // Helper functions
  const getFormatName = (format: string): string => {
    switch (format) {
      case "foursomes":
        return "Foursomes";
      case "four-ball":
        return "Four-Ball";
      case "singles":
        return "Singles";
      default:
        return format.charAt(0).toUpperCase() + format.slice(1);
    }
  };

  const getFormatIcon = (type: string) => {
    switch (type) {
      case "foursomes":
        return "🔄";
      case "four-ball":
        return "⭐";
      case "singles":
        return "👤";
      default:
        return "🏌️";
    }
  };

  const getPlayerNames = (playerIds: string[]) =>
    playerIds
      .map((id) => players.find((p) => p.id === id)?.name || "Unknown")
      .join(" & ");

  // Group matches by round and format
  const roundGroups = useMemo(() => {
    const groups: RoundGroup[] = [];

    rounds.forEach((round) => {
      if (!round.ryderCup?.matches || round.ryderCup.matches.length === 0) {
        return;
      }

      const matches = round.ryderCup.matches;

      // Group matches by format within this round
      const formatMap = new Map<string, MatchPlayRound[]>();

      matches.forEach((match) => {
        const format = match.format;
        if (!formatMap.has(format)) {
          formatMap.set(format, []);
        }
        formatMap.get(format)!.push(match);
      });

      // Create format sections
      const formatSections = Array.from(formatMap.entries()).map(
        ([format, matches]) => {
          const teamAPoints = matches.reduce(
            (sum, m) => sum + (m.points?.teamA || 0),
            0
          );
          const teamBPoints = matches.reduce(
            (sum, m) => sum + (m.points?.teamB || 0),
            0
          );

          return {
            format,
            formatName: getFormatName(format),
            matches,
            teamAPoints,
            teamBPoints,
          };
        }
      );

      const roundTotalA = formatSections.reduce(
        (sum, s) => sum + s.teamAPoints,
        0
      );
      const roundTotalB = formatSections.reduce(
        (sum, s) => sum + s.teamBPoints,
        0
      );

      groups.push({
        roundId: round.id,
        roundName: round.name,
        formatSections,
        roundTotalA,
        roundTotalB,
      });
    });

    return groups;
  }, [rounds]);

  return (
    <div className="space-y-6">
      {roundGroups.map((group) => (
        <div key={group.roundId} className="card-elevated -mx-4">
          {/* Round Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {group.roundName}
              </h3>
              <p className="text-sm text-slate-600">
                {group.formatSections.reduce(
                  (sum, s) => sum + s.matches.length,
                  0
                )}{" "}
                {group.formatSections.reduce(
                  (sum, s) => sum + s.matches.length,
                  0
                ) === 1
                  ? "match"
                  : "matches"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Round Total</div>
              <div className="flex items-center gap-3 mt-1">
                <div
                  className="px-3 py-1 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: teamAColor }}
                >
                  {group.roundTotalA.toFixed(1)}
                </div>
                <span className="text-slate-400">-</span>
                <div
                  className="px-3 py-1 rounded-lg font-semibold text-white"
                  style={{ backgroundColor: teamBColor }}
                >
                  {group.roundTotalB.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Format Sections */}
          <div className="space-y-4">
            {group.formatSections.map((section, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getFormatIcon(section.format)}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {section.formatName}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {section.matches.length}{" "}
                        {section.matches.length === 1 ? "match" : "matches"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Match Results */}
                <div className="space-y-2">
                  {section.matches.map((match) => {
                    const isCompleted = match.status === "completed";
                    const winner =
                      match.result === "team-a"
                        ? teamAName
                        : match.result === "team-b"
                        ? teamBName
                        : null;
                    const isHalved = match.result === "tie";

                    // Calculate holes completed for in-progress matches
                    const holesCompleted =
                      !isCompleted && match.holes
                        ? match.holes.filter(
                            (hole) => hole.teamAScore > 0 || hole.teamBScore > 0
                          ).length
                        : 0;

                    return (
                      <div
                        key={match.id}
                        className="bg-white rounded-lg p-3 border border-slate-200"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-slate-800">
                              {getPlayerNames(match.teamA.playerIds)}
                            </div>
                            <div className="text-sm text-slate-600">vs</div>
                            <div className="text-sm font-medium text-slate-800">
                              {getPlayerNames(match.teamB.playerIds)}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {isCompleted ? (
                              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                Complete
                              </span>
                            ) : (
                              <>
                                <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                  In Progress
                                </span>
                                {holesCompleted < 18 && (
                                  <span className="text-xs text-slate-600 font-medium">
                                    Thru {holesCompleted}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Points and Result */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <div
                                className="text-base font-bold"
                                style={{ color: teamAColor }}
                              >
                                {match.points.teamA}
                              </div>
                              <div className="text-xs text-slate-500">pts</div>
                            </div>
                            <span className="text-slate-400 text-sm">-</span>
                            <div className="text-center">
                              <div
                                className="text-base font-bold"
                                style={{ color: teamBColor }}
                              >
                                {match.points.teamB}
                              </div>
                              <div className="text-xs text-slate-500">pts</div>
                            </div>
                          </div>

                          {winner && (
                            <div className="text-xs font-semibold text-emerald-600">
                              {winner} wins
                            </div>
                          )}
                          {isHalved && (
                            <div className="text-xs font-semibold text-slate-600">
                              Halved
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {roundGroups.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No matches have been played yet
        </div>
      )}
    </div>
  );
};
