// Vercel serverless function that loads the compiled Express app
const path = require('path');

// Load the compiled Express app from backend/dist
const app = require(path.join(__dirname, '..', 'backend', 'dist', 'src', 'index.js')).default;

module.exports = app;
