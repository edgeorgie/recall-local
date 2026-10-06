# Design system

## Principles

- The map is the hero: the notes become a place.
- Six note colors keep documents distinguishable.

## Typography

| Role | Typeface |
|---|---|
| Display and text | Manrope, weight 800 for titles |
| Code and labels | JetBrains Mono |

Fonts are loaded with `next/font` and exposed as CSS variables in `app/layout.tsx`.

## Color tokens

Defined as CSS variables in `app/globals.css` and mapped into Tailwind's theme.

| Token | Value | Use |
|---|---|---|
| `night` | `#08110e` | Page background |
| `panel` | `#0f1b17` | Surfaces |
| `text` | `#e8f4ee` | Primary text |
| `muted` | `#7f9a8e` | Secondary text |
| `mint` | `#5cf2b0` | Primary accent |
| `amber` | `#ffc857` | Note color |

## Motion

- Stars twinkle and drift.
- Matches send out ripples.
- Results slide in with a stagger.

All animation respects `prefers-reduced-motion`.

## Components

| Component | Purpose |
|---|---|
| MemoryMap | Canvas galaxy of passages |

## Rules

- Color carries meaning; it is never the only signal.
- Interactive elements have visible focus and accessible names.
- New tokens are added to `globals.css` and this document together.
