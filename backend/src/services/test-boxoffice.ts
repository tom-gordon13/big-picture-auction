import { getBoxOfficeData } from './boxoffice';

// npx tsx src/services/test-boxoffice.ts

async function test() {
  console.log('Testing Box Office Service...\n');

  const moviesToTest = [
    'The Dark Knight',
    'Inception',
    'The Godfather',
    'Avatar',
    'The Odyssey',
    'This Movie Does Not Exist',
  ];

  for (const movie of moviesToTest) {
    console.log(`\nTesting: "${movie}"`);
    const data = await getBoxOfficeData(movie);

    if (data) {
      console.log(`Domestic: $${data.domestic.toLocaleString()}`);
      console.log(`International: $${data.international.toLocaleString()}`);
      console.log(`Total: $${data.total.toLocaleString()}`);
    } else {
      console.log('No data found');
    }
  }
}

test().catch(console.error);
