import { useState } from "react";
import { Trophy, Plus, Minus, Gift } from "lucide-react";
import type {
  ScoringConfig,
  PointsDistributionEntry,
  TournamentScoringMethod,
} from "../../types";
import { DEFAULT_SCORING_CONFIG } from "../../types";

interface ScoringConfigStepProps {
  config: ScoringConfig;
  onChange: (config: ScoringConfig) => void;
  hasTeams: boolean;
}

export const ScoringConfigStep = ({
  config,
  onChange,
  hasTeams,
}: ScoringConfigStepProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleMethodChange = (method: TournamentScoringMethod) => {
    onChange({ ...config, method });
  };

  const handlePointsChange = (index: number, points: number) => {
    const updated = [...config.pointsDistribution];
    updated[index] = { ...updated[index], points: Math.max(0, points) };
    onChange({ ...config, pointsDistribution: updated });
  };

  const handleAddPosition = () => {
    const nextPosition = config.pointsDistribution.length + 1;
    onChange({
      ...config,
      pointsDistribution: [
        ...config.pointsDistribution,
        { position: nextPosition, points: 0 },
      ],
    });
  };

  const handleRemovePosition = () => {
    if (config.pointsDistribution.length <= 1) return;
    onChange({
      ...config,
      pointsDistribution: config.pointsDistribution.slice(0, -1),
    });
  };

  const handleBonusStrokesChange = (value: number) => {
    onChange({
      ...config,
      bonusStrokesForWinner: Math.max(0, Math.min(10, value)),
    });
  };

  const handleTeamPointsToggle = () => {
    onChange({ ...config, teamPointsEnabled: !config.teamPointsEnabled });
  };

  const handleResetDefaults = () => {
    onChange({ ...DEFAULT_SCORING_CONFIG });
  };

  return (
    <div className="space-y-6">
      {/* Scoring Method Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Scoring Method</h3>
        <p className="text-sm text-white/50">
          Choose how the tournament winner is determined across all rounds.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleMethodChange("total-score")}
            className={`relative flex items-start p-5 border-2 rounded-xl transition-all text-left w-full ${
              config.method === "total-score"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    config.method === "total-score"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-white/50"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold text-white">
                  Total Score (Default)
                </h4>
              </div>
              <p className="text-sm text-white/50 ml-12">
                Winner is determined by best cumulative score across all rounds
                (lowest strokes, highest Stableford, etc.)
              </p>
            </div>
            {config.method === "total-score" && (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleMethodChange("points-per-round")}
            className={`relative flex items-start p-5 border-2 rounded-xl transition-all text-left w-full ${
              config.method === "points-per-round"
                ? "border-emerald-500 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5"
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    config.method === "points-per-round"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/5 text-white/50"
                  }`}
                >
                  <Trophy className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-white">Points Per Round</h4>
              </div>
              <p className="text-sm text-white/50 ml-12">
                Players collect points based on their finishing position in each
                round. The player with the most points across all rounds wins.
              </p>
            </div>
            {config.method === "points-per-round" && (
              <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Points Distribution (only for points-per-round) */}
      {config.method === "points-per-round" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Points Distribution
            </h3>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Reset to defaults
            </button>
          </div>
          <p className="text-sm text-white/50">
            Set how many points each finishing position earns per round.
          </p>

          <div className="space-y-2">
            {config.pointsDistribution.map((entry, index) => (
              <div
                key={entry.position}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <div className="w-20 text-sm text-white/70 flex-shrink-0">
                  {index === 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">
                        {index === 0
                          ? "🥇"
                          : index === 1
                            ? "🥈"
                            : index === 2
                              ? "🥉"
                              : ""}
                      </span>
                      {getOrdinal(entry.position)}
                    </span>
                  ) : index <= 2 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-lg">
                        {index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : ""}
                      </span>
                      {getOrdinal(entry.position)}
                    </span>
                  ) : (
                    <span>{getOrdinal(entry.position)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() =>
                      handlePointsChange(index, entry.points - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0"
                    value={entry.points}
                    onChange={(e) =>
                      handlePointsChange(
                        index,
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-16 text-center input-field py-1.5 text-lg font-bold"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      handlePointsChange(index, entry.points + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <span className="text-sm text-white/40 ml-1">pts</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleAddPosition}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add position
            </button>
            {config.pointsDistribution.length > 1 && (
              <button
                type="button"
                onClick={handleRemovePosition}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition-colors"
              >
                <Minus className="w-4 h-4" />
                Remove last
              </button>
            )}
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-300">
              Players finishing below the last defined position receive 0
              points. Tied players share the points for their positions.
            </p>
          </div>

          {/* Team Points Toggle */}
          {hasTeams && (
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div>
                <h4 className="font-medium text-white">
                  Team Round Points
                </h4>
                <p className="text-sm text-white/50 mt-1">
                  Each player on the winning team earns individual points from
                  team round results.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTeamPointsToggle}
                className={`relative w-14 h-7 shrink-0 rounded-full transition-colors ${
                  config.teamPointsEnabled
                    ? "bg-emerald-500"
                    : "bg-white/20"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    config.teamPointsEnabled
                      ? "translate-x-8"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Bonus Strokes Section */}
      <div
        className="space-y-4"
      >
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Advanced Options
        </button>

        {showAdvanced && (
          <div className="space-y-4 pl-2 border-l-2 border-white/10">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white">
                    Bonus Strokes for Winner
                  </h4>
                  <p className="text-sm text-white/50 mt-1">
                    Award extra handicap strokes to the round winner that
                    they can use in the next round of the tournament.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-4">
              <button
                type="button"
                onClick={() =>
                  handleBonusStrokesChange(config.bonusStrokesForWinner - 1)
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="0"
                max="10"
                value={config.bonusStrokesForWinner}
                onChange={(e) =>
                  handleBonusStrokesChange(parseInt(e.target.value) || 0)
                }
                className="w-16 text-center input-field py-1.5 text-lg font-bold"
              />

              <button
                type="button"
                onClick={() =>
                  handleBonusStrokesChange(config.bonusStrokesForWinner + 1)
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>

              <span className="text-sm text-white/40">
                extra stroke{config.bonusStrokesForWinner !== 1 ? "s" : ""}
              </span>
            </div>

            {config.bonusStrokesForWinner > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg ml-4">
                <p className="text-sm text-amber-300">
                  The winner of each round will receive{" "}
                  {config.bonusStrokesForWinner} extra stroke
                  {config.bonusStrokesForWinner !== 1 ? "s" : ""} applied as
                  handicap strokes on the next round in this tournament.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
