import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.movieStats.deleteMany();
  await prisma.pick.deleteMany();
  await prisma.playerAuction.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.studio.deleteMany();
  await prisma.player.deleteMany();

  console.log('Cleared existing data');

  // Create Studios
  const studios = await Promise.all([
    prisma.studio.create({
      data: {
        name: 'Warner Bros',
        logoUrl: 'https://example.com/wb-logo.png',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Universal Pictures',
        logoUrl: 'https://example.com/universal-logo.png',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Paramount Pictures',
        logoUrl: 'https://example.com/paramount-logo.png',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Disney',
        logoUrl: 'https://example.com/disney-logo.png',
      },
    }),
    prisma.studio.create({
      data: {
        name: 'Sony Pictures',
        logoUrl: 'https://example.com/sony-logo.png',
      },
    }),
  ]);

  console.log(`Created ${studios.length} studios`);

  // Create Players
  const players = await Promise.all([
    prisma.player.create({
      data: { firstName: 'Sean', lastName: 'Fennessy' },
    }),
    prisma.player.create({
      data: { firstName: 'Amanda', lastName: 'Dobbins' },
    }),
    prisma.player.create({
      data: { firstName: 'Chris', lastName: 'Ryan' },
    }),
  ]);

  console.log(`Created ${players.length} players`);

  // Create Movies
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'The Space Odyssey Returns',
        budget: 200000000,
        director: 'Christopher Nolan',
        anticipatedReleaseDate: new Date('2026-07-15'),
        genre: 'Sci-Fi',
        posterUrl: 'https://example.com/space-odyssey.jpg',
        status: 'in-production',
        studioId: studios[0].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Superhero Chronicles 5',
        budget: 250000000,
        director: 'James Gunn',
        anticipatedReleaseDate: new Date('2026-05-20'),
        genre: 'Action',
        posterUrl: 'https://example.com/superhero.jpg',
        status: 'in-production',
        studioId: studios[3].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Mystery at Midnight Manor',
        budget: 80000000,
        director: 'Rian Johnson',
        anticipatedReleaseDate: new Date('2026-11-12'),
        genre: 'Mystery',
        posterUrl: 'https://example.com/mystery.jpg',
        status: 'announced',
        studioId: studios[1].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Last Frontier',
        budget: 150000000,
        director: 'Denis Villeneuve',
        anticipatedReleaseDate: new Date('2026-10-01'),
        genre: 'Drama',
        posterUrl: 'https://example.com/frontier.jpg',
        status: 'in-production',
        studioId: studios[2].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Comedy Gold',
        budget: 50000000,
        director: 'Taika Waititi',
        anticipatedReleaseDate: new Date('2026-08-22'),
        genre: 'Comedy',
        posterUrl: 'https://example.com/comedy.jpg',
        status: 'announced',
        studioId: studios[4].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Horror Heights',
        budget: 30000000,
        director: 'Jordan Peele',
        anticipatedReleaseDate: new Date('2026-10-31'),
        genre: 'Horror',
        posterUrl: 'https://example.com/horror.jpg',
        status: 'in-production',
        studioId: studios[1].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Romance in Paris',
        budget: 40000000,
        director: 'Sofia Coppola',
        anticipatedReleaseDate: new Date('2026-02-14'),
        actualReleaseDate: new Date('2026-02-14'),
        genre: 'Romance',
        posterUrl: 'https://example.com/romance.jpg',
        status: 'released',
        studioId: studios[0].id,
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Action Blast 3',
        budget: 180000000,
        director: 'Michael Bay',
        anticipatedReleaseDate: new Date('2026-06-05'),
        genre: 'Action',
        posterUrl: 'https://example.com/action.jpg',
        status: 'in-production',
        studioId: studios[2].id,
      },
    }),
  ]);

  console.log(`Created ${movies.length} movies`);

  // Create Auctions
  const auction2026Winter = await prisma.auction.create({
    data: {
      name: '2026 Winter Auction',
      year: 2026,
      cycle: 1,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      budgetPerPlayer: 1000,
      status: 'active',
    },
  });

  console.log('Created auction: 2026 Winter');

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

  console.log(`Created ${playerAuctions.length} player auctions`);

  // Create Picks (each player picks different movies)
  const picks = await Promise.all([
    prisma.pick.create({
      data: {
        playerId: players[0].id,
        movieId: movies[0].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 300,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[0].id,
        movieId: movies[2].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 150,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[1].id,
        movieId: movies[1].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 350,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[1].id,
        movieId: movies[4].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 100,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[2].id,
        movieId: movies[3].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 250,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[2].id,
        movieId: movies[5].id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 120,
      },
    }),
    prisma.pick.create({
      data: {
        playerId: players[2]!.id,
        movieId: movies[7]!.id,
        auctionId: auction2026Winter.id,
        purchaseAmount: 280,
      },
    }),
  ]);

  console.log(`Created ${picks.length} picks`);

  // Update player auctions with spending
  await prisma.playerAuction.update({
    where: {
      playerId_auctionId: {
        playerId: players[0].id,
        auctionId: auction2026Winter.id,
      },
    },
    data: {
      totalSpent: 450,
      remainingBudget: 550,
    },
  });

  await prisma.playerAuction.update({
    where: {
      playerId_auctionId: {
        playerId: players[1].id,
        auctionId: auction2026Winter.id,
      },
    },
    data: {
      totalSpent: 450,
      remainingBudget: 550,
    },
  });

  await prisma.playerAuction.update({
    where: {
      playerId_auctionId: {
        playerId: players[2].id,
        auctionId: auction2026Winter.id,
      },
    },
    data: {
      totalSpent: 370,
      remainingBudget: 630,
    },
  });

  await prisma.playerAuction.update({
    where: {
      playerId_auctionId: {
        playerId: players[2]!.id,
        auctionId: auction2026Winter.id,
      },
    },
    data: {
      totalSpent: 280,
      remainingBudget: 720,
    },
  });

  console.log('Updated player auction budgets');

  // Create Movie Stats for the released movie
  await prisma.movieStats.create({
    data: {
      movieId: movies[6].id,
      oscarNominations: 3,
      oscarWins: 1,
      domesticBoxOffice: BigInt(85000000),
      internationalBoxOffice: BigInt(120000000),
      metacriticScore: 78,
    },
  });

  console.log('Created movie stats for released movie');

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
