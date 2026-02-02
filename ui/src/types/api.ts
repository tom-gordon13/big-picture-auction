import { CriterionStatus } from '../components/Criterion';
import { PosterTheme } from '../theme';

export interface MovieResponse {
  title: string;
  price: number;
  posterUrl?: string | null;
  posterTheme: PosterTheme;
  boxOffice: {
    status: CriterionStatus;
    value: string;
  };
  oscar: {
    status: CriterionStatus;
    value: string;
  };
  metacritic: {
    status: CriterionStatus;
    value: string;
  };
  points: number | null;
}

export interface PlayerLeaderboardResponse {
  rank: number;
  name: string;
  spent: number;
  left: number;
  points: number;
  movies: MovieResponse[];
}

export type LeaderboardResponse = PlayerLeaderboardResponse[];
