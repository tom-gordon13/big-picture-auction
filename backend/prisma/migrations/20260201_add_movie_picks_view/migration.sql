-- CreateMaterializedView: movie_picks_with_stats
-- This view combines movies, their stats, the players who picked them, and auction details
-- Materialized for performance on read-heavy operations

CREATE MATERIALIZED VIEW movie_picks_with_stats AS
SELECT
    -- Movie information
    m.id AS movie_id,
    m.title AS movie_title,
    m.director,
    m.genre,
    m.budget,
    m."anticipatedReleaseDate" AS anticipated_release_date,
    m."actualReleaseDate" AS actual_release_date,
    m.status AS movie_status,
    m."posterUrl" AS poster_url,
    m."trailerUrl" AS trailer_url,

    -- Studio information
    s.name AS studio_name,
    s."logoUrl" AS studio_logo_url,

    -- Movie stats
    COALESCE(ms."oscarNominations", 0) AS oscar_nominations,
    COALESCE(ms."oscarWins", 0) AS oscar_wins,
    COALESCE(ms."domesticBoxOffice", 0) AS domestic_box_office,
    COALESCE(ms."internationalBoxOffice", 0) AS international_box_office,
    COALESCE(ms."domesticBoxOffice", 0) + COALESCE(ms."internationalBoxOffice", 0) AS total_box_office,
    ms."metacriticScore" AS metacritic_score,
    ms."updatedAt" AS stats_updated_at,

    -- Pick information
    pk.id AS pick_id,
    pk."purchaseAmount" AS purchase_amount,
    pk."pickDate" AS pick_date,

    -- Player information
    pl.id AS player_id,
    pl."firstName" AS player_first_name,
    pl."lastName" AS player_last_name,
    CONCAT(pl."firstName", ' ', pl."lastName") AS player_full_name,

    -- Auction information
    a.id AS auction_id,
    a.name AS auction_name,
    a.year AS auction_year,
    a.cycle AS auction_cycle,
    a.status AS auction_status,
    a."startDate" AS auction_start_date,
    a."endDate" AS auction_end_date,
    a."budgetPerPlayer" AS auction_budget_per_player,

    -- Calculated fields for points/achievements
    CASE
        WHEN COALESCE(ms."domesticBoxOffice", 0) + COALESCE(ms."internationalBoxOffice", 0) >= 100000000 THEN 1
        ELSE 0
    END AS box_office_achieved,

    CASE
        WHEN COALESCE(ms."oscarNominations", 0) > 0 THEN 1
        ELSE 0
    END AS oscar_achieved,

    CASE
        WHEN ms."metacriticScore" >= 85 THEN 1
        ELSE 0
    END AS metacritic_achieved,

    -- Total points for this pick
    (
        CASE WHEN COALESCE(ms."domesticBoxOffice", 0) + COALESCE(ms."internationalBoxOffice", 0) >= 100000000 THEN 1 ELSE 0 END +
        CASE WHEN COALESCE(ms."oscarNominations", 0) > 0 THEN 1 ELSE 0 END +
        CASE WHEN ms."metacriticScore" >= 85 THEN 1 ELSE 0 END
    ) AS total_points

FROM movies m
INNER JOIN picks pk ON m.id = pk."movieId"
INNER JOIN players pl ON pk."playerId" = pl.id
INNER JOIN auctions a ON pk."auctionId" = a.id
INNER JOIN studios s ON m."studioId" = s.id
LEFT JOIN movie_stats ms ON m.id = ms."movieId";

-- Create indexes for common query patterns
CREATE UNIQUE INDEX movie_picks_with_stats_unique_idx ON movie_picks_with_stats (pick_id);
CREATE INDEX movie_picks_with_stats_movie_idx ON movie_picks_with_stats (movie_id);
CREATE INDEX movie_picks_with_stats_player_idx ON movie_picks_with_stats (player_id);
CREATE INDEX movie_picks_with_stats_auction_idx ON movie_picks_with_stats (auction_id);
CREATE INDEX movie_picks_with_stats_auction_year_cycle_idx ON movie_picks_with_stats (auction_year, auction_cycle);
CREATE INDEX movie_picks_with_stats_player_auction_idx ON movie_picks_with_stats (player_id, auction_id);

-- Add comment to document the view
COMMENT ON MATERIALIZED VIEW movie_picks_with_stats IS
'Materialized view combining movies, stats, picks, players, and auctions.
Refreshed after movie stats updates for optimal read performance.';
