# Database Seed Script with IMDb Integration

## Overview

The seed script (`prisma/seed.ts`) populates the database with the movie auction data, including players, movies, picks, and automatically fetches movie posters and genres from IMDb.

## What Gets Seeded

### Players (3)
- **Sean Fennessy**
- **Amanda Dobbins**
- **Chris Ryan**

### Movies (15)
The script seeds the following movies:
1. The Odyssey
2. Toy Story 5
3. Narnia: The Magician's Nephew
4. Digger
5. Jack of Spades
6. Dune: Part 3
7. Project Hail Mary
8. The Social Reckoning
9. Verity
10. The Mandalorian & Grogu
11. Wuthering Heights
12. Resident Evil
13. The Devil Wears Prada 2
14. The Adventures of Cliff Booth
15. Disclosure Day

### Movie Picks (12)

**Sean Fennessy's picks (4):**
- The Odyssey ($250)
- Toy Story 5 ($200)
- Narnia: The Magician's Nephew ($180)
- Digger ($150)
- **Total spent: $780**

**Amanda Dobbins' picks (4):**
- Dune: Part 3 ($280)
- Project Hail Mary ($220)
- The Social Reckoning ($190)
- Verity ($160)
- **Total spent: $850**

**Chris Ryan's picks (4):**
- Wuthering Heights ($300)
- Resident Evil ($240)
- The Devil Wears Prada 2 ($200)
- The Adventures of Cliff Booth ($170)
- **Total spent: $910**

### Auction
- **2026 Winter Auction** (Year 2026, Cycle 1)
- Budget per player: $1,000
- Status: Active

### Studios (6)
- Warner Bros
- Universal Pictures
- Paramount Pictures
- Disney
- Sony Pictures
- Legendary Pictures

## IMDb Integration

The seed script automatically fetches for each movie:
- **Poster URL** (high-quality movie poster from IMDb)
- **Genre** (movie genre/category)

### Requirements

To enable IMDb data fetching, you need an OMDb API key:

1. Get a free API key: http://www.omdbapi.com/apikey.aspx
2. Add to `.env`: `OMDB_API_KEY=your_key_here`
3. Run the seed script

**Without API Key:**
- Script will still run successfully
- Movies will be created with default genre "Drama"
- Poster URLs will be null

**With API Key:**
- Automatically fetches real movie posters
- Fetches actual genres from IMDb
- Adds a small delay between requests to avoid rate limiting

## Running the Seed Script

### Using npm script:
```bash
npm run seed
```

### Using npx:
```bash
npx tsx prisma/seed.ts
```

### Using Prisma:
```bash
npx prisma db seed
```

## Output

The script provides detailed output:

```
╔════════════════════════════════════════════════════════╗
║         Database Seed with IMDb Data                  ║
╚════════════════════════════════════════════════════════╝

Step 1: Clearing existing data...
✓ Cleared existing data

Step 2: Creating studios...
✓ Created 6 studios

Step 3: Creating players...
✓ Created 3 players

Step 4: Fetching IMDb data for movies...
Fetching: "The Odyssey"
  ✓ Found "The Odyssey" (2025)
    Poster: https://m.media-amazon.com/images/...
    Genre: Action, Adventure, Drama

... (continues for all movies)

Step 5: Creating movies with IMDb data...
  Creating: "The Odyssey" (with IMDb data)
  ...

Step 6: Creating auction...
✓ Created auction: 2026 Winter Auction

Step 7: Creating player auctions...
✓ Created 3 player auctions

Step 8: Creating picks based on moviePicks configuration...
  Sean Fennessy:
    ✓ Picked "The Odyssey" for $250
    ...

Step 9: Updating player auction budgets...
  Sean Fennessy: Spent $780, Remaining $220
  Amanda Dobbins: Spent $850, Remaining $150
  Chris Ryan: Spent $910, Remaining $90

═══════════════════════════════════════════════════════
✓ Database seed completed successfully!
═══════════════════════════════════════════════════════

Summary:
  Studios: 6
  Players: 3
  Movies: 15
  Picks: 12
  Auction: 2026 Winter Auction
```

## Modifying the Seed Data

### Adding/Removing Players

Edit the `playerList` object in `prisma/seed.ts`:

```typescript
const playerList = {
  FENNESSY: { firstName: 'Sean', lastName: 'Fennessy' },
  DOBBINS: { firstName: 'Amanda', lastName: 'Dobbins' },
  RYAN: { firstName: 'Chris', lastName: 'Ryan' },
  // Add more players here
};
```

### Adding/Removing Movies

Edit the `movieTitles` array:

```typescript
const movieTitles = [
  'The Odyssey',
  'Toy Story 5',
  // Add or remove movie titles here
];
```

### Changing Picks

Edit the `moviePicks` object to assign different movies to players:

```typescript
const moviePicks = {
  [playerList.FENNESSY.lastName]: [...movieTitles.slice(0, 4)],  // First 4 movies
  [playerList.DOBBINS.lastName]: [...movieTitles.slice(5, 9)],   // Movies 5-8
  [playerList.RYAN.lastName]: [...movieTitles.slice(10, 14)],    // Movies 10-13
};
```

### Changing Purchase Amounts

Edit the `purchaseAmounts` object:

```typescript
const purchaseAmounts = {
  [playerList.FENNESSY.lastName]: [250, 200, 180, 150],
  [playerList.DOBBINS.lastName]: [280, 220, 190, 160],
  [playerList.RYAN.lastName]: [300, 240, 200, 170],
};
```

## Important Notes

⚠️ **The seed script clears ALL existing data** before seeding:
- All movie stats
- All picks
- All player auctions
- All auctions
- All movies
- All studios
- All players

💡 **Rate Limiting**: The script adds a 200ms delay between IMDb API calls to avoid rate limiting

🔑 **API Key**: Without an OMDb API key, the script will still work but won't fetch posters/genres

📊 **Materialized View**: After seeding, you may want to refresh the materialized view:
```bash
curl -X POST http://localhost:5000/api/materialized-view/refresh
```

## Troubleshooting

### "OMDB_API_KEY not found"
- This is a warning, not an error
- The script will still complete successfully
- Add the API key to `.env` to enable IMDb data fetching

### Database connection errors
- Ensure PostgreSQL is running
- Check database credentials in the seed script match your setup
- Verify the database `big_picture_auction` exists

### IMDb data not found
- Some movies may not exist on IMDb (especially unreleased films)
- The script will continue and use default values
- You can manually update poster URLs later
