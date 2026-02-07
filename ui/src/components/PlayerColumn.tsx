import React from 'react';
import styled from '@emotion/styled';
import { PlayerHeader } from './PlayerHeader';
import { MovieCard } from './MovieCard';
import { theme } from '../theme';
import { PlayerLeaderboardResponse } from '../types/api';

interface PlayerColumnProps {
  player: PlayerLeaderboardResponse;
  isLeader?: boolean;
}

const ColumnContainer = styled.div<{ isLeader: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #141414 0%, #0a0a0a 100%);
  border: 2px solid ${props => props.isLeader ? theme.colors.bpGreen : theme.colors.bpGreenDark};
  box-shadow: ${props => props.isLeader ? '0 0 15px rgba(27, 77, 62, 0.3)' : 'none'};
  min-width: 0;
  min-height: 0;

  @media (max-width: 768px) {
    flex: none;
    min-height: auto;
  }
`;

const MoviesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.colors.dark};
  }

  &::-webkit-scrollbar-thumb {
    background: ${theme.colors.bpGreen};
    border-radius: 2px;
  }

  @media (max-width: 768px) {
    overflow: visible;
    flex: none;
  }
`;

const CycleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const CycleDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0;
`;

const CycleLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, ${theme.colors.bpGreenDark}, transparent);
`;

const CycleLabel = styled.span`
  font-family: ${theme.fonts.barlowCondensed};
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${theme.colors.bpGreenGlow};
  padding: 0.2rem 0.5rem;
  background: ${theme.colors.bpGreenDark};
  border: 1px solid ${theme.colors.bpGreenDark};
  border-radius: 2px;
`;

export const PlayerColumn: React.FC<PlayerColumnProps> = ({ player, isLeader = false }) => {
  // Group movies by cycle
  const moviesByCycle = player.movies.reduce((acc, movie) => {
    const cycle = movie.cycle || 1;
    if (!acc[cycle]) {
      acc[cycle] = [];
    }
    acc[cycle].push(movie);
    return acc;
  }, {} as Record<number, typeof player.movies>);

  // Sort movies within each cycle by purchase price (descending)
  Object.keys(moviesByCycle).forEach(cycle => {
    moviesByCycle[Number(cycle)].sort((a, b) => b.price - a.price);
  });

  // Get sorted cycle numbers
  const cycles = Object.keys(moviesByCycle).map(Number).sort((a, b) => a - b);

  return (
    <ColumnContainer isLeader={isLeader}>
      <PlayerHeader
        rank={player.rank}
        name={player.name}
        spent={player.spent}
        left={player.left}
        points={player.points}
        isLeader={isLeader}
      />
      <MoviesList>
        {cycles.map((cycle, cycleIndex) => (
          <React.Fragment key={cycle}>
            {cycleIndex > 0 && (
              <CycleDivider>
                <CycleLine />
                <CycleLabel>Round {cycle}</CycleLabel>
                <CycleLine />
              </CycleDivider>
            )}
            <CycleGroup>
              {moviesByCycle[cycle].map((movie, index) => (
                <MovieCard key={`${cycle}-${index}`} movie={movie} />
              ))}
            </CycleGroup>
          </React.Fragment>
        ))}
      </MoviesList>
    </ColumnContainer>
  );
};
