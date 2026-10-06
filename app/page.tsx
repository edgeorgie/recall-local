"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MemoryMap from "@/components/MemoryMap";
import type { MapPoint } from "@/components/MemoryMap";
import { Embedder } from "@/lib/embedder";
import { chunkText, docTitle, snippet } from "@/lib/notes";
import type { Doc, NoteChunk } from "@/lib/notes";
import { pca2d } from "@/lib/pca";
import { SAMPLES } from "@/lib/samples";
import { clearAll, loadAll, removeDoc, saveDoc } from "@/lib/store";
import { diversify, topK } from "@/lib/vector";

const COLORS = ["#5cf2b0", "#ffc857", "#ff7a6b", "#6cc8ff", "#c9a7ff", "#ff9fe0"];

interface Hit {
  chunk: NoteChunk;
  score: number;
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [chunks, setChunks] = useState<NoteChunk[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<{ label: string; pct: number } | null>(null);
  const [model, setModel] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searched, setSearched] = useState("");
  const [pulse, setPulse] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [note, setNote] = useState("");
  const [focus, setFocus] = useState<string | null>(null);
  const embedder = useRef<Embedder | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadAll()
      .then((d) => {
        if (cancelled) return;
        setDocs(d.docs);
        setChunks(d.chunks);
      })
      .catch(() => setError("Could not open local storage. Private browsing may block it."))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
      embedder.current?.dispose();
    };
  }, []);

  const getEmbedder = () => {
    if (!embedder.current) {
      embedder.current = new Embedder();
      embedder.current.onModelProgress = (p) => setModel(p >= 99 ? null : p);
    }
    return embedder.current;
  };

  const colorOf = useCallback((docId: string) => COLORS[Math.max(0, docs.findIndex((d) => d.id === docId)) % COLORS.length], [docs]);

  const add = async (items: { name: string; text: string }[]) => {
    setError("");
    try {
      const emb = getEmbedder();
      for (let n = 0; n < items.length; n++) {
        const { name, text } = items[n];
        const pieces = chunkText(text);
        if (pieces.length === 0) continue;
        const id = crypto.randomUUID();
        const vectors: Float32Array[] = [];
        for (let i = 0; i < pieces.length; i += 16) {
          setBusy({ label: `Reading ${docTitle(name)}`, pct: ((n + i / pieces.length) / items.length) * 100 });
          vectors.push(...(await emb.embed(pieces.slice(i, i + 16))));
        }
        const doc: Doc = { id, name, addedAt: Date.now() + n, chunkCount: pieces.length };
        const newChunks: NoteChunk[] = pieces.map((t, i) => ({ id: `${id}:${i}`, docId: id, index: i, text: t, vector: vectors[i] }));
        await saveDoc(doc, newChunks);
        setDocs((d) => [...d, doc]);
        setChunks((c) => [...c, ...newChunks]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add the notes.");
    } finally {
      setBusy(null);
    }
  };

  const onFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => /\.(md|txt|markdown)$/i.test(f.name) || f.type.startsWith("text/"));
    if (list.length === 0) {
      setError("Drop Markdown or plain text files (.md, .txt).");
      return;
    }
    await add(await Promise.all(list.map(async (f) => ({ name: f.name, text: await f.text() }))));
  };

  const search = async (q: string) => {
    if (!q.trim() || chunks.length === 0) return;
    setError("");
    try {
      const [qv] = await getEmbedder().embed([q]);
      const ranked = diversify(topK(qv, chunks.map((c) => c.vector), 12, 0.1), (i) => chunks[i].docId, 3).slice(0, 8);
      setHits(ranked.map((r) => ({ chunk: chunks[r.index], score: r.score })));
      setSearched(q);
      setPulse((p) => p + 1);
      setFocus(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    }
  };

  const points: MapPoint[] = useMemo(() => {
    const pos = pca2d(chunks.map((c) => c.vector));
    return chunks.map((c, i) => ({
      id: c.id,
      x: pos[i][0],
      y: pos[i][1],
      color: colorOf(c.docId),
      label: docTitle(docs.find((d) => d.id === c.docId)?.name ?? ""),
      text: c.text,
    }));
  }, [chunks, docs, colorOf]);

  const highlights = useMemo(() => {
    const m = new Map<string, number>();
    if (hits.length === 0) return m;
    const max = Math.max(...hits.map((h) => h.score));
    const min = Math.min(...hits.map((h) => h.score));
    hits.forEach((h) => m.set(h.chunk.id, max === min ? 1 : 0.35 + 0.65 * ((h.score - min) / (max - min))));
    if (focus && m.has(focus)) m.set(focus, 1.4);
    return m;
  }, [hits, focus]);

  const remove = async (id: string) => {
    await removeDoc(id);
    setDocs((d) => d.filter((x) => x.id !== id));
    setChunks((c) => c.filter((x) => x.docId !== id));
    setHits((h) => h.filter((x) => x.chunk.docId !== id));
  };

  const reset = async () => {
    await clearAll();
    setDocs([]);
    setChunks([]);
    setHits([]);
    setSearched("");
  };

  const empty = ready && docs.length === 0;

  return (
    <main
      className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-7 sm:px-10"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onFiles(e.dataTransfer.files);
      }}
    >
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute h-7 w-7 animate-ping rounded-full bg-mint/30" />
            <span className="h-3 w-3 rounded-full bg-mint shadow-[0_0_16px_var(--mint)]" />
          </span>
          recall
        </span>
        <span className="rounded-full border border-line bg-panel px-3.5 py-1.5 font-mono text-[11px] text-muted">
          <span className="text-mint">&bull;</span> runs in your browser &middot; notes never leave this device
        </span>
      </header>

      {empty ? (
        <section className="fade-up my-auto grid items-center gap-10 py-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h1 className="title text-6xl leading-[0.95] sm:text-8xl">
              Search by
              <br />
              <span className="text-mint">meaning.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted">Drop in your notes and ask in your own words. Every passage becomes a star on a map, grouped by what it is about. Nothing is uploaded.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => add(SAMPLES)} className="rounded-full bg-mint px-7 py-3.5 text-sm font-extrabold text-night shadow-[0_0_30px_rgba(92,242,176,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_0_44px_rgba(92,242,176,0.5)] active:scale-95">
                Try with sample notes
              </button>
              <button onClick={() => fileInput.current?.click()} className="rounded-full border border-line bg-panel px-7 py-3.5 text-sm font-bold transition hover:border-mint/60">
                Add my own files
              </button>
            </div>
            <p className="mt-4 font-mono text-[11px] text-muted">first run downloads a 23 MB model, once</p>
          </div>
          <div className="h-[380px]">
            <MemoryMap points={[]} highlights={new Map()} pulseKey={0} onPick={() => {}} />
          </div>
        </section>
      ) : (
        <div className="mt-8 grid flex-1 gap-6 lg:grid-cols-[26rem_1fr]">
          <section className="flex flex-col gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search(query);
              }}
              className="flex items-center gap-2 rounded-2xl border border-line bg-panel p-1.5 pl-4 transition focus-within:border-mint/60 focus-within:shadow-[0_0_0_4px_rgba(92,242,176,0.1)]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted" aria-hidden>
                <circle cx="9" cy="9" r="6" />
                <path d="m14 14 4 4" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your notes anything..."
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] outline-none placeholder:text-muted/60"
                aria-label="Search your notes"
              />
              <button className="rounded-xl bg-mint px-4 py-2.5 text-sm font-extrabold text-night transition hover:brightness-110 active:scale-95">Search</button>
            </form>

            {busy && (
              <div>
                <p className="mb-2 text-sm text-muted">
                  {busy.label}
                  {model !== null ? ` · loading model ${Math.round(model)}%` : ""}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                  <div className="sweep h-full rounded-full bg-mint/70 transition-all" style={{ width: `${Math.max(8, busy.pct)}%` }} />
                </div>
              </div>
            )}
            {error && <p className="rounded-xl bg-[#3a1717] px-4 py-3 text-sm text-[#ff9c9c]">{error}</p>}

            <div className="flex flex-col gap-2.5">
              {searched && hits.length === 0 && <p className="text-sm text-muted">Nothing close enough to &ldquo;{searched}&rdquo;. Try different words.</p>}
              {hits.map((h, i) => {
                const doc = docs.find((d) => d.id === h.chunk.docId);
                const color = colorOf(h.chunk.docId);
                return (
                  <button
                    key={h.chunk.id}
                    onClick={() => {
                      setFocus(h.chunk.id);
                      setPulse((p) => p + 1);
                    }}
                    className={`result-in rounded-2xl border bg-panel p-4 text-left transition hover:-translate-y-0.5 hover:border-white/20 ${focus === h.chunk.id ? "border-white/30" : "border-line"}`}
                    style={{ animationDelay: `${i * 55}ms` }}
                  >
                    <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
                      {docTitle(doc?.name ?? "")}
                      <span className="ml-auto" style={{ color }}>{Math.round(h.score * 100)}% match</span>
                    </span>
                    <span className="mt-2 block text-[14.5px] leading-relaxed text-text/90">{snippet(h.chunk.text, searched)}</span>
                  </button>
                );
              })}
              {!searched && chunks.length > 0 && <p className="px-1 text-sm text-muted">Try &ldquo;how to cook something quick&rdquo; or &ldquo;what to pack for rain&rdquo;. Matches light up on the map.</p>}
            </div>

            <div className="mt-auto">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{docs.length} notes &middot; {chunks.length} passages</p>
                <button onClick={reset} className="text-xs text-muted underline-offset-4 hover:text-[#ff9c9c] hover:underline">Clear all</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {docs.map((d) => (
                  <span key={d.id} className="group inline-flex items-center gap-2 rounded-full border border-line bg-panel py-1.5 pl-3 pr-1.5 text-[13px]">
                    <span className="h-2 w-2 rounded-full" style={{ background: colorOf(d.id) }} />
                    {docTitle(d.name)}
                    <button onClick={() => remove(d.id)} className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-white" aria-label={`Remove ${d.name}`}>
                      &times;
                    </button>
                  </span>
                ))}
                <button onClick={() => fileInput.current?.click()} className="rounded-full border border-dashed border-muted/40 px-3.5 py-1.5 text-[13px] text-muted transition hover:border-mint hover:text-mint">
                  + files
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Or jot a quick note and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && note.trim().length > 15) {
                      add([{ name: `Note ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`, text: note }]);
                      setNote("");
                    }
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-panel px-3 py-2 text-sm outline-none placeholder:text-muted/60 focus:border-mint/60"
                />
              </div>
            </div>
          </section>

          <section className="min-h-[460px] lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
            <MemoryMap points={points} highlights={highlights} pulseKey={pulse} onPick={(id) => {
              const hit = hits.find((h) => h.chunk.id === id);
              if (hit) setFocus(id);
            }} />
          </section>
        </div>
      )}

      <input ref={fileInput} type="file" accept=".md,.txt,.markdown,text/*" multiple hidden onChange={(e) => e.target.files && onFiles(e.target.files)} />
      {dragging && (
        <div className="drop-active pointer-events-none fixed inset-4 z-50 grid place-items-center rounded-[2rem] border-2 border-dashed">
          <p className="text-2xl font-extrabold">Drop to add to your map</p>
        </div>
      )}
    </main>
  );
}
