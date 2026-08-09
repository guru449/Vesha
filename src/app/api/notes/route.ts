import { NextResponse } from "next/server";
import { addNote, listNotes } from "@/lib/notes";

export async function GET() {
  return NextResponse.json({ notes: listNotes() });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text =
    typeof body === "object" && body !== null && "text" in body
      ? String((body as { text: unknown }).text ?? "").trim()
      : "";

  if (!text) {
    return NextResponse.json(
      { error: "A non-empty 'text' field is required." },
      { status: 400 },
    );
  }

  const note = addNote(text);
  return NextResponse.json({ note }, { status: 201 });
}
