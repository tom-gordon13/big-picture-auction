import styled from '@emotion/styled';
import { theme } from '../theme';

const FooterContainer = styled.footer`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.25rem;
  padding: 0.35rem;
  background: ${theme.colors.bpGreenDark};
  border-top: 2px solid ${theme.colors.bpGreen};
  flex-shrink: 0;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    padding: 0.6rem;
    gap: 1rem;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(245, 242, 235, 0.7);

  @media (max-width: 768px) {
    font-size: 0.6rem;
  }
`;

const LegendDot = styled.span<{ color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => props.color};

  @media (max-width: 768px) {
    width: 8px;
    height: 8px;
  }
`;

const FooterBrand = styled.span`
  font-family: ${theme.fonts.barlowCondensed};
  font-size: 0.5rem;
  letter-spacing: 0.1em;
  color: rgba(245, 242, 235, 0.4);
  margin-left: 0.75rem;
  padding-left: 0.75rem;
  border-left: 1px solid ${theme.colors.bpGreen};

  @media (max-width: 768px) {
    font-size: 0.6rem;
    width: 100%;
    text-align: center;
    margin: 0.3rem 0 0 0;
    padding: 0.3rem 0 0 0;
    border-left: none;
    border-top: 1px solid ${theme.colors.bpGreen};
  }
`;

export const Footer: React.FC = () => {
  return (
    <FooterContainer>
      <LegendItem>
        <LegendDot color={theme.colors.success} />
        <span>$100M+ Domestic</span>
      </LegendItem>
      <LegendItem>
        <LegendDot color={theme.colors.goldBright} />
        <span>Oscar Nomination</span>
      </LegendItem>
      <LegendItem>
        <LegendDot color="#60A5FA" />
        <span>Metacritic 85+</span>
      </LegendItem>
      <FooterBrand>The Ringer</FooterBrand>
    </FooterContainer>
  );
};
