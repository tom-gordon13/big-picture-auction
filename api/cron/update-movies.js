// Vercel Cron Job - Update Movie Stats
// This runs on a schedule and emails results

const path = require('path');
const { Pool } = require('pg');

// Import services from backend
let getMetacriticScore, getBoxOfficeData, getOscarNominations, getOscarOverride;

try {
  const getMetacriticScorePath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'metacritic.js');
  const getBoxOfficeDataPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'boxoffice.js');
  const getOscarNominationsPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'services', 'oscars.js');
  const oscarOverridesPath = path.join(__dirname, '..', '..', 'backend', 'dist', 'src', 'data', 'oscarOverrides.js');

  console.log('Loading services from:', {
    metacritic: getMetacriticScorePath,
    boxoffice: getBoxOfficeDataPath,
    oscars: getOscarNominationsPath,
    overrides: oscarOverridesPath
  });

  ({ getMetacriticScore } = require(getMetacriticScorePath));
  ({ getBoxOfficeData } = require(getBoxOfficeDataPath));
  ({ getOscarNominations } = require(getOscarNominationsPath));
  ({ getOscarOverride } = require(oscarOverridesPath));

  console.log('Services loaded successfully');
} catch (error) {
  console.error('Failed to load services:', error);
  throw error;
}

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
    // Fetch all movies with their current stats
    const result = await pool.query(`
      SELECT
        m.id,
        m.title,
        m."actualReleaseDate",
        m."anticipatedReleaseDate",
        ms."metacriticScore",
        ms."domesticBoxOffice",
        ms."internationalBoxOffice",
        ms."oscarNominations",
        ms."oscarWins"
      FROM movies m
      LEFT JOIN movie_stats ms ON m.id = ms."movieId"
      ORDER BY m.title
    `);
    const movies = result.rows;
    results.total = movies.length;

    for (const movie of movies) {
      const movieResult = {
        title: movie.title,
        status: 'pending',
        errors: [],
        updates: {},
        changes: {}
      };

      // Store old values for comparison (convert strings to numbers for bigint fields)
      const oldStats = {
        metacriticScore: movie.metacriticScore,
        domesticBoxOffice: movie.domesticBoxOffice ? Number(movie.domesticBoxOffice) : null,
        internationalBoxOffice: movie.internationalBoxOffice ? Number(movie.internationalBoxOffice) : null,
        oscarNominations: movie.oscarNominations
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

      // Initialize stats to null/0 - we'll populate with fetched data or keep old values
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

      // Track metacritic changes (only if value actually changed)
      if (metacriticScore !== null && oldStats.metacriticScore !== null && oldStats.metacriticScore !== metacriticScore) {
        movieResult.changes['Metacritic Score'] = {
          old: oldStats.metacriticScore,
          new: metacriticScore
        };
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

      // Track domestic box office changes (only if value actually changed)
      if (domesticBoxOffice > 0 && oldStats.domesticBoxOffice !== null && oldStats.domesticBoxOffice !== domesticBoxOffice) {
        movieResult.changes['Domestic Box Office'] = {
          old: oldStats.domesticBoxOffice,
          new: domesticBoxOffice
        };
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

      // Track Oscar nomination changes (only if value actually changed)
      if (oscarNominations !== null && oldStats.oscarNominations !== null && oldStats.oscarNominations !== oscarNominations) {
        movieResult.changes['Oscar Nominations'] = {
          old: oldStats.oscarNominations,
          new: oscarNominations
        };
      }

      // Use old values if we didn't fetch new ones (to preserve existing data)
      const finalMetacriticScore = metacriticScore !== null ? metacriticScore : oldStats.metacriticScore;
      const finalDomesticBoxOffice = domesticBoxOffice > 0 ? domesticBoxOffice : (oldStats.domesticBoxOffice || 0);
      const finalInternationalBoxOffice = internationalBoxOffice > 0 ? internationalBoxOffice : (oldStats.internationalBoxOffice || 0);
      const finalOscarNominations = oscarNominations !== null ? oscarNominations : oldStats.oscarNominations;

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
          [movie.id, finalOscarNominations, oscarWins, finalDomesticBoxOffice, finalInternationalBoxOffice, finalMetacriticScore]
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

    // Refresh the materialized view after all updates
    console.log('Refreshing movie_picks_with_stats materialized view...');
    await pool.query('REFRESH MATERIALIZED VIEW movie_picks_with_stats');
    console.log('Materialized view refreshed');
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

  // Find movies with actual changes
  const moviesWithChanges = results.movies.filter(m => Object.keys(m.changes).length > 0);

  const formatValue = (val, fieldName) => {
    if (val === null || val === undefined) return 'none';
    if (fieldName === 'Domestic Box Office') {
      return `$${(val / 1_000_000).toFixed(1)}M`;
    }
    return String(val);
  };

  let html = `
    <h2>🎬 Movie Stats Update Complete</h2>
    <p><strong>Summary:</strong></p>
    <ul>
      <li>Total movies: ${results.total}</li>
      <li>✅ Successful: ${results.successful}</li>
      <li>⚠️ Partial (with errors): ${results.withErrors}</li>
      <li>⏭️ Skipped (unreleased): ${results.skipped}</li>
      <li>📊 Movies with changes: ${moviesWithChanges.length}</li>
    </ul>
  `;

  // Show changes/diffs at the top
  if (moviesWithChanges.length > 0) {
    html += `<h3>📊 Changes Detected (${moviesWithChanges.length})</h3>`;
    html += `<table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Movie</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Field</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Old</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">New</th>
        </tr>
      </thead>
      <tbody>`;

    moviesWithChanges.forEach(m => {
      Object.entries(m.changes).forEach(([field, change]) => {
        html += `
          <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>${m.title}</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${field}</td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #999;">${formatValue(change.old, field)}</td>
            <td style="padding: 8px; border: 1px solid #ddd; color: #28a745; font-weight: bold;">${formatValue(change.new, field)}</td>
          </tr>`;
      });
    });

    html += `</tbody></table>`;
  } else {
    html += `<p><em>No changes detected in this update cycle.</em></p>`;
  }

  html += `<hr style="margin: 30px 0;">`;

  // Full summary at the bottom
  html += `<h3>Full Update Summary</h3>`;

  if (successMovies.length > 0) {
    html += `<h4>✅ Successfully Updated (${successMovies.length})</h4><ul>`;
    successMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>`;
      if (Object.keys(m.updates).length > 0) {
        const updates = Object.entries(m.updates).map(([key, val]) => `${key}: ${val}`).join(', ');
        html += ` - ${updates}`;
      }
      html += `</li>`;
    });
    html += `</ul>`;
  }

  if (partialMovies.length > 0) {
    html += `<h4>⚠️ Updated with Errors (${partialMovies.length})</h4><ul>`;
    partialMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>: ${m.errors.join(', ')}</li>`;
    });
    html += `</ul>`;
  }

  if (failedMovies.length > 0) {
    html += `<h4>❌ Failed (${failedMovies.length})</h4><ul>`;
    failedMovies.forEach(m => {
      html += `<li><strong>${m.title}</strong>: ${m.errors.join(', ')}</li>`;
    });
    html += `</ul>`;
  }

  if (skippedMovies.length > 0 && skippedMovies.length <= 10) {
    html += `<h4>⏭️ Skipped (${skippedMovies.length})</h4><ul>`;
    skippedMovies.forEach(m => {
      html += `<li>${m.title} - ${m.reason}</li>`;
    });
    html += `</ul>`;
  } else if (skippedMovies.length > 10) {
    html += `<p><em>${skippedMovies.length} unreleased movies were skipped</em></p>`;
  }

  html += `<hr style="margin-top: 30px;"><p><small>Generated: ${new Date().toLocaleString()}</small></p>`;

  // Send email via Resend
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Big Picture Auction <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `Movie Stats Update: ${moviesWithChanges.length} changes, ${results.successful} updated`,
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
