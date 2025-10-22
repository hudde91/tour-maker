import { useMemo } from "react";
import { MatchPlayRound } from "../../types/matchplay";

interface SessionSummaryViewProps {
  matches: MatchPlayRound[];
  teamAName: string;
  teamBName: string;
  teamAColor?: string;
  teamBColor?: string;
}

interface SessionGroup {
  day: number;
  dayName: string;
  sessions: {
    type: string;
    name: string;
    matches: MatchPlayRound[];
    teamAPoints: number;
    teamBPoints: number;
  }[];
}

export const SessionSummaryView = ({
  matches,
  teamAName,
  teamBName,
  teamAColor = "#1e40af",
  teamBColor = "#dc2626",
}: SessionSummaryViewProps) => {
  // Group matches by day and session
  const sessionGroups = useMemo(() => {
    const groups: SessionGroup[] = [];

    // Helper to determine session info
    const getSessionInfo = (format: string) => {
      switch (format) {
        case "foursomes":
          return { type: "foursomes", name: "Foursomes", icon: "🔄" };
        case "four-ball":
          return { type: "four-ball", name: "Four-Ball", icon: "⭐" };
        case "singles":
          return { type: "singles", name: "Singles", icon: "👤" };
        default:
          return { type: format, name: format, icon: "🏌️" };
      }
    };

    // Organize matches by format (simplified grouping)
    const foursomesMatches = matches.filter((m) => m.format === "foursomes");
    const fourBallMatches = matches.filter((m) => m.format === "four-ball");
    const singlesMatches = matches.filter((m) => m.format === "singles");

    // Create session groups based on what exists
    let dayCounter = 1;

    if (foursomesMatches.length > 0 || fourBallMatches.length > 0) {
      // Day 1
      const day1Sessions = [];

      if (foursomesMatches.slice(0, 4).length > 0) {
        const sessionMatches = foursomesMatches.slice(0, 4);
        const teamAPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamA || 0),
          0
        );
        const teamBPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamB || 0),
          0
        );
        day1Sessions.push({
          type: "foursomes",
          name: "Morning Foursomes",
          matches: sessionMatches,
          teamAPoints,
          teamBPoints,
        });
      }

      if (fourBallMatches.slice(0, 4).length > 0) {
        const sessionMatches = fourBallMatches.slice(0, 4);
        const teamAPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamA || 0),
          0
        );
        const teamBPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamB || 0),
          0
        );
        day1Sessions.push({
          type: "four-ball",
          name: "Afternoon Four-Ball",
          matches: sessionMatches,
          teamAPoints,
          teamBPoints,
        });
      }

      if (day1Sessions.length > 0) {
        groups.push({
          day: dayCounter++,
          dayName: "Friday",
          sessions: day1Sessions,
        });
      }
    }

    if (
      foursomesMatches.length > 4 ||
      fourBallMatches.length > 4 ||
      singlesMatches.length === 0
    ) {
      // Day 2
      const day2Sessions = [];

      if (foursomesMatches.slice(4, 8).length > 0) {
        const sessionMatches = foursomesMatches.slice(4, 8);
        const teamAPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamA || 0),
          0
        );
        const teamBPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamB || 0),
          0
        );
        day2Sessions.push({
          type: "foursomes",
          name: "Morning Foursomes",
          matches: sessionMatches,
          teamAPoints,
          teamBPoints,
        });
      }

      if (fourBallMatches.slice(4, 8).length > 0) {
        const sessionMatches = fourBallMatches.slice(4, 8);
        const teamAPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamA || 0),
          0
        );
        const teamBPoints = sessionMatches.reduce(
          (sum, m) => sum + (m.points?.teamB || 0),
          0
        );
        day2Sessions.push({
          type: "four-ball",
          name: "Afternoon Four-Ball",
          matches: sessionMatches,
          teamAPoints,
          teamBPoints,
        });
      }

      if (day2Sessions.length > 0) {
        groups.push({
          day: dayCounter++,
          dayName: "Saturday",
          sessions: day2Sessions,
        });
      }
    }

    if (singlesMatches.length > 0) {
      // Day 3 (Singles)
      const teamAPoints = singlesMatches.reduce(
        (sum, m) => sum + (m.points?.teamA || 0),
        0
      );
      const teamBPoints = singlesMatches.reduce(
        (sum, m) => sum + (m.points?.teamB || 0),
        0
      );

      groups.push({
        day: dayCounter++,
        dayName: "Sunday",
        sessions: [
          {
            type: "singles",
            name: "Singles Matches",
            matches: singlesMatches,
            teamAPoints,
            teamBPoints,
          },
        ],
      });
    }

    return groups;
  }, [matches]);

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

  return (
    <div className="space-y-6">
      {sessionGroups.map((group) => (
        <div key={group.day} className="card-elevated">
          {/* Day Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Day {group.day}
              </h3>
              <p className="text-sm text-slate-600">{group.dayName}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Day Total</div>
              <div className="flex items-center gap-3 mt-1">
                <div
                  className="px-3 py-1 rounded-full font-semibold text-white"
                  style={{ backgroundColor: teamAColor }}
                >
                  {group.sessions
                    .reduce((sum, s) => sum + s.teamAPoints, 0)
                    .toFixed(1)}
                </div>
                <span className="text-slate-400">-</span>
                <div
                  className="px-3 py-1 rounded-full font-semibold text-white"
                  style={{ backgroundColor: teamBColor }}
                >
                  {group.sessions
                    .reduce((sum, s) => sum + s.teamBPoints, 0)
                    .toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Sessions */}
          <div className="space-y-4">
            {group.sessions.map((session, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 bg-slate-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {getFormatIcon(session.type)}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">
                        {session.name}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {session.matches.length}{" "}
                        {session.matches.length === 1 ? "match" : "matches"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1 rounded-lg font-semibold text-white text-sm"
                      style={{ backgroundColor: teamAColor }}
                    >
                      {session.teamAPoints.toFixed(1)}
                    </div>
                    <span className="text-slate-400 text-sm">-</span>
                    <div
                      className="px-3 py-1 rounded-lg font-semibold text-white text-sm"
                      style={{ backgroundColor: teamBColor }}
                    >
                      {session.teamBPoints.toFixed(1)}
                    </div>
                  </div>
                </div>

                {/* Match Results */}
                <div className="space-y-2">
                  {session.matches.map((match) => {
                    const isCompleted = match.status === "completed";
                    const isTeamAWinner =
                      match.result === "teamA" ||
                      (match.points?.teamA || 0) > (match.points?.teamB || 0);
                    const isTeamBWinner =
                      match.result === "teamB" ||
                      (match.points?.teamB || 0) > (match.points?.teamA || 0);
                    const isHalved = match.result === "halved";

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between bg-white rounded px-3 py-2 text-sm"
                      >
                        <div className="flex-1">
                          {match.teamA.playerIds.length > 1 ? "●" : "○"} Match{" "}
                          {session.matches.indexOf(match) + 1}
                        </div>
                        <div className="text-right">
                          {isCompleted ? (
                            <span
                              className={`font-semibold ${
                                isHalved
                                  ? "text-slate-600"
                                  : isTeamAWinner
                                  ? "text-emerald-600"
                                  : "text-blue-600"
                              }`}
                            >
                              {isHalved
                                ? "Halved"
                                : isTeamAWinner
                                ? teamAName
                                : teamBName}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">
                              In Progress
                            </span>
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

      {sessionGroups.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No sessions have been completed yet
        </div>
      )}
    </div>
  );
};
