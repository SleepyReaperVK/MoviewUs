import { useEffect, useState } from "react";
import { fetchUsers, fetchMovies, createUser, exportArchive, importArchive } from "../services/api";
import type { ArchiveSnapshot } from "../services/api";
import type { User, MovieRow } from "../types";

/**
 * Custom hook that manages users + movies state.
 * Automatically loads movies when the selected userId changes.
 */
export function useMovies() {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [movies, setMovies] = useState<MovieRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadUsers() {
    try {
      const data = await fetchUsers();
      setUsers(data);
      setUserId(data[0]?.id ?? null);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadMovies(uid: number | null) {
    if (!uid) {
      setMovies([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchMovies(uid);
      setMovies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadMovies(userId);
  }, [userId]);

  /** Re-fetch movies for the current user (e.g. after adding a new movie). */
  function refetch() {
    loadMovies(userId);
  }

  /** Create a user and auto-select them. */
  async function addUser(name: string, email: string): Promise<User> {
    const user = await createUser(name, email);
    const updated = await fetchUsers();
    setUsers(updated);
    setUserId(user.id);
    return user;
  }

  /** Download the full archive JSON. */
  async function handleExport() {
    await exportArchive();
  }

  /** Import an archive snapshot then reload everything. */
  async function handleImport(snapshot: ArchiveSnapshot) {
    await importArchive(snapshot);
    const updated = await fetchUsers();
    setUsers(updated);
    if (updated.length > 0) {
      const next = updated.find((u) => u.id === userId) ?? updated[0];
      setUserId(next.id);
    }
  }

  return { users, userId, setUserId, movies, loading, refetch, addUser, handleExport, handleImport } as const;
}
