import { Tour } from "../../types";
import { STORAGE_KEYS } from "./constants";

/**
 * Tour storage operations
 * Handles CRUD operations for tours in localStorage
 */

/**
 * Get all tours from localStorage
 */
export const getTours = (): Tour[] => {
  const tours = localStorage.getItem(STORAGE_KEYS.TOURS);
  return tours ? JSON.parse(tours) : [];
};

/**
 * Get a single tour by ID
 */
export const getTour = (id: string): Tour | null => {
  const tours = getTours();
  return tours.find((tour) => tour.id === id) || null;
};

/**
 * Save or update a tour in localStorage
 */
export const saveTour = (tour: Tour): void => {
  const tours = getTours();
  const existingIndex = tours.findIndex((t) => t.id === tour.id);

  if (existingIndex >= 0) {
    tours[existingIndex] = tour;
  } else {
    tours.push(tour);
  }

  localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
};

/**
 * Delete a tour by ID
 */
export const deleteTour = (id: string): void => {
  const tours = getTours().filter((tour) => tour.id !== id);
  localStorage.setItem(STORAGE_KEYS.TOURS, JSON.stringify(tours));
};
