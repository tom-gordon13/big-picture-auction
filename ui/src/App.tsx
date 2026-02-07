import React, { useEffect, useState } from 'react';
import { Global, css } from '@emotion/react';
import styled from '@emotion/styled';
import { Header } from './components/Header';
import { PlayerColumn } from './components/PlayerColumn';
import { Footer } from './components/Footer';
import { globalStyles, theme } from './theme';
import { apiClient } from './services/api';
import { LeaderboardResponse } from './types/api';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem;
  min-height: 0;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    overflow: visible;
    padding: 0.5rem;
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem;
  }
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.cream};
  font-family: ${theme.fonts.oswald};
  font-size: 1.5rem;
`;

// Fallback sample data (for reference/development)
const fallbackPlayersData: LeaderboardResponse = [
  {
    rank: 1,
    name: 'Sean Fennessey',
    spent: 847,
    left: 153,
    points: 12,
    movies: [
      {
        title: 'Mission: Impossible',
        price: 285,
        posterTheme: 'action',
        cycle: 1,
        boxOffice: { status: 'achieved', value: '$142M' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: 1,
      },
      {
        title: 'The Bride',
        price: 180,
        posterTheme: 'horror',
        cycle: 1,
        boxOffice: { status: 'failed', value: '$68M' },
        oscar: { status: 'achieved', value: 'Nom' },
        metacritic: { status: 'achieved', value: '88' },
        points: 2,
      },
      {
        title: 'Sinners',
        price: 210,
        posterTheme: 'thriller',
        cycle: 1,
        boxOffice: { status: 'achieved', value: '$118M' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: 1,
      },
      {
        title: 'Wuthering Heights',
        price: 95,
        posterTheme: 'drama',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
      {
        title: 'Death of a Unicorn',
        price: 77,
        posterTheme: 'fantasy',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
    ],
  },
  {
    rank: 2,
    name: 'Amanda Dobbins',
    spent: 920,
    left: 80,
    points: 8,
    movies: [
      {
        title: 'Wicked: For Good',
        price: 320,
        posterTheme: 'musical',
        cycle: 1,
        boxOffice: { status: 'achieved', value: '$412M' },
        oscar: { status: 'achieved', value: 'Nom' },
        metacritic: { status: 'failed', value: '79' },
        points: 2,
      },
      {
        title: 'F1',
        price: 245,
        posterTheme: 'action',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
      {
        title: 'The Running Man',
        price: 175,
        posterTheme: 'scifi',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
      {
        title: 'Materialists',
        price: 110,
        posterTheme: 'drama',
        cycle: 1,
        boxOffice: { status: 'failed', value: '$24M' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'achieved', value: '91' },
        points: 1,
      },
      {
        title: 'Bugonia',
        price: 70,
        posterTheme: 'comedy',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
    ],
  },
  {
    rank: 3,
    name: 'Chris Ryan',
    spent: 780,
    left: 220,
    points: 6,
    movies: [
      {
        title: 'Superman',
        price: 290,
        posterTheme: 'scifi',
        cycle: 1,
        boxOffice: { status: 'achieved', value: '$287M' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: 1,
      },
      {
        title: 'A Big Bold Beautiful Journey',
        price: 165,
        posterTheme: 'drama',
        cycle: 1,
        boxOffice: { status: 'failed', value: '$31M' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'achieved', value: '87' },
        points: 1,
      },
      {
        title: 'Warfare',
        price: 140,
        posterTheme: 'action',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
      {
        title: 'The Legend of Ochi',
        price: 105,
        posterTheme: 'fantasy',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
      {
        title: 'Frankenstein',
        price: 80,
        posterTheme: 'horror',
        cycle: 1,
        boxOffice: { status: 'pending', value: 'TBD' },
        oscar: { status: 'pending', value: 'TBD' },
        metacritic: { status: 'pending', value: 'TBD' },
        points: null,
      },
    ],
  },
];

function App() {
  const [playersData, setPlayersData] = useState<LeaderboardResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Fetch available years on mount
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const years = await apiClient.getAuctionYears();
        const yearNumbers = years.map(y => y.year).sort((a, b) => b - a);
        setAvailableYears(yearNumbers);

        // Check URL for year parameter
        const urlParams = new URLSearchParams(window.location.search);
        const yearParam = urlParams.get('year');

        if (yearParam) {
          const yearFromUrl = parseInt(yearParam, 10);
          if (!isNaN(yearFromUrl) && yearNumbers.includes(yearFromUrl)) {
            setSelectedYear(yearFromUrl);
            return;
          }
        }

        // Set the latest year as default
        if (yearNumbers.length > 0) {
          setSelectedYear(yearNumbers[0]);
        }
      } catch (err) {
        console.error('Error fetching years:', err);
        // Default to current year if fetch fails
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
        setSelectedYear(currentYear);
      }
    };

    fetchYears();
  }, []);

  // Fetch leaderboard when year changes
  useEffect(() => {
    if (selectedYear === null) return;

    // Update URL when year changes
    const url = new URL(window.location.href);
    url.searchParams.set('year', selectedYear.toString());
    window.history.pushState({}, '', url.toString());

    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getLatestLeaderboard(selectedYear);

        // If no data returned, use fallback data
        if (data.length === 0) {
          setPlayersData(fallbackPlayersData);
        } else {
          setPlayersData(data);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard data');
        // Use fallback data on error
        setPlayersData(fallbackPlayersData);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedYear]);

  return (
    <>
      <Global styles={css(globalStyles)} />
      <AppContainer>
        <Header
          selectedYear={selectedYear || new Date().getFullYear()}
          availableYears={availableYears}
          onYearChange={setSelectedYear}
        />
        {loading ? (
          <LoadingContainer>Loading auction data...</LoadingContainer>
        ) : error ? (
          <MainContent>
            {playersData.map((player, index) => (
              <PlayerColumn
                key={player.name}
                player={player}
                isLeader={index === 0}
              />
            ))}
          </MainContent>
        ) : (
          <MainContent>
            {playersData.map((player, index) => (
              <PlayerColumn
                key={player.name}
                player={player}
                isLeader={index === 0}
              />
            ))}
          </MainContent>
        )}
        <Footer />
      </AppContainer>
    </>
  );
}

export default App;
