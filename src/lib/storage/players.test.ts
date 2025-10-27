import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateStrokesForHole,
  addPlayerToTour,
  updatePlayerScore,
  removePlayerFromTour,
  updatePlayerInTour,
} from './players';
import { getTour, saveTour } from './tours';
import { createMockTour, createMockPlayer, createMockRound } from '@/test/fixtures';

// Mock tour and round storage
vi.mock('./tours', () => ({
  getTour: vi.fn(),
  saveTour: vi.fn(),
}));

describe('calculateStrokesForHole', () => {
  it('should return 0 when playerHandicap is 0', () => {
    expect(calculateStrokesForHole(0, 5)).toBe(0);
  });

  it('should return 0 when holeHandicap is 0', () => {
    expect(calculateStrokesForHole(18, 0)).toBe(0);
  });

  it('should calculate 1 stroke for handicap 10 on hole handicap 5', () => {
    // Handicap 10: floor(10/18) = 0 base, 10%18 = 10 remaining
    // Hole handicap 5 <= 10 remaining, so gets 1 stroke
    expect(calculateStrokesForHole(10, 5)).toBe(1);
  });

  it('should calculate 0 strokes for handicap 10 on hole handicap 15', () => {
    // Handicap 10: floor(10/18) = 0 base, 10%18 = 10 remaining
    // Hole handicap 15 > 10 remaining, so gets 0 strokes
    expect(calculateStrokesForHole(10, 15)).toBe(0);
  });

  it('should calculate 2 strokes for handicap 20 on hole handicap 2', () => {
    // Handicap 20: floor(20/18) = 1 base, 20%18 = 2 remaining
    // Hole handicap 2 <= 2 remaining, so gets 1+1 = 2 strokes
    expect(calculateStrokesForHole(20, 2)).toBe(2);
  });

  it('should calculate 1 stroke for handicap 20 on hole handicap 10', () => {
    // Handicap 20: floor(20/18) = 1 base, 20%18 = 2 remaining
    // Hole handicap 10 > 2 remaining, so gets 1+0 = 1 stroke
    expect(calculateStrokesForHole(20, 10)).toBe(1);
  });

  it('should calculate correct strokes for handicap 36', () => {
    // Handicap 36: floor(36/18) = 2 base, 36%18 = 0 remaining
    // All holes get 2 strokes
    expect(calculateStrokesForHole(36, 1)).toBe(2);
    expect(calculateStrokesForHole(36, 10)).toBe(2);
    expect(calculateStrokesForHole(36, 18)).toBe(2);
  });

  it('should calculate correct strokes for high handicap', () => {
    // Handicap 54: floor(54/18) = 3 base, 54%18 = 0 remaining
    expect(calculateStrokesForHole(54, 1)).toBe(3);
    expect(calculateStrokesForHole(54, 18)).toBe(3);
  });

  it('should handle edge case of handicap 18', () => {
    // Handicap 18: floor(18/18) = 1 base, 18%18 = 0 remaining
    expect(calculateStrokesForHole(18, 1)).toBe(1);
    expect(calculateStrokesForHole(18, 18)).toBe(1);
  });

  it('should distribute strokes correctly for handicap 5', () => {
    // Handicap 5: 0 base, 5 remaining
    // Holes 1-5 get 1 stroke, holes 6-18 get 0 strokes
    expect(calculateStrokesForHole(5, 1)).toBe(1);
    expect(calculateStrokesForHole(5, 5)).toBe(1);
    expect(calculateStrokesForHole(5, 6)).toBe(0);
    expect(calculateStrokesForHole(5, 18)).toBe(0);
  });
});

