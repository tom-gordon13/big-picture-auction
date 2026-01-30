import styled from '@emotion/styled';
import { PosterTheme, posterThemes, theme } from '../theme';

interface MoviePosterProps {
  title: string;
  theme: PosterTheme;
}

const PosterContainer = styled.div`
  width: 50px;
  height: 75px;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 45px;
    height: 67px;
  }

  @media (max-width: 768px) {
    width: 70px;
    height: 105px;
  }

  @media (max-width: 480px) {
    width: 60px;
    height: 90px;
  }
`;

const PosterArt = styled.div<{ posterTheme: PosterTheme }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.2rem;
  text-align: center;
  position: relative;
  background: ${props => posterThemes[props.posterTheme]};

  &::after {
    content: '';
    position: absolute;
    inset: 2px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }
`;

const PosterTitle = styled.div`
  font-family: ${theme.fonts.oswald};
  font-size: 0.45rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.01em;
  color: ${theme.colors.cream};
  line-height: 1.15;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

  @media (max-width: 768px) {
    font-size: 0.55rem;
  }
`;

export const MoviePoster: React.FC<MoviePosterProps> = ({ title, theme: posterTheme }) => {
  return (
    <PosterContainer>
      <PosterArt posterTheme={posterTheme}>
        <PosterTitle>{title}</PosterTitle>
      </PosterArt>
    </PosterContainer>
  );
};
