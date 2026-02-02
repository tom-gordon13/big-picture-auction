import { getOscarNominations, getAwardsInfo } from './oscars';

// npx tsx src/services/test-oscars.ts

/**
 * IMPORTANT: Before running this test, you need to:
 * 1. Get a free API key from http://www.omdbapi.com/apikey.aspx
 * 2. Add it to your .env file as: OMDB_API_KEY=your_api_key_here
 * 3. Restart your terminal or reload environment variables
 */

async function test() {
  console.log('Testing Oscar Nominations Service...\n');
  console.log('Make sure you have OMDB_API_KEY set in your .env file!\n');

  const moviesToTest = [
    { title: 'The Dark Knight', year: 2008 },
    { title: 'Inception', year: 2010 },
    { title: 'The Godfather', year: 1972 },
    { title: 'Avatar', year: 2009 },
    { title: 'Pulp Fiction', year: 1994 },
    { title: 'The Odyssey' }, // Unlikely to have Oscar noms
  ];

  for (const movie of moviesToTest) {
    console.log(`\nTesting: "${movie.title}"${movie.year ? ` (${movie.year})` : ''}`);

    const nominations = await getOscarNominations(movie.title, movie.year);
    const awards = await getAwardsInfo(movie.title, movie.year);

    if (nominations !== null) {
      console.log(`Oscar Nominations: ${nominations}`);
      console.log(`Full Awards: ${awards}`);
    } else {
      console.log('No data found');
    }
  }
}

test().catch(console.error);
