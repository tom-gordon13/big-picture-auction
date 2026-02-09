import styled from '@emotion/styled';
import { MoviePoster } from './MoviePoster';
import { Criterion } from './Criterion';
import { theme } from '../theme';
import { MovieResponse } from '../types/api';

interface MovieCardProps {
  movie: MovieResponse;
}

const CardContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  background: rgba(20, 20, 20, 0.6);
  border: 1px solid ${theme.colors.bpGreenDark};
  border-radius: 2px;
  flex-shrink: 0;
  padding: 0.35rem;

  @media (max-width: 768px) {
    padding: 0.5rem;
    gap: 0.6rem;
  }
`;

const MovieInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const MovieTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.35rem;

  @media (max-width: 768px) {
    margin-bottom: 0.5rem;
  }
`;

const MovieTitle = styled.span`
  font-family: ${theme.fonts.barlowCondensed};
  font-size: 0.85rem;
  font-weight: 600;
  color: ${theme.colors.cream};
  text-transform: uppercase;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 1024px) {
    font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
  }
`;

const MoviePrice = styled.span`
  font-family: ${theme.fonts.oswald};
  font-size: 0.9rem;
  font-weight: 700;
  color: ${theme.colors.gold};
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const CriteriaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.3rem;
  flex: 1;
  align-items: stretch;

  @media (max-width: 768px) {
    gap: 0.4rem;
  }
`;

const MoviePoints = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding-left: 0.25rem;

  @media (max-width: 768px) {
    min-width: 2.5rem;
    padding-left: 0.4rem;
  }
`;

const PointsValue = styled.span<{ hasPoints: boolean }>`
  font-family: ${theme.fonts.oswald};
  font-size: 1.3rem;
  font-weight: 700;
  color: ${props => props.hasPoints ? theme.colors.goldBright : theme.colors.pending};

  ${props => !props.hasPoints && `
    font-size: 1.1rem;
  `}

  @media (max-width: 1024px) {
    font-size: ${props => props.hasPoints ? '1.1rem' : '1rem'};
  }

  @media (max-width: 768px) {
    font-size: ${props => props.hasPoints ? '1.6rem' : '1.4rem'};
  }
`;

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <CardContainer>
      <MoviePoster title={movie.title} theme={movie.posterTheme} posterUrl={movie.posterUrl} />
      <MovieInfo>
        <MovieTitleRow>
          <MovieTitle>{movie.title}</MovieTitle>
          <MoviePrice>${movie.price}</MoviePrice>
        </MovieTitleRow>
        <CriteriaGrid>
          <Criterion
            status={movie.boxOffice.status}
            label="Box Office"
            value={movie.boxOffice.value}
          />
          <Criterion
            status={movie.oscar.status}
            label="Oscar Nominations"
            value={movie.oscar.value}
          />
          <Criterion
            status={movie.metacritic.status}
            label="Metacritic"
            value={movie.metacritic.value}
          />
        </CriteriaGrid>
      </MovieInfo>
      <MoviePoints>
        <PointsValue hasPoints={movie.points !== null}>
          {movie.points !== null ? `+${movie.points}` : '—'}
        </PointsValue>
      </MoviePoints>
    </CardContainer>
  );
};
