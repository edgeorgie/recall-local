# recall

Search your own notes by meaning, not keywords. Everything runs in your browser: your notes are never uploaded.

## What it does

- Drop in Markdown or text files (or jot a quick note). Each note is split into passages.
- Passages are embedded locally with [Transformers.js](https://github.com/huggingface/transformers.js) (`all-MiniLM-L6-v2`, quantized, about 23 MB, downloaded once and cached) in a Web Worker.
- Ask in your own words: "what should I wear if it might rain" finds the passage about packing a rain jacket, even without shared words.
- A **memory map** places every passage as a star by meaning (2D PCA of the embeddings), with each note labeled at its center. Matches glow and ripple; hover any star to read it. Scroll or use the buttons to zoom, drag to pan, double click to reset. On phones the map sits above the results.
- Notes and vectors are stored in IndexedDB on your device. Remove a note or clear everything at any time.

## Privacy

After the one-time model download, nothing leaves the browser: no server, no account, no analytics.

## Limits

Retrieval quality depends on a small embedding model, so very short or very long passages work less well. Files must be `.md` or `.txt`.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm test` runs the chunking, PCA and retrieval tests
- `npm run build` creates a production build

## License

MIT

## How this was built

Spec-driven development with AI assistance. Requirements, plan, tasks, decisions and a requirement-to-code traceability matrix live in [`docs`](docs/spec/spec.md), and [`AGENTS.md`](AGENTS.md) defines the workflow and quality gates. `npm run verify` runs typecheck, lint, the traceability check, tests and the build. The specification is the source of truth for the 0.1.0 baseline; changes start there.
