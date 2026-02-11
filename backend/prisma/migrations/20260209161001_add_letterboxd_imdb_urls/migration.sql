-- AlterTable
ALTER TABLE "movie_stats" ALTER COLUMN "oscarNominations" DROP NOT NULL,
ALTER COLUMN "oscarNominations" DROP DEFAULT;

-- AlterTable
ALTER TABLE "movies" ADD COLUMN     "imdbUrl" TEXT,
ADD COLUMN     "letterboxdUrl" TEXT;
