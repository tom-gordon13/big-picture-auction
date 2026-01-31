import axios from 'axios';
import * as cheerio from 'cheerio';

export interface MetacriticScore {
  score: string;
  reviewCount?: number;
  sentiment?: string;
}

/**
 * Converts a movie title to a Metacritic URL slug
 * Example: "The Odyssey" -> "the-odyssey"
 */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Fetches the Metacritic score for a given movie title
 * @param title - The movie title (e.g., "The Odyssey")
 * @returns The Metacritic score or "N/A" if not found/not scored
 */
export async function getMetacriticScore(title: string): Promise<string> {
  try {
    const slug = titleToSlug(title);
    const url = `https://www.metacritic.com/movie/${slug}/`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    // Parse HTML
    const $ = cheerio.load(response.data);

    // Look for JSON-LD structured data
    const scriptTags = $('script[type="application/ld+json"]');

    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = $(scriptTags[i]).html();
      if (!scriptContent) continue;

      try {
        const jsonData = JSON.parse(scriptContent);

        // Check if this is a Movie schema with aggregateRating
        if (jsonData['@type'] === 'Movie' && jsonData.aggregateRating) {
          const ratingValue = jsonData.aggregateRating.ratingValue;
          const reviewCount = jsonData.aggregateRating.reviewCount;

          // If ratingValue is null or undefined, return N/A
          if (ratingValue === null || ratingValue === undefined) {
            return 'N/A';
          }

          // If ratingValue is 0 and reviewCount is less than 4, it's TBD
          if (ratingValue === 0 && reviewCount < 4) {
            return 'N/A';
          }

          // Otherwise, return the score
          return String(ratingValue);
        }
      } catch (parseError) {
        // Continue to next script tag if JSON parsing fails
        continue;
      }
    }

    // If we got here, either there's no score or it's TBD
    return 'N/A';
  } catch (error) {
    // Handle 404 or network errors
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        return 'N/A'; // Movie not found
      }
    }

    // For other errors, log and return N/A
    console.error(`Error fetching Metacritic score for "${title}":`, error);
    return 'N/A';
  }
}

/**
 * Fetches detailed Metacritic information for a given movie title
 * @param title - The movie title
 * @returns Detailed score information or null if not found
 */
export async function getMetacriticScoreDetails(
  title: string
): Promise<MetacriticScore | null> {
  try {
    const slug = titleToSlug(title);
    const url = `https://www.metacritic.com/movie/${slug}/`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const scriptTags = $('script[type="application/ld+json"]');

    for (let i = 0; i < scriptTags.length; i++) {
      const scriptContent = $(scriptTags[i]).html();
      if (!scriptContent) continue;

      try {
        const jsonData = JSON.parse(scriptContent);

        if (jsonData['@type'] === 'Movie' && jsonData.aggregateRating) {
          const rating = jsonData.aggregateRating;

          // If ratingValue is null or undefined, return null
          if (rating.ratingValue === null || rating.ratingValue === undefined) {
            return null;
          }

          // If ratingValue is 0 and reviewCount is less than 4, it's TBD
          if (rating.ratingValue === 0 && rating.reviewCount < 4) {
            return null;
          }

          return {
            score: String(rating.ratingValue),
            reviewCount: rating.reviewCount,
            sentiment: rating.name,
          };
        }
      } catch (parseError) {
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error fetching Metacritic details for "${title}":`, error);
    return null;
  }
}
