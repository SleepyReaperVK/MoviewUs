export type Status = "WANT" | "WATCHED";

export type User = {
  id: number;
  name: string;
  email?: string;
};

export type MovieRow = {
  id: number;
  title: string;
  year: number | null;
  endYear: number | null;
  posterUrl: string | null;
  imdbId: string | null;
  genres: string[];
  plot: string | null;
  runtime: number | null;
  mediaType: string;
  imdbRating: number | null;
  status: Status;
  rating: number | null;
  notes: string;
};

/** IMDB API search result shape (from /search/titles) */
export type IMDBTitle = {
  id: string;
  type: string;
  primaryTitle: string;
  originalTitle: string;
  primaryImage?: {
    url: string;
    width: number;
    height: number;
  } | null;
  startYear?: number | null;
  endYear?: number | null;
  rating?: {
    aggregateRating: number;
    voteCount: number;
  } | null;
};

/** IMDB title detail shape (from /titles/{id}) */
export type IMDBTitleDetail = IMDBTitle & {
  runtimeSeconds?: number | null;
  genres?: string[];
  plot?: string | null;
};
