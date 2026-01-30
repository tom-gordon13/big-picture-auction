export const theme = {
  colors: {
    bpGreen: '#1B4D3E',
    bpGreenLight: '#2A6B54',
    bpGreenDark: '#0F2E25',
    bpGreenGlow: '#3D8B6E',
    gold: '#C9A227',
    goldBright: '#E8C547',
    cream: '#F5F2EB',
    dark: '#0a0a0a',
    success: '#4ADE80',
    pending: '#6B7280',
    failed: '#f87171',
  },
  fonts: {
    oswald: "'Oswald', sans-serif",
    barlowCondensed: "'Barlow Condensed', sans-serif",
    barlow: "'Barlow', sans-serif",
  },
};

export const posterThemes = {
  action: 'linear-gradient(145deg, #1a1a2e 0%, #0f3460 100%)',
  drama: 'linear-gradient(145deg, #2d132c 0%, #6b1d5c 100%)',
  scifi: 'linear-gradient(145deg, #0a0a0a 0%, #2d2d44 100%)',
  horror: 'linear-gradient(145deg, #1a0000 0%, #3d1515 100%)',
  comedy: 'linear-gradient(145deg, #1a1a0a 0%, #3d3d20 100%)',
  musical: 'linear-gradient(145deg, #0a1a1a 0%, #204545 100%)',
  thriller: 'linear-gradient(145deg, #0d0d0d 0%, #2a2a2a 100%)',
  fantasy: 'linear-gradient(145deg, #0f2027 0%, #2c5364 100%)',
};

export type PosterTheme = keyof typeof posterThemes;

export const globalStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    background: ${theme.colors.dark};
    font-family: ${theme.fonts.barlow};
    color: ${theme.colors.cream};
  }
`;
