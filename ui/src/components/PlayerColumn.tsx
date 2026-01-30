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
  gap: 0.35rem;
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

export const PlayerColumn: React.FC<PlayerColumnProps> = ({ player, isLeader = false }) => {
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
        {player.movies.map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </MoviesList>
    </ColumnContainer>
  );
};
