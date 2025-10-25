import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTours,
  getTour,
  saveTour,
  deleteTour,
  updateTourDetails,
  toggleTourArchive,
  updateTourFormat,
} from './tours';
import { createMockTour } from '@/test/fixtures';

describe('Tour Storage Operations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTours', () => {
    it('should return empty array when no tours exist', () => {
      expect(getTours()).toEqual([]);
    });

    it('should return all tours from localStorage', () => {
      const tour1 = createMockTour({ name: 'Tour 1' });
      const tour2 = createMockTour({ name: 'Tour 2' });

      localStorage.setItem('golf-tours', JSON.stringify([tour1, tour2]));

      const tours = getTours();
      expect(tours).toHaveLength(2);
      expect(tours[0].name).toBe('Tour 1');
      expect(tours[1].name).toBe('Tour 2');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('golf-tours', 'invalid json');
      expect(() => getTours()).toThrow();
    });
  });

  describe('getTour', () => {
    it('should return null when tour does not exist', () => {
      expect(getTour('non-existent')).toBeNull();
    });

    it('should return the correct tour by ID', () => {
      const tour1 = createMockTour({ name: 'Tour 1' });
      const tour2 = createMockTour({ name: 'Tour 2' });

      localStorage.setItem('golf-tours', JSON.stringify([tour1, tour2]));

      const result = getTour(tour2.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(tour2.id);
      expect(result!.name).toBe('Tour 2');
    });
  });

  describe('saveTour', () => {
    it('should save a new tour to localStorage', () => {
      const tour = createMockTour({ name: 'New Tour' });

      saveTour(tour);

      const tours = getTours();
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe(tour.id);
      expect(tours[0].name).toBe('New Tour');
    });

    it('should update an existing tour', () => {
      const tour = createMockTour({ name: 'Original Name' });
      saveTour(tour);

      tour.name = 'Updated Name';
      saveTour(tour);

      const tours = getTours();
      expect(tours).toHaveLength(1);
      expect(tours[0].name).toBe('Updated Name');
    });

    it('should maintain other tours when updating', () => {
      const tour1 = createMockTour({ name: 'Tour 1' });
      const tour2 = createMockTour({ name: 'Tour 2' });

      saveTour(tour1);
      saveTour(tour2);

      tour1.name = 'Updated Tour 1';
      saveTour(tour1);

      const tours = getTours();
      expect(tours).toHaveLength(2);
      expect(tours.find((t) => t.id === tour1.id)!.name).toBe('Updated Tour 1');
      expect(tours.find((t) => t.id === tour2.id)!.name).toBe('Tour 2');
    });
  });

  describe('deleteTour', () => {
    it('should delete a tour by ID', () => {
      const tour1 = createMockTour({ name: 'Tour 1' });
      const tour2 = createMockTour({ name: 'Tour 2' });

      saveTour(tour1);
      saveTour(tour2);

      deleteTour(tour1.id);

      const tours = getTours();
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe(tour2.id);
    });

    it('should do nothing if tour does not exist', () => {
      const tour = createMockTour();
      saveTour(tour);

      deleteTour('non-existent');

      const tours = getTours();
      expect(tours).toHaveLength(1);
    });

    it('should handle deleting from empty storage', () => {
      deleteTour('non-existent');
      expect(getTours()).toEqual([]);
    });
  });

  describe('updateTourDetails', () => {
    it('should update tour name and description', () => {
      const tour = createMockTour({ name: 'Original', description: 'Old desc' });
      saveTour(tour);

      const updated = updateTourDetails(tour.id, 'New Name', 'New description');

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New description');

      const stored = getTour(tour.id);
      expect(stored!.name).toBe('New Name');
      expect(stored!.description).toBe('New description');
    });

    it('should update name without description', () => {
      const tour = createMockTour({ name: 'Original' });
      saveTour(tour);

      const updated = updateTourDetails(tour.id, 'New Name');

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBeUndefined();
    });

    it('should throw error if tour not found', () => {
      expect(() => updateTourDetails('non-existent', 'New Name')).toThrow(
        'Tour not found'
      );
    });
  });

  describe('toggleTourArchive', () => {
    it('should archive a tour', () => {
      const tour = createMockTour({ archived: false });
      saveTour(tour);

      const updated = toggleTourArchive(tour.id);

      expect(updated.archived).toBe(true);
      expect(getTour(tour.id)!.archived).toBe(true);
    });

    it('should unarchive a tour', () => {
      const tour = createMockTour({ archived: true });
      saveTour(tour);

      const updated = toggleTourArchive(tour.id);

      expect(updated.archived).toBe(false);
      expect(getTour(tour.id)!.archived).toBe(false);
    });

    it('should throw error if tour not found', () => {
      expect(() => toggleTourArchive('non-existent')).toThrow('Tour not found');
    });
  });

  describe('updateTourFormat', () => {
    it('should update tour format', () => {
      const tour = createMockTour({ format: 'individual' });
      saveTour(tour);

      const updated = updateTourFormat(tour.id, 'team');

      expect(updated.format).toBe('team');
      expect(getTour(tour.id)!.format).toBe('team');
    });

    it('should throw error if tour not found', () => {
      expect(() => updateTourFormat('non-existent', 'team')).toThrow(
        'Tour not found'
      );
    });
  });
});
