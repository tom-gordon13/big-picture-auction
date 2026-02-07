/**
 * Manual Oscar Nomination Overrides
 *
 * This file contains manually verified Oscar nomination counts for movies
 * where automated scraping fails or returns incorrect data.
 *
 * These overrides take precedence over data from OMDb or other automated sources.
 *
 * Source: Official 2026 Oscar nominations from Academy of Motion Picture Arts and Sciences
 * https://www.pbs.org/newshour/arts/heres-a-full-list-of-2026-oscar-nominees
 */

export interface OscarOverride {
  title: string;
  year: number;
  nominations: number;
  /** Optional: Note explaining why this override exists */
  note?: string;
}

/**
 * Map of movie titles to their verified Oscar nomination counts
 * Key format: "MovieTitle|Year"
 */
export const oscarOverrides: Record<string, OscarOverride> = {
  // 2026 Oscars (for 2025 films)
  'One Battle After Another|2025': {
    title: 'One Battle After Another',
    year: 2025,
    nominations: 13,
    note: 'Paul Thomas Anderson film - 13 nominations at 98th Academy Awards'
  },
  'It Was Just An Accident|2025': {
    title: 'It Was Just An Accident',
    year: 2025,
    nominations: 2,
    note: '2 nominations at 98th Academy Awards'
  },
  'Avatar: Fire and Ash|2025': {
    title: 'Avatar: Fire and Ash',
    year: 2025,
    nominations: 2,
    note: '2 nominations at 98th Academy Awards'
  },
  'Hamnet|2025': {
    title: 'Hamnet',
    year: 2025,
    nominations: 6,
    note: '6 nominations at 98th Academy Awards'
  },
  'Sinners|2025': {
    title: 'Sinners',
    year: 2025,
    nominations: 16,
    note: 'Ryan Coogler film - Record-breaking 16 nominations at 98th Academy Awards'
  },
  'F1|2025': {
    title: 'F1',
    year: 2025,
    nominations: 4,
    note: '4 nominations at 98th Academy Awards'
  },
  'F1: The Movie|2025': {
    title: 'F1: The Movie',
    year: 2025,
    nominations: 4,
    note: '4 nominations at 98th Academy Awards (alternate title)'
  },
  'Marty Supreme|2025': {
    title: 'Marty Supreme',
    year: 2025,
    nominations: 6,
    note: '6 nominations at 98th Academy Awards'
  },
  'Sentimental Value|2025': {
    title: 'Sentimental Value',
    year: 2025,
    nominations: 7,
    note: '7 nominations at 98th Academy Awards'
  },
  'Jurassic World Rebirth|2025': {
    title: 'Jurassic World Rebirth',
    year: 2025,
    nominations: 1,
    note: '1 nomination at 98th Academy Awards'
  },
  'Weapons|2025': {
    title: 'Weapons',
    year: 2025,
    nominations: 1,
    note: '1 nomination at 98th Academy Awards'
  },
};

/**
 * Get the Oscar nomination count for a movie, checking overrides first
 * @param title - Movie title
 * @param year - Movie year
 * @returns Override data if it exists, null otherwise
 */
export function getOscarOverride(title: string, year?: number): OscarOverride | null {
  if (!year) return null;

  const key = `${title}|${year}`;
  return oscarOverrides[key] || null;
}

/**
 * Check if a movie has an override
 */
export function hasOscarOverride(title: string, year?: number): boolean {
  return getOscarOverride(title, year) !== null;
}
