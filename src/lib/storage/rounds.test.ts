import { describe, it, expect, beforeEach } from 'vitest';
import { saveRound, getTotalPar, startRound, completeRound } from './rounds';
import { getTour, saveTour } from './tours';
import {
  createMockTour,
  createMockRound,
  createMockPlayer,
  createMockTeam,
} from '@/test/fixtures';

describe('Round Storage Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveRound', () => {
    it('should add a new round to a tour', () => {
      const tour = createMockTour();
      saveTour(tour);

      const round = createMockRound();
      saveRound(tour.id, round);

      const updated = getTour(tour.id);
      expect(updated!.rounds).toHaveLength(1);
      expect(updated!.rounds[0].id).toBe(round.id);
    });

    it('should update an existing round', () => {
      const round = createMockRound({ holes: 18 });
      const tour = createMockTour({ rounds: [round] });
      saveTour(tour);

      round.holes = 9;
      saveRound(tour.id, round);

      const updated = getTour(tour.id);
      expect(updated!.rounds).toHaveLength(1);
      expect(updated!.rounds[0].holes).toBe(9);
    });

    it('should do nothing if tour does not exist', () => {
      const round = createMockRound();
      saveRound('non-existent', round);

      expect(getTours()).toEqual([]);
    });

    it('should maintain other rounds when updating', () => {
      const round1 = createMockRound();
      const round2 = createMockRound();
      const tour = createMockTour({ rounds: [round1, round2] });
      saveTour(tour);

      round1.holes = 9;
      saveRound(tour.id, round1);

      const updated = getTour(tour.id);
      expect(updated!.rounds).toHaveLength(2);
      expect(updated!.rounds.find((r) => r.id === round1.id)!.holes).toBe(9);
      expect(updated!.rounds.find((r) => r.id === round2.id)!.holes).toBe(18);
    });
  });

  describe('getTotalPar', () => {
    it('should calculate total par from hole info', () => {
      const round = createMockRound({
        holes: 9,
        holeInfo: [
          { hole: 1, par: 4, handicap: 1, yardage: 400 },
          { hole: 2, par: 3, handicap: 2, yardage: 150 },
          { hole: 3, par: 5, handicap: 3, yardage: 500 },
          { hole: 4, par: 4, handicap: 4, yardage: 400 },
          { hole: 5, par: 4, handicap: 5, yardage: 400 },
          { hole: 6, par: 3, handicap: 6, yardage: 150 },
          { hole: 7, par: 5, handicap: 7, yardage: 500 },
          { hole: 8, par: 4, handicap: 8, yardage: 400 },
          { hole: 9, par: 4, handicap: 9, yardage: 400 },
        ],
      });

      expect(getTotalPar(round)).toBe(36); // 4+3+5+4+4+3+5+4+4
    });

    it('should use totalPar if available', () => {
      const round = createMockRound({
        totalPar: 72,
        holeInfo: [], // Empty, should use totalPar instead
      });

      expect(getTotalPar(round)).toBe(72);
    });

    it('should calculate standard 18-hole par', () => {
      const round = createMockRound({ holes: 18 });

      expect(getTotalPar(round)).toBe(72); // Default fixture creates par 72
    });
  });

  describe('startRound', () => {
    it('should change round status from created to in-progress', () => {
      const round = createMockRound({ status: 'created' });
      const tour = createMockTour({ rounds: [round] });
      saveTour(tour);

      startRound(tour.id, round.id);

      const updated = getTour(tour.id);
      expect(updated!.rounds[0].status).toBe('in-progress');
      expect(updated!.rounds[0].startedAt).toBeDefined();
    });

    it('should initialize player scores for individual format', () => {
      const player1 = createMockPlayer();
      const player2 = createMockPlayer();
      const round = createMockRound({
        format: 'stroke-play',
        status: 'created',
        holes: 9,
      });
      const tour = createMockTour({
        format: 'individual',
        players: [player1, player2],
        rounds: [round],
      });
      saveTour(tour);

      startRound(tour.id, round.id);

      const updated = getTour(tour.id);
      const updatedRound = updated!.rounds[0];

      expect(updatedRound.scores[player1.id]).toBeDefined();
      expect(updatedRound.scores[player2.id]).toBeDefined();
      expect(updatedRound.scores[player1.id].scores).toHaveLength(9);
      expect(updatedRound.scores[player1.id].totalScore).toBe(0);
    });

    it('should initialize team scores for scramble format', () => {
      const team1 = createMockTeam({ name: 'Team 1' });
      const team2 = createMockTeam({ name: 'Team 2' });
      const round = createMockRound({
        format: 'scramble',
        status: 'created',
        holes: 18,
      });
      const tour = createMockTour({
        format: 'team',
        teams: [team1, team2],
        rounds: [round],
      });
      saveTour(tour);

      startRound(tour.id, round.id);

      const updated = getTour(tour.id);
      const updatedRound = updated!.rounds[0];

      expect(updatedRound.scores[`team_${team1.id}`]).toBeDefined();
      expect(updatedRound.scores[`team_${team2.id}`]).toBeDefined();
      expect(updatedRound.scores[`team_${team1.id}`].scores).toHaveLength(18);
      expect(updatedRound.scores[`team_${team1.id}`].isTeamScore).toBe(true);
    });

    it('should not start round if already in-progress', () => {
      const round = createMockRound({ status: 'in-progress' });
      const tour = createMockTour({ rounds: [round] });
      saveTour(tour);

      const beforeStart = getTour(tour.id);
      startRound(tour.id, round.id);
      const afterStart = getTour(tour.id);

      expect(afterStart!.rounds[0].status).toBe('in-progress');
      expect(beforeStart!.rounds[0]).toEqual(afterStart!.rounds[0]);
    });

    it('should do nothing if tour does not exist', () => {
      startRound('non-existent', 'round-id');
      expect(getTours()).toEqual([]);
    });

    it('should do nothing if round does not exist', () => {
      const tour = createMockTour();
      saveTour(tour);

      startRound(tour.id, 'non-existent');

      expect(getTour(tour.id)!.rounds).toHaveLength(0);
    });
  });

  describe('completeRound', () => {
    it('should change round status from in-progress to completed', () => {
      const round = createMockRound({ status: 'in-progress' });
      const tour = createMockTour({ rounds: [round] });
      saveTour(tour);

      completeRound(tour.id, round.id);

      const updated = getTour(tour.id);
      expect(updated!.rounds[0].status).toBe('completed');
      expect(updated!.rounds[0].completedAt).toBeDefined();
    });

    it('should not complete round if not in-progress', () => {
      const round = createMockRound({ status: 'created' });
      const tour = createMockTour({ rounds: [round] });
      saveTour(tour);

      completeRound(tour.id, round.id);

      const updated = getTour(tour.id);
      expect(updated!.rounds[0].status).toBe('created');
      expect(updated!.rounds[0].completedAt).toBeUndefined();
    });

    it('should do nothing if tour does not exist', () => {
      completeRound('non-existent', 'round-id');
      expect(getTours()).toEqual([]);
    });

    it('should do nothing if round does not exist', () => {
      const tour = createMockTour();
      saveTour(tour);

      completeRound(tour.id, 'non-existent');

      expect(getTour(tour.id)!.rounds).toHaveLength(0);
    });
  });
});

// Import getTours for testing
import { getTours } from './tours';
