import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TourFormat } from "../../types";
import { createMockTournament, MockTournamentOptions } from "../../lib/mockDataGenerator";

interface CreateMockDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateMockDataDialog = ({
  isOpen,
  onClose,
}: CreateMockDataDialogProps) => {
  const navigate = useNavigate();
  const [options, setOptions] = useState<MockTournamentOptions>({
    playerCount: 12,
    format: 'individual',
    roundCount: 3,
    completedRounds: 1,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const tour = createMockTournament(options);
      onClose();
      // Navigate to the new tournament
      navigate(`/tour/${tour.id}`);
    } catch (error) {
      console.error('Failed to generate mock data:', error);
      alert('Failed to generate mock tournament');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-xl shadow-2xl border border-white/10 mx-4 max-h-[90vh] overflow-y-auto" style={{ background: "rgba(15, 23, 42, 0.95)" }}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 sticky top-0" style={{ background: "rgba(15, 23, 42, 0.98)" }}>
          <div>
            <h2 className="text-xl font-bold text-white">
              Generate Mock Tournament
            </h2>
            <p className="text-white/50 mt-1 text-sm">
              Create test data with random players and scores
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/30 hover:text-white/50 hover:bg-white/10 rounded-full transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Player Count */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Number of Players: {options.playerCount}
            </label>
            <input
              type="range"
              min="4"
              max="32"
              step="1"
              value={options.playerCount}
              onChange={(e) =>
                setOptions({ ...options, playerCount: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>4 players</span>
              <span>32 players</span>
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Tournament Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOptions({ ...options, format: 'individual' })}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  options.format === 'individual'
                    ? 'border-blue-600 bg-blue-500/15 text-blue-400'
                    : 'border-white/10 text-white/70 hover:border-white/15'
                }`}
              >
                Individual
              </button>
              <button
                onClick={() => setOptions({ ...options, format: 'team' })}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  options.format === 'team'
                    ? 'border-blue-600 bg-blue-500/15 text-blue-400'
                    : 'border-white/10 text-white/70 hover:border-white/15'
                }`}
              >
                Team
              </button>
              <button
                onClick={() => setOptions({ ...options, format: 'ryder-cup' })}
                className={`px-4 py-3 rounded-lg border-2 font-medium text-sm transition-all ${
                  options.format === 'ryder-cup'
                    ? 'border-blue-600 bg-blue-500/15 text-blue-400'
                    : 'border-white/10 text-white/70 hover:border-white/15'
                }`}
              >
                Ryder Cup
              </button>
            </div>
          </div>

          {/* Round Count */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Total Rounds: {options.roundCount}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={options.roundCount}
              onChange={(e) =>
                setOptions({
                  ...options,
                  roundCount: parseInt(e.target.value),
                  completedRounds: Math.min(
                    options.completedRounds,
                    parseInt(e.target.value)
                  ),
                })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>1 round</span>
              <span>5 rounds</span>
            </div>
          </div>

          {/* Completed Rounds */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Completed Rounds: {options.completedRounds}
            </label>
            <input
              type="range"
              min="0"
              max={options.roundCount}
              step="1"
              value={options.completedRounds}
              onChange={(e) =>
                setOptions({
                  ...options,
                  completedRounds: parseInt(e.target.value),
                })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>None</span>
              <span>All</span>
            </div>
            {options.completedRounds < options.roundCount && (
              <p className="text-xs text-white/40 mt-2">
                {options.roundCount - options.completedRounds} round(s) will be in progress
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/15 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 text-sm text-blue-400">
                <p className="font-semibold mb-1">What will be generated:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-300">
                  <li>{options.playerCount} players with random names and handicaps</li>
                  <li>{options.roundCount} rounds with 18 holes each</li>
                  <li>Random scores for all completed rounds</li>
                  <li>Partial scores for in-progress rounds</li>
                  <li>Random "Closest to Pin" and "Longest Drive" winners</li>
                  {(options.format === 'team' || options.format === 'ryder-cup') && (
                    <li>Teams with player assignments</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/15 text-white/70 rounded-lg hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isGenerating ? 'Generating...' : 'Generate Tournament'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
