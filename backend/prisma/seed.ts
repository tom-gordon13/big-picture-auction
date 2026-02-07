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

// 2025 Movies
const movieTitles2025 = [
  // Cycle 1 movies
  'Mission: Impossible - The Final Reckoning',
  '28 Years Later',
  'A Big Bold Beautiful Journey',
  'One Battle After Another',
  'Eddington',
  'M3gan 2.0',
  'F1: The Movie',
  'The Phoenician Scheme',
  'Marty Supreme',
  'Opus',
  'Sinners',
  'Highest 2 Lowest',
  'Jurassic World Rebirth',
  'Sentimental Value',
  'The Running Man',
  // Cycle 2 movies
  'Avatar: Fire and Ash',
  'Superman',
  'Hamnet',
  'It Was Just An Accident',
  'Predator: Badlands',
  'After The Hunt',
  'Roofman',
  'Jay Kelly',
  'A House of Dynamite',
  'Downton Abbey: The Grand Finale',
  'Ballad of a Small Player',
  'Weapons',
  'Is This Thing On?',
  "Now You See Me: Now You Don't",
  'Springsteen: Deliver Me From Nowhere',
] as const;

// 2026 Movies
const movieTitles2026 = [
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

type MovieTitle2025 = typeof movieTitles2025[number];
type MovieTitle2026 = typeof movieTitles2026[number];

interface MoviePick2025 {
  title: MovieTitle2025;
  price: number;
  cycle: number;
}

interface MoviePick2026 {
  title: MovieTitle2026;
  price: number;
  cycle: number;
}

// 2025 Movie Picks - Cycle 1 (Winter Auction)
// To add a second cycle for 2025:
// 1. Create a new auction with cycle: 2
// 2. Add picks with cycle: 2 to this object
// 3. The UI will automatically group picks by cycle with visual dividers
const moviePicks2025: Record<string, MoviePick2025[]> = {
  [playerList.FENNESSY.lastName]: [
    { title: 'Mission: Impossible - The Final Reckoning', price: 390, cycle: 1 },
    { title: '28 Years Later', price: 355, cycle: 1 },
    { title: 'A Big Bold Beautiful Journey', price: 50, cycle: 1 },
    { title: 'One Battle After Another', price: 1, cycle: 1 },
    { title: 'Eddington', price: 204, cycle: 1 },
    { title: 'Avatar: Fire and Ash', price: 300, cycle: 2 },
    { title: 'Superman', price: 62, cycle: 2 },
    { title: 'Hamnet', price: 219, cycle: 2 },
    { title: 'It Was Just An Accident', price: 41, cycle: 2 },
    { title: 'Predator: Badlands', price: 1, cycle: 2 }
  ],
  [playerList.DOBBINS.lastName]: [
    // Cycle 1 picks - Each player must pick different movies per auction
    { title: 'M3gan 2.0', price: 30, cycle: 1 },
    { title: 'F1: The Movie', price: 256, cycle: 1 },
    { title: 'The Phoenician Scheme', price: 200, cycle: 1 },
    { title: 'Marty Supreme', price: 206, cycle: 1 },
    { title: 'Opus', price: 308, cycle: 1 },

    // Cycle 2 picks
    { title: 'After The Hunt', price: 260, cycle: 2 },
    { title: 'Roofman', price: 100, cycle: 2 },
    { title: 'Jay Kelly', price: 420, cycle: 2 },
    { title: 'A House of Dynamite', price: 180, cycle: 2 },
    { title: 'Downton Abbey: The Grand Finale', price: 40, cycle: 2 }
  ],
  [playerList.RYAN.lastName]: [
    // Cycle 1 picks - Each player must pick different movies per auction
    { title: 'Sinners', price: 270, cycle: 1 },
    { title: 'Highest 2 Lowest', price: 205, cycle: 1 },
    { title: 'Jurassic World Rebirth', price: 100, cycle: 1 },
    { title: 'Sentimental Value', price: 110, cycle: 1 },
    { title: 'The Running Man', price: 100, cycle: 1 },

    // Cycle 2 picks
    { title: 'Ballad of a Small Player', price: 165, cycle: 2 },
    { title: 'Weapons', price: 465, cycle: 2 },
    { title: 'Is This Thing On?', price: 70, cycle: 2 },
    { title: "Now You See Me: Now You Don't", price: 36, cycle: 2 },
    { title: 'Springsteen: Deliver Me From Nowhere', price: 60, cycle: 2 }
  ],
};

// 2026 Movie Picks - Cycle 1 (Winter Auction)
// To add a second cycle for 2026:
// 1. Create a new auction with cycle: 2
// 2. Add picks with cycle: 2 to this object
// 3. The UI will automatically group picks by cycle with visual dividers
const moviePicks2026: Record<string, MoviePick2026[]> = {
  [playerList.FENNESSY.lastName]: [
    { title: 'The Odyssey', price: 926, cycle: 1 },
    { title: 'Toy Story 5', price: 1, cycle: 1 },
    { title: 'Narnia', price: 18, cycle: 1 },
    { title: 'Digger', price: 5, cycle: 1 },
    { title: 'Jack of Spades', price: 50, cycle: 1 }
  ],
  [playerList.DOBBINS.lastName]: [
    { title: 'Dune: Part 3', price: 775, cycle: 1 },
    { title: 'Project Hail Mary', price: 200, cycle: 1 },
    { title: 'The Social Reckoning', price: 1, cycle: 1 },
    { title: 'Verity', price: 5, cycle: 1 },
    { title: 'The Mandalorian & Grogu', price: 19, cycle: 1 }
  ],
  [playerList.RYAN.lastName]: [
    { title: 'Wuthering Heights', price: 75, cycle: 1 },
    { title: 'Resident Evil', price: 72, cycle: 1 },
    { title: 'The Devil Wears Prada 2', price: 26, cycle: 1 },
    { title: 'The Adventures of Cliff Booth', price: 76, cycle: 1 },
    { title: 'Disclosure Day', price: 72, cycle: 1 }
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

  console.log('Step 4: Fetching IMDb data for 2025 movies...');
  const imdbDataMap2025 = await batchGetIMDbMovieData([...movieTitles2025]);
  console.log('');

  console.log('Step 5: Fetching IMDb data for 2026 movies...');
  const imdbDataMap2026 = await batchGetIMDbMovieData([...movieTitles2026]);
  console.log('');

  console.log('Step 6: Creating 2025 movies with IMDb data...');
  const movies2025 = await Promise.all(
    movieTitles2025.map(async (title, index) => {
      const imdbData = imdbDataMap2025.get(title);
      const studioIndex = index % studios.length;
      const anticipatedDate = new Date(2025, (index % 12), 15);

      const movieData = {
        title: title,
        budget: 100000000 + (index * 20000000),
        director: null,
        anticipatedReleaseDate: anticipatedDate,
        genre: imdbData?.genre || 'Drama',
        posterUrl: imdbData?.posterUrl || null,
        status: 'announced',
        studioId: studios[studioIndex].id,
      };

      console.log(`  Creating: "${title}"${imdbData ? ' (with IMDb data)' : ''}`);
      return prisma.movie.create({ data: movieData });
    })
  );
  console.log(`✓ Created ${movies2025.length} movies for 2025\n`);

  console.log('Step 7: Creating 2026 movies with IMDb data...');
  const movies2026 = await Promise.all(
    movieTitles2026.map(async (title, index) => {
      const imdbData = imdbDataMap2026.get(title);
      const studioIndex = index % studios.length;
      const anticipatedDate = new Date(2026, (index % 12), 15);

      const movieData = {
        title: title,
        budget: 100000000 + (index * 20000000),
        director: null,
        anticipatedReleaseDate: anticipatedDate,
        genre: imdbData?.genre || 'Drama',
        posterUrl: imdbData?.posterUrl || null,
        status: 'announced',
        studioId: studios[studioIndex].id,
      };

      console.log(`  Creating: "${title}"${imdbData ? ' (with IMDb data)' : ''}`);
      return prisma.movie.create({ data: movieData });
    })
  );
  console.log(`✓ Created ${movies2026.length} movies for 2026\n`);

  console.log('Step 8: Creating 2025 Winter Auction (Cycle 1)...');
  const auction2025Winter = await prisma.auction.create({
    data: {
      name: '2025 Winter Auction',
      year: 2025,
      cycle: 1,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-05-31'),
      budgetPerPlayer: 1000,
      status: 'completed',
    },
  });
  console.log(`✓ Created auction: ${auction2025Winter.name}\n`);

  console.log('Step 8b: Creating 2025 Summer Auction (Cycle 2)...');
  const auction2025Summer = await prisma.auction.create({
    data: {
      name: '2025 Summer Auction',
      year: 2025,
      cycle: 2,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-12-31'),
      budgetPerPlayer: 1000,
      status: 'completed',
    },
  });
  console.log(`✓ Created auction: ${auction2025Summer.name}\n`);

  console.log('Step 9: Creating 2026 Winter Auction...');
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

  // Map player names to player objects
  const playersByLastName: Record<string, typeof players[0]> = {
    [playerList.FENNESSY.lastName]: players[0],
    [playerList.DOBBINS.lastName]: players[1],
    [playerList.RYAN.lastName]: players[2],
  };

  console.log('Step 10: Creating player auctions for 2025 Cycle 1...');
  const playerAuctions2025Cycle1 = await Promise.all(
    players.map((player) =>
      prisma.playerAuction.create({
        data: {
          playerId: player.id,
          auctionId: auction2025Winter.id,
          remainingBudget: 1000,
          totalSpent: 0,
          totalPoints: 0,
        },
      })
    )
  );
  console.log(`✓ Created ${playerAuctions2025Cycle1.length} player auctions for 2025 Cycle 1\n`);

  console.log('Step 10b: Creating player auctions for 2025 Cycle 2...');
  const playerAuctions2025Cycle2 = await Promise.all(
    players.map((player) =>
      prisma.playerAuction.create({
        data: {
          playerId: player.id,
          auctionId: auction2025Summer.id,
          remainingBudget: 1000,
          totalSpent: 0,
          totalPoints: 0,
        },
      })
    )
  );
  console.log(`✓ Created ${playerAuctions2025Cycle2.length} player auctions for 2025 Cycle 2\n`);

  console.log('Step 11: Creating picks for 2025...');
  const picks2025: any[] = [];
  const auctions2025Map = {
    1: auction2025Winter,
    2: auction2025Summer,
  };

  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks2025)) {
    const player = playersByLastName[playerLastName];
    console.log(`  ${player.firstName} ${player.lastName}:`);

    for (const { title: movieTitle, price, cycle } of pickedMovies) {
      const movie = movies2025.find(m => m.title === movieTitle);

      if (!movie) {
        console.error(`    ✗ Movie "${movieTitle}" not found!`);
        continue;
      }

      // Get the correct auction for this cycle
      const auction = auctions2025Map[cycle as keyof typeof auctions2025Map];
      if (!auction) {
        console.error(`    ✗ Movie "${movieTitle}" has invalid cycle ${cycle}!`);
        continue;
      }

      const pick = await prisma.pick.create({
        data: {
          playerId: player.id,
          movieId: movie.id,
          auctionId: auction.id,
          purchaseAmount: price,
        },
      });

      picks2025.push(pick);
      console.log(`    ✓ Picked "${movieTitle}" (Cycle ${cycle}) for $${price}`);
    }
  }
  console.log(`✓ Created ${picks2025.length} picks for 2025\n`);

  console.log('Step 12: Updating player auction budgets for 2025...');
  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks2025)) {
    const player = playersByLastName[playerLastName];

    // Group picks by cycle
    const picksByCycle = pickedMovies.reduce((acc, pick) => {
      if (!acc[pick.cycle]) acc[pick.cycle] = [];
      acc[pick.cycle].push(pick);
      return acc;
    }, {} as Record<number, typeof pickedMovies>);

    // Update each cycle's player auction
    for (const [cycle, picks] of Object.entries(picksByCycle)) {
      const cycleNum = parseInt(cycle);
      const auction = auctions2025Map[cycleNum as keyof typeof auctions2025Map];
      const totalSpent = picks.reduce((sum, pick) => sum + pick.price, 0);
      const remainingBudget = 1000 - totalSpent;

      await prisma.playerAuction.update({
        where: {
          playerId_auctionId: {
            playerId: player.id,
            auctionId: auction.id,
          },
        },
        data: {
          totalSpent,
          remainingBudget,
        },
      });

      console.log(`  ✓ Updated ${player.firstName} ${player.lastName} Cycle ${cycle}: Spent $${totalSpent}, Remaining $${remainingBudget}`);
    }
  }
  console.log('');

  console.log('Step 13: Creating player auctions for 2026...');
  const playerAuctions2026 = await Promise.all(
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
  console.log(`✓ Created ${playerAuctions2026.length} player auctions for 2026\n`);

  console.log('Step 14: Creating picks for 2026...');
  const picks2026: any[] = [];
  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks2026)) {
    const player = playersByLastName[playerLastName];
    console.log(`  ${player.firstName} ${player.lastName}:`);

    for (const { title: movieTitle, price, cycle } of pickedMovies) {
      const movie = movies2026.find(m => m.title === movieTitle);

      if (!movie) {
        console.error(`    ✗ Movie "${movieTitle}" not found!`);
        continue;
      }

      // Verify cycle matches the auction we're creating for
      if (cycle !== auction2026Winter.cycle) {
        console.error(`    ✗ Movie "${movieTitle}" has cycle ${cycle} but auction is cycle ${auction2026Winter.cycle}!`);
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

      picks2026.push(pick);
      console.log(`    ✓ Picked "${movieTitle}" (Cycle ${cycle}) for $${price}`);
    }
  }
  console.log(`✓ Created ${picks2026.length} picks for 2026\n`);

  console.log('Step 15: Updating player auction budgets for 2026...');
  for (const [playerLastName, pickedMovies] of Object.entries(moviePicks2026)) {
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
  console.log(`  2025 Movies: ${movies2025.length}`);
  console.log(`  2026 Movies: ${movies2026.length}`);
  console.log(`  Total Movies: ${movies2025.length + movies2026.length}`);
  console.log(`  2025 Picks: ${picks2025.length}`);
  console.log(`  2026 Picks: ${picks2026.length}`);
  console.log(`  Total Picks: ${picks2025.length + picks2026.length}`);
  console.log(`  Auctions: ${auction2025Winter.name}, ${auction2026Winter.name}`);
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
