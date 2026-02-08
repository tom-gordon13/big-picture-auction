import 'dotenv/config';
import { Pool } from 'pg';
import { getMetacriticScore } from '../services/metacritic';
import { getBoxOfficeData } from '../services/boxoffice';
import { getOscarNominations } from '../services/oscars';
import { getOscarOverride } from '../data/oscarOverrides';

/**
 * Test script to run the cron job logic locally and send test email
 * This connects to your local or production database based on DATABASE_URL
 */

interface MovieResult {
  title: string;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  errors: string[];
  updates: Record<string, any>;
  changes: Record<string, { old: any; new: any }>;
  reason?: string;
}

interface UpdateResults {
  total: number;
  successful: number;
  withErrors: number;
  skipped: number;
  movies: MovieResult[];
}

async function updateAllMovies(): Promise<UpdateResults> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // No SSL for local Docker database
    ssl: false,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const results: UpdateResults = {
    total: 0,
    successful: 0,
    withErrors: 0,
    skipped: 0,
    movies: []
  };

  try {
    console.log('Fetching all movies from database...\n');

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

    console.log(`Found ${movies.length} movies to process.\n`);

    for (const movie of movies) {
      console.log(`Processing: ${movie.title}...`);

      const movieResult: MovieResult = {
        title: movie.title,
        status: 'success',
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
      let year: number | undefined;
      let releaseDate: Date | undefined;

      if (movie.actualReleaseDate) {
        releaseDate = new Date(movie.actualReleaseDate);
        year = releaseDate.getFullYear();
      } else if (movie.anticipatedReleaseDate) {
        releaseDate = new Date(movie.anticipatedReleaseDate);
        year = releaseDate.getFullYear();
      }

      const currentDate = new Date();
      const isReleased = releaseDate && releaseDate <= currentDate;

      // Skip unreleased movies
      if (!isReleased) {
        movieResult.status = 'skipped';
        movieResult.reason = 'Not released yet';
        results.skipped++;
        results.movies.push(movieResult);
        console.log(`  → Skipped (not released yet)\n`);
        continue;
      }

      // Initialize stats to null/0 - we'll populate with fetched data or keep old values
      let metacriticScore: number | null = null;
      let domesticBoxOffice = 0;
      let internationalBoxOffice = 0;
      let oscarNominations: number | null = null;
      let oscarWins = 0;

      // Fetch Metacritic
      try {
        const scoreResult = await getMetacriticScore(movie.title);
        if (scoreResult && scoreResult !== 'N/A') {
          metacriticScore = parseInt(scoreResult, 10);
          if (!isNaN(metacriticScore)) {
            movieResult.updates.metacritic = metacriticScore;
          }
        }
      } catch (error: any) {
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
      } catch (error: any) {
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
        movieResult.updates.oscars = `${oscarNominations} nominations (override)`;
      } else {
        try {
          oscarNominations = await getOscarNominations(movie.title, year);
          if (oscarNominations !== null && oscarNominations > 0) {
            movieResult.updates.oscars = `${oscarNominations} nominations`;
          }
        } catch (error: any) {
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
          console.log(`  → Updated with errors: ${movieResult.errors.join(', ')}\n`);
        } else {
          results.successful++;
          console.log(`  → Success\n`);
        }
      } catch (error: any) {
        movieResult.status = 'failed';
        movieResult.errors.push(`Database: ${error.message}`);
        results.withErrors++;
        console.log(`  → Failed: ${error.message}\n`);
      }

      results.movies.push(movieResult);
    }

    // Refresh the materialized view after all updates
    console.log('\nRefreshing movie_picks_with_stats materialized view...');
    await pool.query('REFRESH MATERIALIZED VIEW movie_picks_with_stats');
    console.log('✓ Materialized view refreshed\n');
  } finally {
    await pool.end();
  }

  return results;
}

async function sendTestEmail(results: UpdateResults) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.NOTIFICATION_EMAIL || process.env.TEST_EMAIL;

  if (!RESEND_API_KEY) {
    console.log('\n⚠️  RESEND_API_KEY not found - skipping email send');
    console.log('To test email, add RESEND_API_KEY to your .env file');
    return;
  }

  if (!TO_EMAIL) {
    console.log('\n⚠️  No email recipient configured');
    console.log('Add NOTIFICATION_EMAIL or TEST_EMAIL to your .env file');
    return;
  }

  // Build email body
  const successMovies = results.movies.filter(m => m.status === 'success');
  const partialMovies = results.movies.filter(m => m.status === 'partial');
  const failedMovies = results.movies.filter(m => m.status === 'failed');
  const skippedMovies = results.movies.filter(m => m.status === 'skipped');

  // Find movies with actual changes
  const moviesWithChanges = results.movies.filter(m => Object.keys(m.changes).length > 0);

  const formatValue = (val: any, fieldName: string): string => {
    if (val === null || val === undefined) return 'none';
    if (fieldName === 'Domestic Box Office') {
      return `$${(val / 1_000_000).toFixed(1)}M`;
    }
    return String(val);
  };

  let html = `
    <h2>🎬 Movie Stats Update Complete</h2>
    <p><em>This is a test email from your local environment</em></p>
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
    console.log(`\n📧 Sending test email to ${TO_EMAIL}...`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Big Picture Auction <onboarding@resend.dev>',
        to: [TO_EMAIL],
        subject: `[TEST] Movie Stats Update: ${moviesWithChanges.length} changes, ${results.successful} updated`,
        html: html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to send email:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ Email sent successfully!');
      console.log(`   Email ID: ${data.id}`);
    }
  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Test Cron Job - Movie Stats Update + Email        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    const results = await updateAllMovies();

    console.log('\n' + '='.repeat(60));
    console.log('UPDATE SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total movies:     ${results.total}`);
    console.log(`✅ Successful:    ${results.successful}`);
    console.log(`⚠️  With errors:   ${results.withErrors}`);
    console.log(`⏭️  Skipped:       ${results.skipped}`);
    console.log('='.repeat(60));

    // Send test email
    await sendTestEmail(results);

    console.log('\n✅ Test complete!\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
