import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

import prismaPkg from "@prisma/client";
import pgPkg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = prismaPkg;
const { Pool } = pgPkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const app = express();

function getCorsOptions() {
  const rawOrigins = process.env.CORS_ORIGIN;
  if (!rawOrigins) return undefined;

  const origins = rawOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!origins.length) return undefined;

  return {
    origin: origins,
  };
}

function shouldSeedDemoUsers() {
  if (process.env.ENABLE_DEMO_USERS) {
    return process.env.ENABLE_DEMO_USERS === "true";
  }
  return process.env.NODE_ENV !== "production";
}

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: "20mb" }));

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

app.post("/api/users", async (req, res) => {
  const { name, email } = req.body;
  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ error: "name and email are required" });
  }
  try {
    const user = await prisma.user.create({
      data: { name: name.trim(), email: email.trim().toLowerCase() },
      select: { id: true, name: true, email: true },
    });
    res.status(201).json(user);
  } catch (e) {
    if (e.code === "P2002") {
      return res.status(409).json({ error: "A user with that email already exists" });
    }
    throw e;
  }
});

// ── Export / Import ──────────────────────────────────────────────────────────

app.get("/api/export", async (req, res) => {
  const [users, movies, entries] = await Promise.all([
    prisma.user.findMany(),
    prisma.movie.findMany(),
    prisma.movieEntry.findMany(),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="carrotspops-archive-${date}.json"`);
  res.json({ exportedAt: new Date().toISOString(), version: 1, users, movies, entries });
});

app.post("/api/import", async (req, res) => {
  const { users = [], movies = [], entries = [] } = req.body ?? {};
  if (!Array.isArray(users) || !Array.isArray(movies) || !Array.isArray(entries)) {
    return res.status(400).json({ error: "Invalid archive format" });
  }

  const imported = { users: 0, movies: 0, entries: 0 };

  await prisma.$transaction(async (tx) => {
    for (const { createdAt: _c, updatedAt: _u, ...u } of users) {
      await tx.user.upsert({
        where: { id: u.id },
        update: { name: u.name, email: u.email },
        create: u,
      });
      imported.users++;
    }

    for (const { createdAt: _c, updatedAt: _u, entries: _e, ...m } of movies) {
      await tx.movie.upsert({
        where: { id: m.id },
        update: m,
        create: m,
      });
      imported.movies++;
    }

    for (const { createdAt: _c, updatedAt: _u, id: _id, userId, movieId, ...rest } of entries) {
      const userOk = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      const movieOk = await tx.movie.findUnique({ where: { id: movieId }, select: { id: true } });
      if (!userOk || !movieOk) continue;
      await tx.movieEntry.upsert({
        where: { userId_movieId: { userId, movieId } },
        update: rest,
        create: { userId, movieId, ...rest },
      });
      imported.entries++;
    }
  });

  res.json({ ok: true, imported });
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

let wss;

app.post("/api/alert", (req, res) => {
  const apiKey = process.env.ALERT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ALERT_API_KEY not configured" });
  }

  const authHeader = req.headers["authorization"] ?? "";
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : req.headers["x-alert-key"];

  if (provided !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { title, text, time } = req.body ?? {};
  if (typeof title !== "string" || !title.trim() ||
      typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "title and text are required strings" });
  }
  if (time !== undefined && (typeof time !== "number" || time < 0)) {
    return res.status(400).json({ error: "time must be a non-negative number (seconds)" });
  }

  const payload = JSON.stringify({ title: title.trim(), text: text.trim(), time: time ?? null });
  let sent = 0;
  for (const client of wss.clients) {
    if (client.readyState === 1) { client.send(payload); sent++; }
  }

  res.json({ ok: true, recipients: sent });
});

const bootstrap = async () => {
  if (shouldSeedDemoUsers()) {
    await ensureDemoUsers();
  }

  const httpServer = createServer(app);

  wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    if (req.url === "/alerts") {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    ws.on("error", (err) => console.error("WS client error:", err));
  });

  httpServer.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
};

bootstrap()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
