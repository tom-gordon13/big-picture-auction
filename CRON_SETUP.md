# Automated Movie Stats Updates with Vercel Cron

This guide explains how to set up automatic daily movie stats updates with email notifications.

## Overview

The cron job:
- Runs daily at 6:00 AM UTC (customize the schedule as needed)
- Updates stats for all released movies
- Skips unreleased movies automatically
- Emails you a summary of results
- Works on Vercel **Hobby plan** (free!) - timing accuracy is ±1 hour
- For exact timing, upgrade to Pro plan ($20/month)

## Setup Steps

### 1. Sign Up for Resend (Free Email Service)

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email
3. Get your API key from the dashboard
4. **Important**: On the free plan, you can only send emails FROM and TO verified domains/emails
   - Either verify your domain, OR
   - Just send to your verified email address

### 2. Add Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

#### `RESEND_API_KEY`
- Value: Your Resend API key (starts with `re_`)
- Environments: ✓ Production ✓ Preview ✓ Development

#### `NOTIFICATION_EMAIL`
- Value: Your email address (e.g., `you@example.com`)
- Environments: ✓ Production ✓ Preview ✓ Development

#### `CRON_SECRET`
- Value: Generate a random secret (e.g., `openssl rand -hex 32`)
- Environments: ✓ Production ✓ Preview ✓ Development
- This prevents unauthorized access to the cron endpoint

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Add automated movie stats cron job"
git push origin main
```

Vercel will automatically deploy with the cron configuration.

### 4. Verify Cron is Configured

1. Go to your Vercel dashboard
2. Click on your project
3. Go to **Settings** → **Cron Jobs**
4. You should see: `update-movies` running daily at 6:00 AM UTC

## Customizing the Schedule

The schedule uses cron syntax. Edit `vercel.json`:

```json
"crons": [
  {
    "path": "/api/cron/update-movies",
    "schedule": "0 6 * * *"  // <-- Edit this
  }
]
```

**Common schedules:**
- `0 6 * * *` - Daily at 6:00 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight
- `0 12 * * 1-5` - Weekdays at noon

[Cron syntax reference](https://crontab.guru/)

## Testing the Cron Job

You can manually trigger the cron job to test it:

```bash
curl -X POST https://big-picture-auction.vercel.app/api/cron/update-movies \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Replace `YOUR_CRON_SECRET` with the value you set in environment variables.

## What the Email Contains

The email summary includes:
- **Total movies processed**
- **Successfully updated** - Movies with all data fetched correctly
- **Partial updates** - Movies updated but with some errors (e.g., Metacritic not found)
- **Skipped** - Unreleased movies that were skipped
- **Failed** - Movies that couldn't be updated

Each section shows which movies were affected and what data was updated.

## Monitoring

### View Cron Execution Logs
1. Go to Vercel Dashboard → Your Project
2. Click **Deployments**
3. Click on **Functions** tab
4. Find `api/cron/update-movies`
5. Click to see execution logs

### Check Email Delivery
- Go to Resend dashboard to see email delivery status
- Check your spam folder if emails don't arrive

## Troubleshooting

### Cron job not running
- **Check deployment**: Make sure latest code is deployed
- **Check logs**: View function logs in Vercel dashboard
- **Check timing**: Hobby plan runs within ±1 hour of scheduled time
- **Wait**: First run may take up to 24 hours to initialize

### Not receiving emails
- **Check RESEND_API_KEY**: Make sure it's set correctly
- **Check NOTIFICATION_EMAIL**: Make sure it's verified in Resend
- **Check spam folder**: Emails might be filtered
- **Check Resend dashboard**: View delivery logs

### Cron times out
- Currently set to 300 seconds (5 minutes)
- If you have many movies, increase in `vercel.json`:
  ```json
  "api/cron/update-movies.js": {
    "maxDuration": 300  // Increase this (max 900 for Pro)
  }
  ```

### Function returns 401 Unauthorized
- Check that `CRON_SECRET` environment variable is set
- Vercel automatically passes this header for scheduled crons

## Cost

**Vercel Hobby Plan**: $0 (Free!)
- ✅ Cron jobs supported
- ⚠️ Timing accuracy: ±1 hour (e.g., 6 AM scheduled may run 5-7 AM)
- Perfect for daily updates where exact timing doesn't matter

**Vercel Pro**: $20/month (Optional)
- ✅ Exact timing accuracy
- ✅ Higher function limits (900s max duration)
- ✅ Better performance

**Resend Free Tier**: $0
- 3,000 emails/month
- 100 emails/day
- Perfect for daily update notifications

**Total Cost**: **$0** with Hobby + Resend free tiers!

## Alternative: Manual Updates

If you prefer manual control or need to run updates immediately:

```bash
# From your local machine
cd backend
npx tsx src/scripts/update-all-movies-direct.ts
```

Or trigger via API:
```bash
curl -X POST https://big-picture-auction.vercel.app/api/movies/update-stats/MOVIE_TITLE
```

## Disabling the Cron Job

To disable, remove the `crons` section from `vercel.json` and redeploy:

```json
{
  // ... other config
  // Remove this:
  // "crons": [...]
}
```