describe('Player Storage Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('addPlayerToTour', () => {
    it('should add a player to a tour', () => {
      const tour = createMockTour();
      const player = createMockPlayer({ name: 'John Doe', handicap: 12 });

      vi.mocked(getTour).mockReturnValue(tour);

      addPlayerToTour(tour.id, player);

      expect(getTour).toHaveBeenCalledWith(tour.id);
      expect(tour.players).toContainEqual(player);
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should do nothing if tour does not exist', () => {
      const player = createMockPlayer();
      vi.mocked(getTour).mockReturnValue(null);

      addPlayerToTour('non-existent', player);

      expect(saveTour).not.toHaveBeenCalled();
    });
  });

  describe('updatePlayerScore', () => {
    it('should update player score correctly', () => {
      const player = createMockPlayer({ handicap: 0 });
      const round = createMockRound({
        holes: 9,
        holeInfo: Array.from({ length: 9 }, (_, i) => ({
          number: i + 1,
          par: 4,
          handicap: i + 1,
          yardage: 400,
        })),
      });
      const tour = createMockTour({
        players: [player],
        rounds: [round],
      });

      vi.mocked(getTour).mockReturnValue(tour);

      const scores = [4, 5, 3, 4, 6, 4, 5, 4, 3]; // 38 total, par 36

      updatePlayerScore(tour.id, round.id, player.id, scores);

      expect(round.scores[player.id]).toBeDefined();
      expect(round.scores[player.id].totalScore).toBe(38);
      expect(round.scores[player.id].totalToPar).toBe(2); // 38 - 36
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should calculate handicap strokes when enabled', () => {
      const player = createMockPlayer({ handicap: 18 });
      const round = createMockRound({
        holes: 18,
        settings: {
          strokesGiven: true,
        },
      });
      const tour = createMockTour({
        players: [player],
        rounds: [round],
      });

      vi.mocked(getTour).mockReturnValue(tour);

      const scores = Array(18).fill(5); // All bogeys

      updatePlayerScore(tour.id, round.id, player.id, scores);

      expect(round.scores[player.id].handicapStrokes).toBe(18); // 1 stroke per hole
      expect(round.scores[player.id].netScore).toBe(90 - 18); // 72
    });

    it('should do nothing if tour does not exist', () => {
      vi.mocked(getTour).mockReturnValue(null);

      updatePlayerScore('non-existent', 'round-id', 'player-id', [4, 5, 3]);

      expect(saveTour).not.toHaveBeenCalled();
    });

    it('should do nothing if round does not exist', () => {
      const tour = createMockTour();
      vi.mocked(getTour).mockReturnValue(tour);

      updatePlayerScore(tour.id, 'non-existent', 'player-id', [4, 5, 3]);

      expect(saveTour).not.toHaveBeenCalled();
    });

    it('should do nothing if player does not exist', () => {
      const round = createMockRound();
      const tour = createMockTour({ rounds: [round] });
      vi.mocked(getTour).mockReturnValue(tour);

      updatePlayerScore(tour.id, round.id, 'non-existent', [4, 5, 3]);

      expect(saveTour).not.toHaveBeenCalled();
    });
  });

  describe('removePlayerFromTour', () => {
    it('should remove a player from tour', () => {
      const player1 = createMockPlayer({ name: 'Player 1' });
      const player2 = createMockPlayer({ name: 'Player 2' });
      const tour = createMockTour({
        players: [player1, player2],
      });

      vi.mocked(getTour).mockReturnValue(tour);

      removePlayerFromTour(tour.id, player1.id);

      expect(tour.players).toHaveLength(1);
      expect(tour.players[0].id).toBe(player2.id);
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should remove player from teams', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();
      const tour = createMockTour({
        format: 'team',
        players: [player1, player2],
        teams: [
          { id: 'team1', name: 'Team 1', captainId: 'captain1', color: '#3b82f6', playerIds: [player1.id, player2.id] },
        ],
      });

      vi.mocked(getTour).mockReturnValue(tour);

      removePlayerFromTour(tour.id, player1.id);

      expect(tour.teams![0].playerIds).toEqual([player2.id]);
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should do nothing if tour does not exist', () => {
      vi.mocked(getTour).mockReturnValue(null);

      removePlayerFromTour('non-existent', 'player-id');

      expect(saveTour).not.toHaveBeenCalled();
    });
  });

  describe('updatePlayerInTour', () => {
    it('should update player information', () => {
      const player = createMockPlayer({ name: 'Original Name', handicap: 10 });
      const tour = createMockTour({
        players: [player],
      });

      vi.mocked(getTour).mockReturnValue(tour);

      const updatedPlayer = { ...player, name: 'Updated Name', handicap: 15 };

      updatePlayerInTour(tour.id, updatedPlayer);

      expect(tour.players[0].name).toBe('Updated Name');
      expect(tour.players[0].handicap).toBe(15);
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should do nothing if player not found', () => {
      const tour = createMockTour();
      vi.mocked(getTour).mockReturnValue(tour);

      const player = createMockPlayer();

      updatePlayerInTour(tour.id, player);

      expect(tour.players).toHaveLength(0);
      expect(saveTour).toHaveBeenCalledWith(tour);
    });

    it('should do nothing if tour does not exist', () => {
      vi.mocked(getTour).mockReturnValue(null);

      updatePlayerInTour('non-existent', createMockPlayer());

      expect(saveTour).not.toHaveBeenCalled();
    });
  });
});
