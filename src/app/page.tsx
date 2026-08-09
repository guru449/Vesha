"use client";

import { useEffect, useState } from "react";
import type { Note } from "@/lib/notes";

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadNotes() {
    try {
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to load notes.");
      const data = (await res.json()) as { notes: Note[] };
      setNotes(data.notes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/notes");
        if (!res.ok) throw new Error("Failed to load notes.");
        const data = (await res.json()) as { notes: Note[] };
        if (!active) return;
        setNotes(data.notes);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to add note.");
      setText("");
      await loadNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Vesha</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          A minimal notes app. Add a note and it is stored by the API route.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Write a note…"
          aria-label="Note text"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
        />
        <button
          type="submit"
          disabled={submitting || !text.trim()}
          className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {submitting ? "Adding…" : "Add note"}
        </button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <section className="flex flex-col gap-3" aria-label="Notes">
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No notes yet. Add your first one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="text-base">{note.text}</p>
                <time
                  dateTime={note.createdAt}
                  className="mt-1 block text-xs text-zinc-400"
                >
                  {new Date(note.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
