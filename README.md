# Flent — Hero motion prototypes

Scroll-driven hero explorations for the Flent **rent-credit** landing page
("stay for 11, pay for 10"). Light / editorial treatment.

## Option 1 — "Pluck one month out"

A pinned, scroll-scrubbed transition (Figma Components 14–17):

1. **Rest** — 11 month-boxes (Jan…Nov) arranged in a downward-opening arc
   around the headline.
2. **Pluck** — the apex box (Jun) lifts and tilts out; a dashed **ghost trace**
   stays in its slot — you're still here for all 11, one's just on us.
3. **Travel** — Jun drops to dead-centre as the other months recede.
4. **Cover** — Jun scales to full-bleed; the red headline rides on top of the
   grey.
5. **Release** — the headline lifts away and scroll flows into the next section.

Boxes are grey placeholders for now (swap for images/illustrations later).

## Stack

- Vite + React + TypeScript
- **GSAP ScrollTrigger** — pinned timeline + scrub
- **Lenis** — inertial smooth scroll (wired to ScrollTrigger)
- **Fraunces** (Fontsource) — editorial serif

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

## Key files

- `src/components/HeroPluck.tsx` — arc geometry + scroll choreography
- `src/components/HeroPluck.css` — box / headline / ghost styling
- `src/lib/useSmoothScroll.ts` — Lenis ↔ GSAP ticker glue
- `src/App.tsx` — hero + placeholder next section

## Notes / open

- Free month is rendered as **Jun** (visual apex). Which month is *semantically*
  free (product doc says "first month") is a copy decision, independent of the motion.
- Plan accent colours (gold/green) are intentionally not used here — hero is
  plan-neutral for now.
