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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
