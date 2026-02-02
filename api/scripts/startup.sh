#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Checking if database needs seeding..."
# Check if tables exist and have data
PLAYER_COUNT=$(node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT COUNT(*) FROM players').then(res => { console.log(res.rows[0].count); pool.end(); }).catch(() => { console.log('0'); pool.end(); });" 2>/dev/null)

if [ "$PLAYER_COUNT" = "0" ]; then
  echo "Database is empty, running seed..."
  node dist/prisma/seed.js
else
  echo "Database already has data (${PLAYER_COUNT} players), skipping seed..."
fi

echo "Starting application..."
npm start
