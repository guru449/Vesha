export type Note = {
  id: string;
  text: string;
  createdAt: string;
};

// In-memory store for the starter app. This resets on server restart and is
// intentionally simple; swap for a real database when the project grows.
const notes: Note[] = [
  {
    id: "seed-1",
    text: "Welcome to Vesha — add a note below to try it out.",
    createdAt: new Date().toISOString(),
  },
];

export function listNotes(): Note[] {
  return [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addNote(text: string): Note {
  const note: Note = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  return note;
}
