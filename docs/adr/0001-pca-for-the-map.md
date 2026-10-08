# ADR 0001: PCA for the map

Status: accepted

## Context

Needed a deterministic projection without a heavy dependency.

## Decision

Power iteration with deflation, scaled to the unit square.

## Consequences

Stable layout between sessions; less expressive than non-linear methods.
