-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "budget" INTEGER,
    "director" TEXT,
    "anticipatedReleaseDate" TIMESTAMP(3),
    "actualReleaseDate" TIMESTAMP(3),
    "genre" TEXT,
    "posterUrl" TEXT,
    "trailerUrl" TEXT,
    "status" TEXT DEFAULT 'announced',
    "studioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auctions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cycle" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budgetPerPlayer" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_auctions" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "remainingBudget" INTEGER NOT NULL,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "picks" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "purchaseAmount" INTEGER NOT NULL,
    "pickDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "picks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_stats" (
    "id" TEXT NOT NULL,
    "movieId" TEXT NOT NULL,
    "oscarNominations" INTEGER NOT NULL DEFAULT 0,
    "oscarWins" INTEGER NOT NULL DEFAULT 0,
    "domesticBoxOffice" BIGINT NOT NULL DEFAULT 0,
    "internationalBoxOffice" BIGINT NOT NULL DEFAULT 0,
    "metacriticScore" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "studios_name_key" ON "studios"("name");

-- CreateIndex
CREATE UNIQUE INDEX "auctions_year_cycle_key" ON "auctions"("year", "cycle");

-- CreateIndex
CREATE UNIQUE INDEX "player_auctions_playerId_auctionId_key" ON "player_auctions"("playerId", "auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "picks_playerId_movieId_auctionId_key" ON "picks"("playerId", "movieId", "auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "picks_movieId_auctionId_key" ON "picks"("movieId", "auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "movie_stats_movieId_key" ON "movie_stats"("movieId");

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "studios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_auctions" ADD CONSTRAINT "player_auctions_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_auctions" ADD CONSTRAINT "player_auctions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "picks" ADD CONSTRAINT "picks_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_stats" ADD CONSTRAINT "movie_stats_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
