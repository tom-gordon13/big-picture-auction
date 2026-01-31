import { LeaderboardResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const apiClient = {
  async getLatestLeaderboard(): Promise<LeaderboardResponse> {
    const response = await fetch(`${API_BASE_URL}/auctions/latest/leaderboard`);

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
