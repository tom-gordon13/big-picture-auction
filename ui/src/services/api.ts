import { LeaderboardResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export interface AuctionYear {
  year: number;
  cycle: number;
  name: string;
}

export const apiClient = {
  async getAuctionYears(): Promise<AuctionYear[]> {
    const response = await fetch(`${API_BASE_URL}/auctions/years`);

    if (!response.ok) {
      throw new Error(`Failed to fetch auction years: ${response.statusText}`);
    }

    return response.json();
  },

  async getLatestLeaderboard(year?: number): Promise<LeaderboardResponse> {
    const url = year
      ? `${API_BASE_URL}/auctions/latest/leaderboard?year=${year}`
      : `${API_BASE_URL}/auctions/latest/leaderboard`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return response.json();
  },

  async getLeaderboardByAuctionId(auctionId: string): Promise<LeaderboardResponse> {
    const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/leaderboard`);

    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
    }

    return response.json();
  },
};
