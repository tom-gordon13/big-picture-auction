import axios from 'axios';
import * as cheerio from 'cheerio';

export interface BoxOfficeData {
  domestic: number;
  international: number;
  total: number;
}

/**
 * Converts a dollar string to a number
 * Example: "$534,987,076" -> 534987076
 */
function parseDollarAmount(dollarString: string): number {
  if (!dollarString) return 0;

  // Remove $, commas, and any whitespace
  const cleaned = dollarString.replace(/[$,\s]/g, '');

  // Parse to number
  const num = parseFloat(cleaned);

  return isNaN(num) ? 0 : num;
}

/**
 * Searches Box Office Mojo for a movie and returns the IMDb ID
 * @param title - The movie title to search for
 * @param year - Optional year to help filter results
 * @returns The IMDb ID (e.g., "tt0468569") or null if not found
 */
async function searchForMovie(title: string, year?: number): Promise<string | null> {
  try {
    const searchUrl = `https://www.boxofficemojo.com/search/?q=${encodeURIComponent(title)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // If year is provided, try to find a result that matches the year
    if (year) {
      const yearResults: Array<{ imdbId: string; element: cheerio.Element }> = [];

      $('a[href*="/title/tt"]').each((_, element) => {
        const $element = $(element);
        const href = $element.attr('href');
        if (!href) return;

        const match = href.match(/\/title\/(tt\d+)\//);
        if (!match) return;

        const imdbId = match[1];

        // Check if the year appears near this result
        const parent = $element.parent();
        const grandparent = parent.parent();
        const searchContext = grandparent.text() || parent.text();

        // Look for the year in the surrounding text
        if (searchContext.includes(year.toString())) {
          yearResults.push({ imdbId, element });
        }
      });

      // If we found results matching the year, return the first one
      if (yearResults.length > 0) {
        return yearResults[0].imdbId;
      }
    }

    // Fallback: Look for the first search result link
    // Links are in the format: /title/tt0468569/?ref_=bo_se_r_1
    const firstResult = $('a[href*="/title/tt"]').first();

    if (firstResult.length === 0) {
      return null;
    }

    const href = firstResult.attr('href');
    if (!href) return null;

    // Extract IMDb ID from href (e.g., /title/tt0468569/ -> tt0468569)
    const match = href.match(/\/title\/(tt\d+)\//);

    return match ? match[1] : null;
  } catch (error) {
    console.error(`Error searching for movie "${title}":`, error);
    return null;
  }
}

/**
 * Fetches box office data for a given IMDb ID
 * @param imdbId - The IMDb ID (e.g., "tt0468569")
 * @returns Box office data or null if not found
 */
async function fetchBoxOfficeByImdbId(imdbId: string): Promise<BoxOfficeData | null> {
  try {
    const url = `https://www.boxofficemojo.com/title/${imdbId}/`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const pageText = response.data;

    let domestic = 0;
    let international = 0;
    let total = 0;

    // Strategy 0: Parse from raw text using regex (most reliable)
    // Look for patterns like "Domestic (53%)\n  $534,987,076"
    // Extract all three values in sequence
    const boxOfficeSection = pageText.match(
      /Domestic\s*\([^)]+\)[^$]*?\$([0-9,]+)[^$]*?International\s*\([^)]+\)[^$]*?\$([0-9,]+)[^$]*?Worldwide[^$]*?\$([0-9,]+)/i
    );

    if (boxOfficeSection) {
      domestic = parseDollarAmount(boxOfficeSection[1]);
      international = parseDollarAmount(boxOfficeSection[2]);
      total = parseDollarAmount(boxOfficeSection[3]);
    }

    // If we got valid data from regex, return it
    if (total > 0 || domestic > 0) {
      // Calculate total if missing but we have components
      if (total === 0 && (domestic > 0 || international > 0)) {
        total = domestic + international;
      }
      return { domestic, international, total };
    }

    // Strategy 1: Look for summary money divs (common on newer pages)
    const moneyDivs = $('.mojo-summary-values .money');
    if (moneyDivs.length >= 2) {
      // Usually: Domestic, International, Worldwide
      moneyDivs.each((index, element) => {
        const value = parseDollarAmount($(element).text());
        if (index === 0) domestic = value;
        else if (index === 1) international = value;
        else if (index === 2) total = value;
      });

      // If we got valid data, return it
      if (total > 0) {
        return { domestic, international, total };
      }
    }

    // Strategy 2: Look for the "By Release" table
    // Find rows that contain "All Releases" or similar
    $('tr').each((_, row) => {
      const $row = $(row);
      const cells = $row.find('td');

      if (cells.length >= 3) {
        const rowText = $row.text();

        // Look for "All Releases" or the first release row with valid data
        if (rowText.includes('All Releases') || rowText.includes('Original Release')) {
          // Extract the last 3 cells (usually Domestic, International, Worldwide)
          const domesticCell = $(cells[cells.length - 3]).text();
          const internationalCell = $(cells[cells.length - 2]).text();
          const totalCell = $(cells[cells.length - 1]).text();

          const domesticValue = parseDollarAmount(domesticCell);
          const internationalValue = parseDollarAmount(internationalCell);
          const totalValue = parseDollarAmount(totalCell);

          // Only use if we got a valid total
          if (totalValue > 0) {
            domestic = domesticValue;
            international = internationalValue;
            total = totalValue;
            return false; // Break out of each loop
          }
        }
      }
    });

    // If we found valid data, return it
    if (total > 0) {
      return { domestic, international, total };
    }

    // Strategy 3: Look for specific summary labels
    $('span.money').each((_, element) => {
      const $element = $(element);
      const parent = $element.parent();
      const labelText = parent.text().toLowerCase();

      const value = parseDollarAmount($element.text());

      if (labelText.includes('domestic')) {
        domestic = value;
      } else if (labelText.includes('international')) {
        international = value;
      } else if (labelText.includes('worldwide')) {
        total = value;
      }
    });

    // Calculate total if we have domestic and international but no total
    if (total === 0 && (domestic > 0 || international > 0)) {
      total = domestic + international;
    }

    // Return data if we found anything
    if (total > 0 || domestic > 0) {
      return { domestic, international, total };
    }

    return null;
  } catch (error) {
    console.error(`Error fetching box office for IMDb ID "${imdbId}":`, error);
    return null;
  }
}

/**
 * Fetches box office data for a given movie title
 * @param title - The movie title (e.g., "The Dark Knight")
 * @param year - Optional year to help identify the correct movie
 * @returns Box office data with domestic, international, and total numbers
 */
export async function getBoxOfficeData(title: string, year?: number): Promise<BoxOfficeData | null> {
  try {
    // First, search for the movie to get its IMDb ID
    const imdbId = await searchForMovie(title, year);

    if (!imdbId) {
      console.log(`Movie "${title}"${year ? ` (${year})` : ''} not found on Box Office Mojo`);
      return null;
    }

    console.log(`Found IMDb ID for "${title}"${year ? ` (${year})` : ''}: ${imdbId}`);

    // Fetch box office data using the IMDb ID
    const data = await fetchBoxOfficeByImdbId(imdbId);

    return data;
  } catch (error) {
    console.error(`Error getting box office data for "${title}":`, error);
    return null;
  }
}
