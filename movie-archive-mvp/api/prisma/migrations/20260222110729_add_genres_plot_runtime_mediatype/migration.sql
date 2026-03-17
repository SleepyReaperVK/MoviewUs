-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "endYear" INTEGER,
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imdbRating" DOUBLE PRECISION,
ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'movie',
ADD COLUMN     "plot" TEXT,
ADD COLUMN     "runtime" INTEGER;
