import { LeaderboardResponse } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const apiClient = {
  async getLatestLeaderboard(): Promise<LeaderboardResponse> {
    // TODO: Use /latest endpoint once fixed
    // For now, hardcode the auction ID from the seed data
    const auctionId = 'ed8a02ac-b2ee-4219-b2bb-5f70296b9899';
    const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}/leaderboard`);

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
