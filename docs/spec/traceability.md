# Traceability: recall-local

Every requirement maps to implementation files and to tests or manual evidence. `npm run spec:check` enforces that each requirement has an implementation, that files exist, and that there is a test or a manual note.

| Requirement | Implementation | Tests | Evidence | Status |
|---|---|---|---|---|
| FR-1 | `lib/notes.ts` | `tests/recall.test.ts` | PR 1: chunking tests; chunk size tuned after a real query returned a mixed passage. | Verified |
| FR-2 | `lib/embed.worker.ts`, `lib/embedder.ts`, `lib/vector.ts` | `tests/recall.test.ts` | PR 1: retrieval test; four paraphrased queries returned the right passage first in Chrome. | Verified |
| FR-3 | `lib/store.ts` | manual | manual: PR 1, persistence checked across reloads in Chrome. | Verified |
| FR-4 | `lib/pca.ts`, `components/MemoryMap.tsx` | `tests/recall.test.ts` | PR 1: PCA tests. PR 2: zoom, pan and labels checked in Chrome. | Verified |
| FR-5 | `app/page.tsx` | manual | manual: PR 2, measured in Chrome at 390 px. | Verified |

"Verified" means the behavior was exercised. "Implemented, not verified end to end" means the code exists and its parts are tested, but a real external service or credential was not available.
