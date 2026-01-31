import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import { getMetacriticScore, getMetacriticScoreDetails } from './services/metacritic';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', message: 'API is running', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'API is running', database: 'disconnected' });
  }
});

app.get('/api/players', async (req: Request, res: Response) => {
  try {
    const players = await prisma.player.findMany();
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Test endpoint for Metacritic service
app.get('/api/metacritic/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const score = await getMetacriticScore(title);
    const details = await getMetacriticScoreDetails(title);

    res.json({
      title,
      score,
      details,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Metacritic score' });
  }
});

app.get('/api/auctions/latest/leaderboard', async (req: Request, res: Response) => {
  try {
    const latestAuction = await prisma.auction.findFirst({
      orderBy: [{ year: 'desc' }, { cycle: 'desc' }],
    });

    if (!latestAuction) {
      return res.json([]);
    }

    const playerAuctions = await prisma.playerAuction.findMany({
      where: { auctionId: latestAuction.id },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    const leaderboard = await Promise.all(
      playerAuctions.map(async (pa, index: number) => {
        const player = await prisma.player.findUnique({
          where: { id: pa.playerId },
        });

        const picks = await prisma.pick.findMany({
          where: {
            playerId: pa.playerId,
            auctionId: pa.auctionId,
          },
        });

        const movies = await Promise.all(
          picks.map(async (pick) => {
            const movie = await prisma.movie.findUnique({
              where: { id: pick.movieId },
            });

            const stats = await prisma.movieStats.findUnique({
              where: { movieId: pick.movieId },
            });

            if (!movie) return null;

            const boxOfficeValue = stats?.domesticBoxOffice || BigInt(0);
            const boxOfficeMillions = Number(boxOfficeValue) / 1_000_000;

            const boxOfficeStatus =
              boxOfficeValue > 0
                ? boxOfficeMillions >= 100
                  ? 'achieved'
                  : 'failed'
                : 'pending';

            const oscarStatus =
              stats?.oscarNominations && stats.oscarNominations > 0
                ? 'achieved'
                : stats?.oscarNominations === 0
                ? 'failed'
                : 'pending';

            const metacriticStatus = stats?.metacriticScore
              ? stats.metacriticScore >= 85
                ? 'achieved'
                : 'failed'
              : 'pending';

            let points = 0;
            if (boxOfficeStatus === 'achieved') points += 1;
            if (oscarStatus === 'achieved') points += 1;
            if (metacriticStatus === 'achieved') points += 1;

            return {
              title: movie.title,
              price: pick.purchaseAmount,
              posterTheme: (movie.genre?.toLowerCase() || 'drama') as any,
              boxOffice: {
                status: boxOfficeStatus,
                value:
                  boxOfficeValue > 0
                    ? `$${Math.round(boxOfficeMillions)}M`
                    : 'TBD',
              },
              oscar: {
                status: oscarStatus,
                value:
                  stats?.oscarNominations && stats.oscarNominations > 0
                    ? 'Nom'
                    : stats?.oscarNominations === 0
                    ? 'None'
                    : 'TBD',
              },
              metacritic: {
                status: metacriticStatus,
                value: stats?.metacriticScore
                  ? stats.metacriticScore.toString()
                  : 'TBD',
              },
              points: points > 0 ? points : null,
            };
          })
        );

        const validMovies = movies.filter((m) => m !== null);

        return {
          rank: index + 1,
          name: player ? `${player.firstName} ${player.lastName}` : 'Unknown',
          spent: pa.totalSpent,
          left: pa.remainingBudget,
          points: pa.totalPoints,
          movies: validMovies,
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
