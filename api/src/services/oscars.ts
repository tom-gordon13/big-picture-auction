import axios from 'axios';

/**
 * OMDb API Service for Oscar Nominations
 *
 * This service uses the OMDb API (Open Movie Database) to fetch Oscar nomination data.
 *
 * Setup Instructions:
 * 1. Get a free API key from: http://www.omdbapi.com/apikey.aspx
 * 2. Add OMDB_API_KEY to your .env file
 *
 * Example .env:
 * OMDB_API_KEY=your_api_key_here
 */

interface OMDbResponse {
  Title: string;
  Year: string;
  Awards: string;
  Response: string;
  Error?: string;
}

/**
 * Parses the Awards string from OMDb to extract Oscar nomination count
 * Examples:
 * - "Won 2 Oscars. 8 nominations." -> 8
 * - "Won 1 Oscar. Another 43 wins & 143 nominations." -> 1 (only counts explicit Oscar noms)
 * - "Nominated for 8 Oscars. Another 43 wins & 143 nominations." -> 8
 */
function parseOscarNominations(awards: string): number {
  if (!awards || awards === 'N/A') return 0;

  // Pattern 1: "Nominated for X Oscar(s)"
  const nominatedMatch = awards.match(/Nominated for (\d+) Oscars?/i);
  if (nominatedMatch) {
    return parseInt(nominatedMatch[1], 10);
  }

  // Pattern 2: "Won X Oscar(s). Y nominations." means Y total nominations
  // This includes both wins and nominations
  const wonWithNominationsMatch = awards.match(/Won (\d+) Oscars?\.\s*(\d+) nominations/i);
  if (wonWithNominationsMatch) {
    return parseInt(wonWithNominationsMatch[2], 10);
  }

  // Pattern 3: "Won X Oscar(s)" without explicit nomination count
  // In this case, X is the number of nominations that won
  const wonOnlyMatch = awards.match(/Won (\d+) Oscars?/i);
  if (wonOnlyMatch) {
    return parseInt(wonOnlyMatch[1], 10);
  }

  return 0;
}

/**
 * Fetches Oscar nomination count for a given movie title
 * @param title - The movie title (e.g., "The Dark Knight")
 * @param year - Optional year to narrow down search (e.g., 2008)
 * @returns The number of Oscar nominations, or null if movie not found
 */
export async function getOscarNominations(
  title: string,
  year?: number
): Promise<number | null> {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    console.error(
      'OMDB_API_KEY not found in environment variables. ' +
      'Get a free API key from http://www.omdbapi.com/apikey.aspx'
    );
    return null;
  }

  try {
    const params: Record<string, string> = {
      apikey: apiKey,
      t: title,
      type: 'movie',
    };

    if (year) {
      params.y = year.toString();
    }

    const response = await axios.get<OMDbResponse>('http://www.omdbapi.com/', {
      params,
      timeout: 10000,
    });

    const data = response.data;

    if (data.Response === 'False') {
      console.log(`Movie "${title}" not found: ${data.Error}`);
      return null;
    }

    const nominations = parseOscarNominations(data.Awards);

    console.log(`"${data.Title}" (${data.Year}): ${data.Awards}`);

    return nominations;
  } catch (error) {
    console.error(`Error fetching Oscar nominations for "${title}":`, error);
    return null;
  }
}

/**
 * Fetches detailed awards information for a given movie
 * @param title - The movie title
 * @param year - Optional year
 * @returns The full awards string from OMDb
 */
export async function getAwardsInfo(
  title: string,
  year?: number
): Promise<string | null> {
  const apiKey = process.env.OMDB_API_KEY;

  if (!apiKey) {
    console.error('OMDB_API_KEY not found in environment variables.');
    return null;
  }

  try {
    const params: Record<string, string> = {
      apikey: apiKey,
      t: title,
      type: 'movie',
    };

    if (year) {
      params.y = year.toString();
    }

    const response = await axios.get<OMDbResponse>('http://www.omdbapi.com/', {
      params,
      timeout: 10000,
    });

    const data = response.data;

    if (data.Response === 'False') {
      return null;
    }

    return data.Awards;
  } catch (error) {
    console.error(`Error fetching awards info for "${title}":`, error);
    return null;
  }
}
