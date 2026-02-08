// Vercel serverless function wrapper for Express app
const path = require('path');

// Load the compiled Express app
let app;
try {
  // Try to load from compiled dist first
  const indexPath = path.join(__dirname, '..', 'backend', 'dist', 'src', 'index.js');
  const appModule = require(indexPath);
  app = appModule.default || appModule;
} catch (error) {
  console.error('Failed to load Express app:', error);
  throw error;
}

// Export for Vercel serverless
module.exports = async (req, res) => {
  return app(req, res);
};
