# Specification: recall-local

Search your own notes by meaning with local embeddings. Nothing leaves the browser.

## Provenance

This project was built with AI assistance. The behavior was implemented and verified first, in the pull requests listed in `tasks.md`. This specification was written afterwards from the verified behavior (reverse specification, 2026-10-06). From this point every change follows the workflow in `AGENTS.md`: specification first, then plan, tasks, implementation and verification.

## Users

People who keep notes and want private semantic search.

## Goals

- Find passages by meaning, not keywords.
- Keep notes on the device.
- Show the notes as a navigable map.

## Non-goals

- Sync across devices.
- Rich document formats.

## Requirements

### FR-1 Chunking notes

Status: Verified.

- Given text, then short paragraphs merge, long ones split on sentences, and trivial text is dropped.

### FR-2 Local embeddings and search

Status: Verified.

- Given notes and a query in different words, then the matching passage ranks first with at most three per note.

### FR-3 On-device storage

Status: Verified.

- Given added notes, then they persist in IndexedDB and can be removed individually or cleared.

### FR-4 Memory map

Status: Verified.

- Given passages, then a 2D projection places them deterministically and matches glow.
- Given the map, then the user can zoom, pan, reset and see each note labeled at its center.

### FR-5 Mobile layout

Status: Verified.

- Given a 390 px viewport, then the map appears first and nothing overflows horizontally.

## Open risks

- A small model limits quality on very short passages.
- IndexedDB can be blocked in private browsing.
