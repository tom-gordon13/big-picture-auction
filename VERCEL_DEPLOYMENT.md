# Deploying Big Picture Auction to Vercel

This guide walks you through deploying your full-stack application (React UI + Express API + PostgreSQL) to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, but recommended)
   ```bash
   npm install -g vercel
   ```
3. Git repository (this project)

## Architecture Overview

Your deployed app will consist of:
- **Frontend (UI)**: React app deployed as static site on Vercel
- **Backend (API)**: Express app running as Vercel serverless functions
- **Database**: PostgreSQL (Vercel Postgres or external provider like Neon)

## Step 1: Set Up Database

### Option A: Vercel Postgres (Recommended)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database** → **Postgres**
4. Name it: `big-picture-auction-db`
5. Select a region close to your users
6. Copy the connection strings provided:
   - `POSTGRES_PRISMA_URL` (for Prisma migrations)
   - `POSTGRES_URL` (for runtime connections)
   - `POSTGRES_URL_NON_POOLING` (for Prisma migrations)

### Option B: Neon (Free Alternative)

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project: "big-picture-auction"
3. Copy the connection string (format: `postgresql://user:pass@host/db?sslmode=require`)

## Step 2: Configure Environment Variables

### Required Environment Variables

You'll need to set these in Vercel:

#### For API:
```env
DATABASE_URL=<your-postgres-url>
POSTGRES_PRISMA_URL=<your-prisma-url>  # Only if using Vercel Postgres
POSTGRES_URL_NON_POOLING=<non-pooling-url>  # Only if using Vercel Postgres
PORT=5000
NODE_ENV=production
```

#### For UI:
```env
REACT_APP_API_URL=https://your-project.vercel.app/api
```

## Step 3: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Click **Import Project**
3. Import your GitHub repository
4. Vercel will auto-detect your configuration from `vercel.json`
5. Before deploying, add environment variables:
   - Go to **Settings** → **Environment Variables**
   - Add all variables from Step 2
   - Make sure to add them for **Production**, **Preview**, and **Development**
6. Click **Deploy**

### Method 2: Deploy via Vercel CLI

1. Login to Vercel:
   ```bash
   vercel login
   ```

2. From your project root, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project or create new one
   - Answer configuration questions (defaults should work)

4. Set environment variables:
   ```bash
   vercel env add DATABASE_URL
   vercel env add REACT_APP_API_URL
   # Add all other required variables
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Migrations

After your first deployment, you need to set up the database schema:

### Using Vercel CLI:

1. Set your DATABASE_URL locally for migration:
   ```bash
   export DATABASE_URL="<your-vercel-postgres-url>"
   ```

2. Run Prisma migrations:
   ```bash
   cd api
   npx prisma migrate deploy
   ```

3. Seed the database (optional):
   ```bash
   npm run seed
   ```

### Alternative: Using Vercel's built-in terminal

1. Go to your project in Vercel Dashboard
2. Navigate to **Deployments** → select your deployment → **More** → **Console**
3. Run:
   ```bash
   cd api
   npx prisma migrate deploy
   npx prisma db seed
   ```

## Step 5: Verify Deployment

1. Visit your deployed URL (e.g., `https://your-project.vercel.app`)
2. Check the API health endpoint: `https://your-project.vercel.app/api/health`
3. Test the leaderboard: `https://your-project.vercel.app/api/auctions/latest/leaderboard`

Expected health response:
```json
{
  "status": "ok",
  "message": "API is running",
  "database": "connected"
}
```

## Step 6: Update UI to Use Production API

The UI is already configured to use `REACT_APP_API_URL` environment variable. Make sure it's set correctly in Vercel:

```env
REACT_APP_API_URL=https://your-project.vercel.app/api
```

**Important**: After adding/updating environment variables, you must redeploy for changes to take effect:
```bash
vercel --prod
```

## Troubleshooting

### Database Connection Issues

If you see "database: disconnected" in the health check:

1. Verify your `DATABASE_URL` is correct
2. Ensure SSL mode is enabled (add `?sslmode=require` to connection string)
3. Check if your database allows connections from Vercel's IP ranges

### API Returns 404

1. Check that your API routes are prefixed with `/api`
2. Verify `vercel.json` routing configuration
3. Check deployment logs in Vercel Dashboard

### Build Failures

1. Check build logs in Vercel Dashboard
2. Common issues:
   - Missing dependencies in `package.json`
   - TypeScript errors
   - Environment variables not set during build

### CORS Errors

The API is already configured with CORS enabled. If you still see CORS errors:

1. Check that `REACT_APP_API_URL` matches your actual API URL
2. Verify the API is deployed correctly
3. Check browser console for specific CORS error messages

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **Domains**
3. Add your custom domain
4. Update DNS records as instructed
5. Update `REACT_APP_API_URL` if using custom domain

### Automatic Deployments

Vercel automatically deploys:
- **Production**: When you push to your main branch
- **Preview**: When you open a pull request

### Monitoring

1. View logs: Vercel Dashboard → **Deployments** → select deployment → **Logs**
2. Monitor usage: **Settings** → **Usage**
3. Set up alerts: **Settings** → **Notifications**

## Environment-Specific Configurations

### Development
- Use local Docker setup (existing `docker-compose.yml`)
- Local database on `localhost:5432`

### Production (Vercel)
- Serverless functions for API
- Managed Postgres database
- Static React build served from CDN

## Useful Commands

```bash
# Deploy to production
vercel --prod

# View deployment logs
vercel logs <deployment-url>

# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull

# Open project in dashboard
vercel dashboard
```

## Cost Considerations

- **Vercel Free Tier**: Suitable for hobby projects
  - 100GB bandwidth
  - Serverless function execution time limits
  - 1 Vercel Postgres database (512MB)

- **Vercel Pro**: Recommended for production
  - $20/month
  - Higher limits
  - More database storage

- **Neon Free Tier** (if using instead of Vercel Postgres):
  - 512MB storage
  - 1 project
  - Suitable for development/testing

## Next Steps

1. Set up monitoring and error tracking (e.g., Sentry)
2. Configure custom domain
3. Set up CI/CD for automated testing
4. Implement database backup strategy
5. Add API rate limiting for production

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Prisma Documentation: https://www.prisma.io/docs
