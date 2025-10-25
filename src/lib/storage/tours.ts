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

/**
 * Update tour name and description
 */
export const updateTourDetails = (
  id: string,
  name: string,
  description?: string
): Tour => {
  const tour = getTour(id);
  if (!tour) {
    throw new Error("Tour not found");
  }

  tour.name = name;
  tour.description = description;
  saveTour(tour);
  return tour;
};

/**
 * Archive or unarchive a tour
 */
export const toggleTourArchive = (id: string): Tour => {
  const tour = getTour(id);
  if (!tour) {
    throw new Error("Tour not found");
  }

  tour.archived = !tour.archived;
  saveTour(tour);
  return tour;
};

/**
 * Update tour format
 * WARNING: Changing format may affect existing rounds and teams
 */
export const updateTourFormat = (
  id: string,
  format: Tour["format"]
): Tour => {
  const tour = getTour(id);
  if (!tour) {
    throw new Error("Tour not found");
  }

  tour.format = format;
  saveTour(tour);
  return tour;
};
