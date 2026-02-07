# Adding Additional Auction Cycles

This guide shows you how to add a second (or third, fourth, etc.) auction cycle for a given year.

## Understanding Cycles

- Each year can have multiple auction cycles (rounds)
- Each cycle represents a separate set of movie picks for that year
- All cycles for a year are displayed together in the UI with visual dividers
- Points, budget, and rankings are combined across all cycles for a given year

## Example: Adding Cycle 2 for 2026

### Step 1: Update the Movie Picks in `seed.ts`

Add cycle 2 picks to the `moviePicks2026` object:

```typescript
const moviePicks2026: Record<string, MoviePick2026[]> = {
  [playerList.FENNESSY.lastName]: [
    // Cycle 1 picks
    { title: 'The Odyssey', price: 926, cycle: 1 },
    { title: 'Toy Story 5', price: 1, cycle: 1 },
    { title: 'Narnia', price: 18, cycle: 1 },
    { title: 'Digger', price: 5, cycle: 1 },
    { title: 'Jack of Spades', price: 50, cycle: 1 },

    // Cycle 2 picks (NEW!)
    { title: 'Some New Movie', price: 200, cycle: 2 },
    { title: 'Another Film', price: 150, cycle: 2 },
    // ... add 5 movies per player for cycle 2
  ],
  // ... repeat for other players
};
```

### Step 2: Add the Movies to the Movie List

If you're adding new movies that don't exist yet, add them to `movieTitles2026`:

```typescript
const movieTitles2026 = [
  // Existing movies...
  'The Odyssey',
  'Toy Story 5',
  // ... etc

  // New movies for cycle 2
  'Some New Movie',
  'Another Film',
  // ... etc
] as const;
```

### Step 3: Create the Auction in the Seed Script

Add a new auction creation step in the `main()` function:

```typescript
console.log('Step 9b: Creating 2026 Summer Auction (Cycle 2)...');
const auction2026Summer = await prisma.auction.create({
  data: {
    name: '2026 Summer Auction',
    year: 2026,
    cycle: 2,  // This is the key difference!
    startDate: new Date('2026-06-01'),
    endDate: new Date('2026-12-31'),
    budgetPerPlayer: 1000,
    status: 'active',
  },
});
console.log(`✓ Created auction: ${auction2026Summer.name}\n`);
```

### Step 4: Create Player Auctions for Cycle 2

```typescript
console.log('Step 13b: Creating player auctions for 2026 Cycle 2...');
const playerAuctions2026Cycle2 = await Promise.all(
  players.map((player) =>
    prisma.playerAuction.create({
      data: {
        playerId: player.id,
        auctionId: auction2026Summer.id,  // Use the new auction ID
        remainingBudget: 1000,
        totalSpent: 0,
        totalPoints: 0,
      },
    })
  )
);
console.log(`✓ Created ${playerAuctions2026Cycle2.length} player auctions for 2026 Cycle 2\n`);
```

### Step 5: Create Picks for Cycle 2

The existing pick creation logic will handle cycle 2 picks automatically since we:
1. Added `cycle: 2` to the picks in `moviePicks2026`
2. The validation will ensure picks match the auction cycle

You can duplicate the pick creation code and modify it to use `auction2026Summer.id` and filter for `cycle === 2`.

### Step 6: Run the Seed Script

```bash
npm run seed
```

## Result

After seeding, when you view 2026 in the UI, you'll see:

```
┌─────────────────┐
│ Player Column   │
├─────────────────┤
│ Movie 1 (C1)    │
│ Movie 2 (C1)    │
│ Movie 3 (C1)    │
│ Movie 4 (C1)    │
│ Movie 5 (C1)    │
├─ Round 2 ───────┤  ← Visual divider
│ Movie 6 (C2)    │
│ Movie 7 (C2)    │
│ Movie 8 (C2)    │
│ Movie 9 (C2)    │
│ Movie 10 (C2)   │
└─────────────────┘
```

## How the Cycle Information Flows

1. **In `moviePicks20XX` objects**: Each pick has a `cycle` field
2. **In the `Pick` table**: Each pick is linked to an `auctionId`
3. **In the `Auction` table**: Each auction has a `cycle` field
4. **In the API**: When fetching picks, we include the auction data and extract `pick.auction.cycle`
5. **In the UI**: Movies are grouped by cycle and displayed with dividers between cycles

All budget totals, points, and rankings are calculated across all cycles for the year automatically!
