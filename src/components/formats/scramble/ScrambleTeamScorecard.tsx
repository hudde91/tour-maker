import React from "react";
import { Team, Tour, Round, HoleInfo } from "../../../types";

interface ScrambleTeamScorecardProps {
  team: Team;
  tour: Tour;
  round: Round;
  currentHole: number;
  holeInfo: HoleInfo;
  currentScore: number;
  onScoreChange: (score: number) => void;
}

export const ScrambleTeamScorecard: React.FC<ScrambleTeamScorecardProps> = ({
  team,
  tour,
  round,
  currentHole,
  holeInfo,
  currentScore,
  onScoreChange,
}) => {
  // Compute team handicap from players (per-round strokes preferred)
  const teamPlayers = tour.players.filter((p) => team.playerIds.includes(p.id));
  const playerHandicaps = teamPlayers
    .map((p) => {
      const rs = round.scores?.[p.id];
      return (rs?.handicapStrokes ?? p.handicap ?? 0) as number;
    })
    .sort((a, b) => a - b); // ascending: [A(low), B, C, D]

  let teamHcp = 0;
  if (playerHandicaps.length >= 4) {
    teamHcp = Math.round(
      playerHandicaps[0] * 0.25 +
        playerHandicaps[1] * 0.2 +
        playerHandicaps[2] * 0.15 +
        playerHandicaps[3] * 0.1
    );
  } else if (playerHandicaps.length === 3) {
    teamHcp = Math.round(
      playerHandicaps[0] * 0.3 +
        playerHandicaps[1] * 0.2 +
        playerHandicaps[2] * 0.1
    );
  } else if (playerHandicaps.length === 2) {
    teamHcp = Math.round(playerHandicaps[0] * 0.35 + playerHandicaps[1] * 0.15);
  } else if (playerHandicaps.length === 1) {
    teamHcp = Math.round(playerHandicaps[0] * 0.35);
  }

  const holesCount = round.holes || round.holeInfo?.length || 18;
  const base = Math.floor(teamHcp / holesCount);
  const rem = teamHcp % holesCount;
  const si = holeInfo?.handicap || 0; // 1..n (1 hardest)
  const alloc = base + (si > 0 && si <= rem ? 1 : 0);

  const par = holeInfo?.par || 4;
  const gross = currentScore > 0 ? currentScore : 0;

  const holeStableford = (() => {
    if (!gross) return 0;
    const net = gross - alloc;
    const diff = net - par;
    let pts = 2 - diff;
    if (pts < 0) pts = 0;
    if (pts > 6) pts = 6;
    return pts;
  })();

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="font-semibold text-slate-900">{team.name}</div>
        </div>
        <div className="text-xs text-slate-500">
          Scramble • Hole {currentHole}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {/* Current hole info */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
            <div className="text-2xl font-bold text-slate-900">{par}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Par
            </div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
            <div className="text-2xl font-bold text-slate-900">{si || "-"}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              SI
            </div>
          </div>
          <div className="p-3 rounded-lg border border-slate-200 bg-white text-center">
            <div className="text-2xl font-bold text-slate-900">{alloc}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Team HCP on Hole
            </div>
          </div>
        </div>

        {/* Score controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-md border border-slate-300"
              onClick={() =>
                onScoreChange(Math.max(0, (currentScore || 0) - 1))
              }
            >
              −
            </button>
            <input
              className="w-16 text-center border border-slate-300 rounded-md py-2"
              type="number"
              min={0}
              value={currentScore || ""}
              onChange={(e) => onScoreChange(Number(e.target.value) || 0)}
              inputMode="numeric"
              pattern="[0-9]*"
            />
            <button
              className="px-3 py-2 rounded-md border border-slate-300"
              onClick={() => onScoreChange((currentScore || 0) + 1)}
            >
              +
            </button>
          </div>

          {/* Stableford for the hole */}
          <div className="p-3 rounded-lg border border-slate-200 bg-white text-center min-w-[120px]">
            <div className="text-2xl font-bold text-slate-900">
              {holeStableford}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">
              Stableford (Hole)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
