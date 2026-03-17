import "dotenv/config";
import express from "express";
import cors from "cors";

import prismaPkg from "@prisma/client";
import pgPkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaPkg;
const { Pool } = pgPkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const app = express();

app.use(cors());
app.use(express.json());

async function ensureDemoUsers() {
  await prisma.user.upsert({
    where: { email: "me@demo.local" },
    update: {},
    create: { email: "me@demo.local", name: "Me" },
  });
  await prisma.user.upsert({
    where: { email: "her@demo.local" },
    update: {},
    create: { email: "her@demo.local", name: "Her" },
  });
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  res.json(users);
});

app.get("/api/movies", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: "desc" },
    include: { entries: { where: { userId } } },
  });

  // flatten entry for selected user
  const out = movies.map(m => {
    const entry = m.entries[0] || null;
    return {
      id: m.id,
      title: m.title,
      year: m.year,
      endYear: m.endYear ?? null,
      posterUrl: m.posterUrl ?? null,
      imdbId: m.imdbId ?? null,
      genres: m.genres ?? [],
      plot: m.plot ?? null,
      runtime: m.runtime ?? null,
      mediaType: m.mediaType ?? "movie",
      imdbRating: m.imdbRating ?? null,
      status: entry?.status ?? "WANT",
      rating: entry?.rating ?? null,
      notes: entry?.notes ?? "",
    };
  });

  res.json(out);
});

app.post("/api/movies", async (req, res) => {
  const { userId, title, year, status, rating, notes, posterUrl, imdbId, genres, plot, runtime, mediaType, imdbRating, endYear } = req.body;
  if (!userId || !title) return res.status(400).json({ error: "userId + title required" });

  const movie = await prisma.movie.create({
    data: {
      title,
      year: year ? Number(year) : null,
      endYear: endYear ? Number(endYear) : null,
      posterUrl: posterUrl || null,
      imdbId: imdbId || null,
      genres: Array.isArray(genres) ? genres : [],
      plot: plot || null,
      runtime: runtime ? Number(runtime) : null,
      mediaType: mediaType || "movie",
      imdbRating: imdbRating != null ? Number(imdbRating) : null,
      entries: {
        create: {
          userId: Number(userId),
          status: status || "WANT",
          rating: rating != null ? Number(rating) : null,
          notes: notes || "",
        },
      },
    },
  });

  res.json(movie);
});

app.put("/api/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { userId, title, year, status, rating, notes, posterUrl, imdbId, genres, plot, runtime, mediaType, imdbRating, endYear } = req.body;

  const movie = await prisma.movie.update({
    where: { id },
    data: {
      title: title ?? undefined,
      year: year !== undefined ? (year ? Number(year) : null) : undefined,
      endYear: endYear !== undefined ? (endYear ? Number(endYear) : null) : undefined,
      posterUrl: posterUrl !== undefined ? (posterUrl || null) : undefined,
      imdbId: imdbId !== undefined ? (imdbId || null) : undefined,
      genres: genres !== undefined ? (Array.isArray(genres) ? genres : []) : undefined,
      plot: plot !== undefined ? (plot || null) : undefined,
      runtime: runtime !== undefined ? (runtime ? Number(runtime) : null) : undefined,
      mediaType: mediaType !== undefined ? (mediaType || "movie") : undefined,
      imdbRating: imdbRating !== undefined ? (imdbRating != null ? Number(imdbRating) : null) : undefined,
    },
  });

  if (userId) {
    await prisma.movieEntry.upsert({
      where: { userId_movieId: { userId: Number(userId), movieId: id } },
      update: {
        status: status ?? undefined,
        rating: rating != null ? Number(rating) : undefined,
        notes: notes ?? undefined,
      },
      create: {
        userId: Number(userId),
        movieId: id,
        status: status || "WANT",
        rating: rating != null ? Number(rating) : null,
        notes: notes || "",
      },
    });
  }

  res.json({ ok: true, movie });
});

app.delete("/api/movies/:id", async (req, res) => {
  const id = Number(req.params.id);
  await prisma.movie.delete({ where: { id } });
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;

ensureDemoUsers()
  .then(() => app.listen(PORT, () => console.log(`API http://localhost:${PORT}`)))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
