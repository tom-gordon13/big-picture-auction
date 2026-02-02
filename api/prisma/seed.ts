import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { batchGetIMDbMovieData } from '../src/services/imdb';

// Load environment variables
dotenv.config();

// Use DATABASE_URL from environment, or fall back to local connection string
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/big_picture_auction?schema=public';

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const playerList = {
  FENNESSY: { firstName: 'Sean', lastName: 'Fennessy' },
  DOBBINS: { firstName: 'Amanda', lastName: 'Dobbins' },
  RYAN: { firstName: 'Chris', lastName: 'Ryan' },
};

const movieTitles = [
  'The Odyssey',
  'Toy Story 5',
  "Narnia",
  'Digger',
  'Jack of Spades',
  'Dune: Part 3',
  'Project Hail Mary',
  'The Social Reckoning',
  'Verity',
  'The Mandalorian & Grogu',
  'Wuthering Heights',
  'Resident Evil',
  'The Devil Wears Prada 2',
  'The Adventures of Cliff Booth',
  'Disclosure Day',
] as const;

type MovieTitle = typeof movieTitles[number];

interface MoviePick {
  title: MovieTitle;
  price: number;
}

const moviePicks: Record<string, MoviePick[]> = {
  [playerList.FENNESSY.lastName]: [
    { title: 'The Odyssey', price: 926 },
    { title: 'Toy Story 5', price: 1 },
    { title: 'Narnia', price: 18 },
    { title: 'Digger', price: 5 },
    { title: 'Jack of Spades', price: 50 }
  ],
  [playerList.DOBBINS.lastName]: [
    { title: 'Dune: Part 3', price: 775 },
    { title: 'Project Hail Mary', price: 200 },
    { title: 'The Social Reckoning', price: 1 },
    { title: 'Verity', price: 5 },
    { title: 'The Mandalorian & Grogu', price: 19 }
  ],
  [playerList.RYAN.lastName]: [
    { title: 'Wuthering Heights', price: 75 },
    { title: 'Resident Evil', price: 72 },
    { title: 'The Devil Wears Prada 2', price: 26 },
    { title: 'The Adventures of Cliff Booth', price: 76 },
    { title: 'Disclosure Day', price: 72 }
  ],
};

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Database Seed with IMDb Data                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Check for OMDb API key
  if (!process.env.OMDB_API_KEY) {
    console.warn('⚠ WARNING: OMDB_API_KEY not set in environment variables.');
    console.warn('  Movie posters and genres will not be fetched from IMDb.');
    console.warn('  Get a free API key from: http://www.omdbapi.com/apikey.aspx\n');
  }

  console.log('Step 1: Clearing existing data...');
  // Clear existing data (in reverse order of dependencies)
  await prisma.movieStats.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.playerAuction.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.studio.deleteMany();
  await prisma.player.deleteMany();
  console.log('✓ Cleared existing data\n');

  console.log('Step 2: Creating studios...');
  // Create Studios
  const studios = await Promise.all([
    prisma.studio.create({
      data: {
        name: 'Warner Bros',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Warner_Bros_logo.svg',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Universal Pictures',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Universal_Pictures_logo.svg',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Paramount Pictures',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Paramount_Pictures_logo.svg',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Disney',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/da/The_Walt_Disney_Company_Logo.svg',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Sony Pictures',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Sony_Pictures_Entertainment_Logo.svg',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Legendary Pictures',
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Legendary_Pictures_logo.svg',
      },
    }),
  ]);
  console.log(`✓ Created ${studios.length} studios\n`);

  console.log('Step 3: Creating players...');
  // Create Players
  const players = await Promise.all([
    prisma.player.create({
      data: playerList.FENNESSY,
    }),
    prisma.player.create({
      data: playerList.DOBBINS,
    }),
    prisma.player.create({
      data: playerList.RYAN,
    }),
  ]);
  console.log(`✓ Created ${players.length} players\n`);

  console.log('Step 4: Fetching IMDb data for movies...');
  // Fetch IMDb data for all movies
  const imdbDataMap = await batchGetIMDbMovieData(movieTitles);
  console.log('');

  console.log('Step 5: Creating movies with IMDb data...');
  // Create Movies with IMDb data
  const movies = await Promise.all(
    movieTitles.map(async (title, index) => {
      const imdbData = imdbDataMap.get(title);

      // Assign studios in a round-robin fashion
      const studioIndex = index % studios.length;

      // For unreleased movies, set anticipated release date
      // Movies are spread across 2026
      const anticipatedDate = new Date(2026, (index % 12), 15);

      const movieData = {
        title: title,
        budget: 100000000 + (index * 20000000), // Vary budgets
        director: null, // We could fetch this from OMDb too if needed
        anticipatedReleaseDate: anticipatedDate,
        genre: imdbData?.genre || 'Drama', // Default to Drama if no genre found
        posterUrl: imdbData?.posterUrl || null,
        status: 'announced',
        studioId: studios[studioIndex].id,
      };

      console.log(`  Creating: "${title}"${imdbData ? ' (with IMDb data)' : ''}`);

      return prisma.movie.create({
        data: movieData,
      });
    })
  );
  console.log(`✓ Created ${movies.length} movies\n`);

  console.log('Step 6: Creating auction...');
  // Create Auction
  const auction2026Winter = await prisma.auction.create({
    data: {
      name: '2026 Winter Auction',
      year: 2026,
      cycle: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      budgetPerPlayer: 1000,
      status: 'active',
    },
  });
  console.log(`✓ Created auction: ${auction2026Winter.name}\n`);

  console.log('Step 7: Creating player auctions...');
  // Create Player Auctions
  const playerAuctions = await Promise.all(
    players.map((player) =>
      prisma.playerAuction.create({
        data: {
          playerId: player.id,
          auctionId: auction2026Winter.id,
          remainingBudget: 1000,
          totalSpent: 0,
          totalPoints: 0,
        },
      })
    )
  );
  console.log(`✓ Created ${playerAuctions.length} player auctions\n`);

  console.log('Step 8: Creating picks based on moviePicks configuration...');
  // Create Picks based on the moviePicks configuration
  const picks: any[] = [];

  // Map player names to player objects
  const playersByLastName: Record<string, typeof players[0]> = {
    [playerList.FENNESSY.lastName]: players[0],
    [playerList.DOBBINS.lastName]: players[1],
    [playerList.RYAN.lastName]: players[2],
  };

  // Create picks for each player
  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks)) {
    const player = playersByLastName[playerLastName];

    console.log(`  ${player.firstName} ${player.lastName}:`);

    for (const { title: movieTitle, price } of pickedMovies) {
      const movie = movies.find(m => m.title === movieTitle);

      if (!movie) {
        console.error(`    ✗ Movie "${movieTitle}" not found!`);
        continue;
      }

      const pick = await prisma.pick.create({
        data: {
          playerId: player.id,
          movieId: movie.id,
          auctionId: auction2026Winter.id,
          purchaseAmount: price,
        },
      });

      picks.push(pick);
      console.log(`    ✓ Picked "${movieTitle}" for $${price}`);
    }
  }
  console.log(`✓ Created ${picks.length} picks\n`);

  console.log('Step 9: Updating player auction budgets...');
  // Update player auction budgets based on actual spending
  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks)) {
    const player = playersByLastName[playerLastName];
    const totalSpent = pickedMovies.reduce((sum, pick) => sum + pick.price, 0);
    const remainingBudget = 1000 - totalSpent;

    await prisma.playerAuction.update({
      where: {
        playerId_auctionId: {
          playerId: player.id,
          auctionId: auction2026Winter.id,
        },
      },
      data: {
        totalSpent: totalSpent,
        remainingBudget: remainingBudget,
      },
    });

    console.log(`  ${player.firstName} ${player.lastName}: Spent $${totalSpent}, Remaining $${remainingBudget}`);
  }
  console.log('✓ Updated player auction budgets\n');

  console.log('═══════════════════════════════════════════════════════');
  console.log('✓ Database seed completed successfully!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\nSummary:`);
  console.log(`  Studios: ${studios.length}`);
  console.log(`  Players: ${players.length}`);
  console.log(`  Movies: ${movies.length}`);
  console.log(`  Picks: ${picks.length}`);
  console.log(`  Auction: ${auction2026Winter.name}`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('\n✗ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
