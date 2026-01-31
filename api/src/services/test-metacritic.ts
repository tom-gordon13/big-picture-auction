import { getMetacriticScore, getMetacriticScoreDetails } from './metacritic';

async function test() {
  // Replace these with any movie titles you want to test
  const moviesToTest = [
    'The Godfather',
    'The Odyssey',
    'Inception',
    'The Dark Knight',
    'Pulp Fiction',
    'This Movie Does Not Exist',
  ];

  for (const movie of moviesToTest) {
    console.log(`\nTesting: "${movie}"`);
    const score = await getMetacriticScore(movie);
    console.log(`Score: ${score}`);

    if (score !== 'N/A') {
      const details = await getMetacriticScoreDetails(movie);
      console.log(`Details:`, details);
    }
  }
}

test().catch(console.error);
