import styled from '@emotion/styled';
import { theme } from '../theme';

export type CriterionStatus = 'achieved' | 'pending' | 'failed';

interface CriterionProps {
  status: CriterionStatus;
  label: string;
  value: string;
}

const CriterionContainer = styled.div<{ status: CriterionStatus }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  font-family: ${theme.fonts.barlowCondensed};
  text-transform: uppercase;
  letter-spacing: 0.02em;
  padding: 0.3rem 0.2rem;
  border-radius: 2px;
  text-align: center;

  ${props => {
    switch (props.status) {
      case 'achieved':
        return `
          background: rgba(74, 222, 128, 0.15);
          border: 1px solid ${theme.colors.success};
          color: ${theme.colors.success};
        `;
      case 'failed':
        return `
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.6);
          color: ${theme.colors.failed};
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.1);
          border: 1px solid rgba(107, 114, 128, 0.4);
          color: ${theme.colors.pending};
        `;
    }
  }}

  @media (max-width: 1024px) {
    padding: 0.3rem 0.2rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.3rem;
    gap: 0.15rem;
  }

  @media (max-width: 480px) {
    padding: 0.4rem 0.2rem;
  }
`;

const CriterionIcon = styled.span`
  font-size: 0.85rem;
  line-height: 1;

  @media (max-width: 1024px) {
    font-size: 0.75rem;
  }

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
  }
`;

const CriterionLabel = styled.span`
  font-size: 0.5rem;
  font-weight: 600;
  line-height: 1.1;

  @media (max-width: 1024px) {
    font-size: 0.45rem;
  }

  @media (max-width: 768px) {
    font-size: 0.6rem;
  }

  @media (max-width: 480px) {
    font-size: 0.55rem;
  }
`;

const CriterionValue = styled.span`
  font-size: 0.65rem;
  font-weight: 700;

  @media (max-width: 1024px) {
    font-size: 0.6rem;
  }

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

export const Criterion: React.FC<CriterionProps> = ({ status, label, value }) => {
  const getIcon = () => {
    switch (status) {
      case 'achieved':
        return '✓';
      case 'failed':
        return '✗';
      default:
        return '?';
    }
  };

  return (
    <CriterionContainer status={status}>
      <CriterionIcon>{getIcon()}</CriterionIcon>
      <CriterionLabel>{label}</CriterionLabel>
      <CriterionValue>{value}</CriterionValue>
    </CriterionContainer>
  );
};
