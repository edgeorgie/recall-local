# Plan: recall-local

## Overview

Added files are chunked, embedded in a worker and stored. A query is embedded and ranked against stored vectors. The map projects all vectors to two dimensions.

## Modules

| Path | Responsibility |
|---|---|
| `lib/notes.ts` | Chunking and snippets |
| `lib/embedder.ts` | Worker client |
| `lib/store.ts` | IndexedDB access |
| `lib/pca.ts` | 2D projection |
| `lib/vector.ts` | Retrieval |
| `components/MemoryMap.tsx` | Canvas map |

## Decisions

- [ADR 0001: PCA for the map](../adr/0001-pca-for-the-map.md)

## Quality gates

`npm run verify`: typecheck, lint, spec check, tests and production build.
