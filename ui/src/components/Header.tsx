import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '../theme';

const bulbPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const HeaderContainer = styled.header`
  text-align: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(180deg, ${theme.colors.bpGreenDark} 0%, ${theme.colors.dark} 100%);
  flex-shrink: 0;
`;

const MarqueeFrame = styled.div`
  display: inline-block;
  padding: 0.35rem 1.5rem;
  position: relative;
  background: ${theme.colors.bpGreenDark};
  border: 2px solid ${theme.colors.bpGreen};
  box-shadow: 0 0 20px rgba(27, 77, 62, 0.4);
`;

const Bulbs = styled.div<{ position: 'top' | 'bottom' }>`
  position: absolute;
  display: flex;
  gap: 12px;
  justify-content: center;
  ${props => props.position === 'top' ? 'top: -4px;' : 'bottom: -4px;'}
  left: 15px;
  right: 15px;
`;

const Bulb = styled.span<{ delay?: number }>`
  width: 5px;
  height: 5px;
  background: ${theme.colors.bpGreenGlow};
  border-radius: 50%;
  box-shadow: 0 0 4px ${theme.colors.bpGreenGlow}, 0 0 8px ${theme.colors.bpGreenLight};
  animation: ${bulbPulse} 3s ease-in-out infinite;
  animation-delay: ${props => props.delay || 0}s;
`;

const ShowTitle = styled.h1`
  font-family: ${theme.fonts.oswald};
  font-size: 1.3rem;
  font-weight: 700;
  color: ${theme.colors.cream};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 1px 1px 0 ${theme.colors.bpGreen};
  line-height: 1;
`;

const ShowSubtitle = styled.div`
  font-family: ${theme.fonts.barlowCondensed};
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: ${theme.colors.bpGreenGlow};
  margin-top: 0.1rem;
`;

export const Header: React.FC = () => {
  const bulbDelays = [0.5, 0, 1, 0.5, 0, 1, 0.5];

  return (
    <HeaderContainer>
      <MarqueeFrame>
        <Bulbs position="top">
          {bulbDelays.map((delay, i) => (
            <Bulb key={`top-${i}`} delay={delay} />
          ))}
        </Bulbs>
        <Bulbs position="bottom">
          {bulbDelays.map((delay, i) => (
            <Bulb key={`bottom-${i}`} delay={delay} />
          ))}
        </Bulbs>
        <ShowTitle>The Big Picture</ShowTitle>
        <ShowSubtitle>Movie Auction 2025</ShowSubtitle>
      </MarqueeFrame>
    </HeaderContainer>
  );
};
