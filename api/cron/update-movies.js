// Vercel Cron Job - Update Movie Stats
// This runs on a schedule and emails results

const path = require('path');
const { Pool } = require('pg');

// Import services from backend
const getMetacriticScorePath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'metacritic.js');
const getBoxOfficeDataPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'boxoffice.js');
const getOscarNominationsPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'oscars.js');
const oscarOverridesPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'data', 'oscarOverrides.js');

const { getMetacriticScore } = require(getMetacriticScorePath);
const { getBoxOfficeData } = require(getBoxOfficeDataPath);
const { getOscarNominations } = require(getOscarNominationsPath);
const { getOscarOverride } = require(oscarOverridesPath);

async function updateAllMovies() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const results = {
    total: 0,
    successful: 0,
    withErrors: 0,
    skipped: 0,
    movies: []
  };

  try {
    // Fetch all movies
    const result = await pool.query(
      'SELECT id, title, "actualReleaseDate", "anticipatedReleaseDate" FROM movies ORDER BY title'
    );
    const movies = result.rows;
    results.total = movies.length;

    for (const movie of movies) {
      const movieResult = {
        title: movie.title,
        status: 'pending',
        errors: [],
        updates: {}
      };

      // Extract year and check if released
      let year;
      let releaseDate;
      if (movie.actualReleaseDate) {
        releaseDate = new Date(movie.actualReleaseDate);
        year = releaseDate.getFullYear();
      } else if (movie.anticipatedReleaseDate) {
        releaseDate = new Date(movie.anticipatedReleaseDate);
        year = releaseDate.getFullYear();
      }

      const currentDate = new Date();
      const isReleased = releaseDate && releaseDate <= currentDate;

      // Initialize stats
      let metacriticScore = null;
      let domesticBoxOffice = 0;
      let internationalBoxOffice = 0;
      let oscarNominations = null;
      let oscarWins = 0;

      // Skip unreleased movies
      if (!isReleased) {
        movieResult.status = 'skipped';
        movieResult.reason = 'Not released yet';
        results.skipped++;
        results.movies.push(movieResult);
        continue;
      }

      // Fetch Metacritic
      try {
        const scoreResult = await getMetacriticScore(movie.title);
        if (scoreResult && scoreResult !== 'N/A') {
          metacriticScore = parseInt(scoreResult, 10);
          if (!isNaN(metacriticScore)) {
            movieResult.updates.metacritic = metacriticScore;
          }
        }
      } catch (error) {
        movieResult.errors.push(`Metacritic: ${error.message}`);
      }

      // Fetch Box Office
      try {
        const boxOffice = await getBoxOfficeData(movie.title, year);
        if (boxOffice) {
          domesticBoxOffice = boxOffice.domestic;
          internationalBoxOffice = boxOffice.international;
          movieResult.updates.boxOffice = `$${(boxOffice.domestic / 1_000_000).toFixed(1)}M`;
        }
      } catch (error) {
        movieResult.errors.push(`Box Office: ${error.message}`);
      }

      // Fetch Oscars
      const override = getOscarOverride(movie.title, year);
      if (override) {
        oscarNominations = override.nominations;
        movieResult.updates.oscars = `${oscarNominations} (override)`;
      } else {
        try {
          oscarNominations = await getOscarNominations(movie.title, year);
          if (oscarNominations !== null && oscarNominations > 0) {
            movieResult.updates.oscars = oscarNominations;
          }
        } catch (error) {
          movieResult.errors.push(`Oscars: ${error.message}`);
        }
      }

      // Save to database
      try {
        await pool.query(
          `INSERT INTO movie_stats (id, "movieId", "oscarNominations", "oscarWins", "domesticBoxOffice", "internationalBoxOffice", "metacriticScore", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT ("movieId")
           DO UPDATE SET
             "oscarNominations" = EXCLUDED."oscarNominations",
             "oscarWins" = EXCLUDED."oscarWins",
             "domesticBoxOffice" = EXCLUDED."domesticBoxOffice",
             "internationalBoxOffice" = EXCLUDED."internationalBoxOffice",
             "metacriticScore" = EXCLUDED."metacriticScore",
             "updatedAt" = NOW()`,
          [movie.id, oscarNominations, oscarWins, domesticBoxOffice, internationalBoxOffice, metacriticScore]
        );

        movieResult.status = movieResult.errors.length > 0 ? 'partial' : 'success';
        if (movieResult.errors.length > 0) {
          results.withErrors++;
        } else {
          results.successful++;
        }
      } catch (error) {
        movieResult.status = 'failed';
        movieResult.errors.push(`Database: ${error.message}`);
        results.withErrors++;
      }

      results.movies.push(movieResult);
    }
  } finally {
    await pool.end();
  }

  return results;
}

async function sendEmail(results) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.NOTIFICATION_EMAIL;

  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.log('Skipping email - RESEND_API_KEY or NOTIFICATION_EMAIL not configured');
    return;
  }

  // Build email body
  const successMovies = results.movies.filter(m => m.status === 'success');
  const partialMovies = results.movies.filter(m => m.status === 'partial');
  const failedMovies = results.movies.filter(m => m.status === 'failed');
  const skippedMovies = results.movies.filter(m => m.status === 'skipped');

  let html = `
    <h2>Movie Stats Update Complete</h2>
    <p><strong>Summary:</strong></p>
    <ul>
      <li>Total movies: ${results.total}</li>
      <li>✅ Successful: ${results.successful}</li>
      <li>⚠️ Partial (with errors): ${results.withErrors}</li>
      <li>⏭️ Skipped (unreleased): ${results.skipped}</li>
    </ul>
  `;

  if (successMovies.length > 0) {
    html += `<h3>✅ Successfully Updated (${successMovies.length})</h3><ul>`;
    successMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>`;
      if (Object.keys(m.updates).length > 0) {
        html += ` - ${JSON.stringify(m.updates)}`;
      }
      html += `</li>`;
    });
    html += `</ul>`;
  }

  if (partialMovies.length > 0) {
    html += `<h3>⚠️ Updated with Errors (${partialMovies.length})</h3><ul>`;
    partialMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>: ${m.errors.join(', ')}</li>`;
    });
    html += `</ul>`;
  }

  if (failedMovies.length > 0) {
    html += `<h3>❌ Failed (${failedMovies.length})</h3><ul>`;
    failedMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>: ${m.errors.join(', ')}</li>`;
    });
    html += `</ul>`;
  }

  // Send email via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Big Picture Auction <noreply@updates.yourdomain.com>',
        to: [TO_EMAIL],
        subject: `Movie Stats Update: ${results.successful} updated, ${results.withErrors} errors`,
        html: html,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
    } else {
      console.log('Email sent successfully');
    }
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

module.exports = async (req, res) => {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting movie stats update cron job...');
    const results = await updateAllMovies();

    // Send email notification
    await sendEmail(results);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results
    });
  } catch (error) {
    console.error('Cron job error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
