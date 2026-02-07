# Vercel Deployment Checklist

Use this checklist to deploy your Big Picture Auction app to Vercel.

## Pre-Deployment

- [ ] Commit and push all changes to GitHub
- [ ] Ensure all tests pass locally
- [ ] Verify Docker setup works locally (`docker-compose up`)

## Database Setup

- [ ] Create Vercel Postgres database OR sign up for Neon
- [ ] Copy database connection strings:
  - [ ] `DATABASE_URL`
  - [ ] `POSTGRES_PRISMA_URL` (Vercel Postgres only)
  - [ ] `POSTGRES_URL_NON_POOLING` (Vercel Postgres only)

## Vercel Project Setup

- [ ] Create new project in Vercel Dashboard
- [ ] Import GitHub repository
- [ ] Verify `vercel.json` is detected

## Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### API Variables
- [ ] `DATABASE_URL` = `<your-postgres-connection-string>`
- [ ] `POSTGRES_PRISMA_URL` = `<your-prisma-url>` (if using Vercel Postgres)
- [ ] `POSTGRES_URL_NON_POOLING` = `<non-pooling-url>` (if using Vercel Postgres)
- [ ] `PORT` = `5000`
- [ ] `NODE_ENV` = `production`

### UI Variables
- [ ] `REACT_APP_API_URL` = `https://your-project.vercel.app/api`
  - Note: Initially set to your expected URL, or update after first deployment

## Initial Deployment

- [ ] Click **Deploy** in Vercel Dashboard
- [ ] Wait for build to complete
- [ ] Note your deployment URL (e.g., `https://your-project.vercel.app`)

## Update UI Environment Variable

- [ ] Go to Settings → Environment Variables
- [ ] Update `REACT_APP_API_URL` with your actual deployment URL
- [ ] Redeploy (Deployments → three dots → Redeploy)

## Database Migration

Choose one method:

### Method A: Using Vercel CLI locally
```bash
export DATABASE_URL="<your-vercel-postgres-url>"
cd api
npx prisma migrate deploy
npm run seed  # Optional: seed with initial data
```

### Method B: Using Vercel Dashboard Console
- [ ] Go to Deployments → your deployment → More → Console
- [ ] Run:
  ```bash
  cd api
  npx prisma migrate deploy
  npm run seed
  ```

## Verification

- [ ] Visit your deployment URL
- [ ] Check API health: `https://your-project.vercel.app/api/health`
  - Should return: `{"status":"ok","message":"API is running","database":"connected"}`
- [ ] Check leaderboard: `https://your-project.vercel.app/api/auctions/latest/leaderboard`
- [ ] Test UI functionality (select year, view players, etc.)
- [ ] Check browser console for errors
- [ ] Test on mobile device or responsive mode

## Post-Deployment (Optional)

- [ ] Set up custom domain (Settings → Domains)
- [ ] Configure deployment notifications (Settings → Notifications)
- [ ] Set up error monitoring (e.g., Sentry)
- [ ] Review security headers
- [ ] Enable analytics

## Troubleshooting

If something goes wrong:

1. **Check Deployment Logs**
   - Vercel Dashboard → Deployments → select deployment → Logs

2. **Check Runtime Logs**
   - Vercel Dashboard → Deployments → Functions tab
   - Click on any function to see logs

3. **Common Issues**
   - Database connection: Verify `DATABASE_URL` is correct and includes `?sslmode=require`
   - API 404s: Check `vercel.json` routing configuration
   - CORS errors: Verify `REACT_APP_API_URL` matches actual API URL
   - Build failures: Check for TypeScript errors or missing dependencies

## Automatic Deployments

Once set up, Vercel will automatically:
- [ ] Deploy on push to `main` branch (production)
- [ ] Create preview deployments for pull requests
- [ ] Run build checks on each deployment

## Maintenance

Regular tasks:
- [ ] Monitor deployment logs for errors
- [ ] Check database storage usage
- [ ] Review Vercel usage dashboard
- [ ] Keep dependencies updated
- [ ] Backup database regularly

## Quick Commands

```bash
# Deploy to production
vercel --prod

# View logs
vercel logs <deployment-url>

# Open dashboard
vercel dashboard

# Pull environment variables locally
vercel env pull
```

---

**Need Help?**
- See detailed guide: `VERCEL_DEPLOYMENT.md`
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
