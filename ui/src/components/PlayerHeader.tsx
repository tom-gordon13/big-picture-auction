import styled from '@emotion/styled';
import { theme } from '../theme';

interface PlayerHeaderProps {
  rank: number;
  name: string;
  spent: number;
  left: number;
  points: number;
  isLeader?: boolean;
}

const HeaderContainer = styled.div<{ isLeader: boolean }>`
  background: ${props => props.isLeader
    ? `linear-gradient(135deg, ${theme.colors.bpGreenLight} 0%, ${theme.colors.bpGreen} 100%)`
    : theme.colors.bpGreen};
  padding: 0.4rem 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 0.3rem;

  @media (max-width: 768px) {
    padding: 0.6rem 0.75rem;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }
`;

const PlayerLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const PlayerRank = styled.span`
  font-family: ${theme.fonts.oswald};
  font-size: 1.2rem;
  font-weight: 700;
  color: ${theme.colors.gold};
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const PlayerName = styled.span`
  font-family: ${theme.fonts.oswald};
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: ${theme.colors.cream};

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const PlayerRight = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.6rem;

  @media (max-width: 480px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const PlayerStat = styled.div`
  text-align: center;
`;

const PlayerStatValue = styled.div`
  font-family: ${theme.fonts.oswald};
  font-size: 0.75rem;
  font-weight: 600;
  color: ${theme.colors.cream};

  @media (max-width: 768px) {
    font-size: 0.85rem;
  }
`;

const PlayerStatLabel = styled.div`
  font-size: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(245, 242, 235, 0.5);

  @media (max-width: 768px) {
    font-size: 0.5rem;
  }
`;

const PlayerPoints = styled.span`
  font-family: ${theme.fonts.oswald};
  font-size: 1.2rem;
  font-weight: 700;
  color: ${theme.colors.goldBright};
  text-shadow: 0 0 8px rgba(232, 197, 71, 0.4);

  span {
    font-size: 0.55rem;
    color: rgba(245, 242, 235, 0.6);
  }

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  rank,
  name,
  spent,
  left,
  points,
  isLeader = false,
}) => {
  return (
    <HeaderContainer isLeader={isLeader}>
      <PlayerLeft>
        <PlayerRank>{rank}</PlayerRank>
        <PlayerName>{name}</PlayerName>
      </PlayerLeft>
      <PlayerRight>
        <PlayerStat>
          <PlayerStatValue>${spent}</PlayerStatValue>
          <PlayerStatLabel>Spent</PlayerStatLabel>
        </PlayerStat>
        <PlayerStat>
          <PlayerStatValue>${left}</PlayerStatValue>
          <PlayerStatLabel>Left</PlayerStatLabel>
        </PlayerStat>
        <PlayerPoints>
          {points}<span>pts</span>
        </PlayerPoints>
      </PlayerRight>
    </HeaderContainer>
  );
};
