import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

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

app.get('/api/auctions/:auctionId/leaderboard', async (req: Request, res: Response) => {
  try {
    const { auctionId } = req.params;

    const playerAuctions = await prisma.playerAuction.findMany({
      where: { auctionId: auctionId as string },
      include: {
        player: true,
        auction: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    const leaderboard = await Promise.all(
      playerAuctions.map(async (pa: any, index: number) => {
        const picks = await prisma.pick.findMany({
          where: {
            playerId: pa.playerId,
            auctionId: pa.auctionId,
          },
          include: {
            movie: {
              include: {
                stats: true,
              },
            },
          },
        });

        const movies = picks.map((pick: any) => {
          const stats = pick.movie.stats;
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
            title: pick.movie.title,
            price: pick.purchaseAmount,
            posterTheme: (pick.movie.genre?.toLowerCase() || 'drama') as any,
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
        });

        return {
          rank: index + 1,
          name: `${pa.player.firstName} ${pa.player.lastName}`,
          spent: pa.totalSpent,
          left: pa.remainingBudget,
          points: pa.totalPoints,
          movies,
        };
      })
    );

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
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
      include: {
        player: true,
        auction: true,
      },
      orderBy: {
        totalPoints: 'desc',
      },
    });

    const leaderboard = await Promise.all(
      playerAuctions.map(async (pa: any, index: number) => {
        const picks = await prisma.pick.findMany({
          where: {
            playerId: pa.playerId,
            auctionId: pa.auctionId,
          },
          include: {
            movie: {
              include: {
                stats: true,
              },
            },
          },
        });

        const movies = picks.map((pick: any) => {
          const stats = pick.movie.stats;
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
            title: pick.movie.title,
            price: pick.purchaseAmount,
            posterTheme: (pick.movie.genre?.toLowerCase() || 'drama') as any,
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
        });

        return {
          rank: index + 1,
          name: `${pa.player.firstName} ${pa.player.lastName}`,
          spent: pa.totalSpent,
          left: pa.remainingBudget,
          points: pa.totalPoints,
          movies,
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
