# Architecture

## Data flow

```mermaid
flowchart LR
  N[Notes] --> K[Chunker]
  K --> E[Embedding worker]
  E --> S[(IndexedDB)]
  Q[Query] --> E
  E --> R[Cosine ranking]
  S --> R
  S --> P[PCA 2D]
  P --> M[Memory map]
  R --> M
```

## Main sequence

```mermaid
sequenceDiagram
  participant U as User
  participant W as Worker
  participant DB as IndexedDB
  U->>W: add notes
  W->>DB: passages and vectors
  U->>W: query
  W-->>U: ranked passages
  U->>U: map highlights matches
```

## Modules

| Path | Responsibility |
|---|---|
| `lib/notes.ts` | Chunking and snippets |
| `lib/embedder.ts` | Worker client |
| `lib/store.ts` | IndexedDB access |
| `lib/pca.ts` | 2D projection |
| `lib/vector.ts` | Retrieval |
| `components/MemoryMap.tsx` | Canvas map |

## Principles

- Pure logic lives in `lib/` and is tested without a browser; components stay thin.
- Network, storage and model replies are validated at the boundary.
- Secrets and user content stay in the browser.

## Decisions

- [PCA for the map](adr/0001-pca-for-the-map.md)
