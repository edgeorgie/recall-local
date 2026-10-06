export interface Doc {
  id: string;
  name: string;
  addedAt: number;
  chunkCount: number;
}

export interface NoteChunk {
  id: string;
  docId: string;
  index: number;
  text: string;
  vector: Float32Array;
}

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

/** Splits text into passages of roughly `target` words: short paragraphs merge, long ones split on sentences. */
export function chunkText(text: string, target = 70): string[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const pieces: string[] = [];
  for (const p of paragraphs) {
    if (words(p) <= target * 1.5) {
      pieces.push(p);
      continue;
    }
    let cur = "";
    for (const sentence of p.split(/(?<=[.!?])\s+/)) {
      if (cur && words(cur) + words(sentence) > target) {
        pieces.push(cur);
        cur = sentence;
      } else {
        cur = cur ? `${cur} ${sentence}` : sentence;
      }
    }
    if (cur) pieces.push(cur);
  }
  const chunks: string[] = [];
  let buf = "";
  for (const piece of pieces) {
    if (buf && words(buf) >= target * 0.35) {
      chunks.push(buf);
      buf = piece;
    } else {
      buf = buf ? `${buf}\n\n${piece}` : piece;
    }
  }
  if (buf) chunks.push(buf);
  return chunks.filter((c) => c.length > 15);
}

/** A short excerpt of `text` centered on the first query term it contains. */
export function snippet(text: string, query: string, max = 240): string {
  const flat = text.replace(/\s+/g, " ");
  if (flat.length <= max) return flat;
  const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 3);
  const lower = flat.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, Math.min(hit - 60, flat.length - max));
  return `${start > 0 ? "…" : ""}${flat.slice(start, start + max)}${start + max < flat.length ? "…" : ""}`;
}

export function docTitle(name: string): string {
  return name.replace(/\.(md|txt|markdown)$/i, "");
}
