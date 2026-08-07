# AGENTS.md — operating rules for the Adisu Serategna admin (አዲሱ ሥራተኛ)

> Next.js 16 + React 19 · Tailwind v4 · shadcn/ui primitives · next-themes dark mode · next-intl (EN/AM). Design direction is LOCKED — build inside it, don't improvise a new one.

## Mandatory reads before ANY UI work

1. `docs/design-system.md` — the committed design contract (tokens, type, primitives, per-surface grammars, anti-pattern list, acceptance criteria).
2. `docs/design/direction-spec.md` §10 — the locked decisions (FINAL, never re-litigate).
3. Visual reference when in doubt: `docs/design/prototype-v7.html`.

## Token-only rule

- **Raw colors live in exactly one file: `src/app/globals.css`.** Never add raw hex, `rgb()/oklch()` literals, or arbitrary-value color utilities (`bg-[#…]`, `text-[#…]`, `border-[#…]`, inline `style` colors) in components.
- Consume the semantic utilities the tokens expose: `bg-canvas`, `bg-panel`, `border-line`, `text-ink`, `text-muted-foreground`, `bg-navy`/`bg-navy-tint`, `text-success-strong`, `bg-success-tint`, `shadow-card`, `w-rail`, `duration-base`, … (full map in the design contract §2).
- Every surface must work in light AND dark mode via tokens — dark mode is never optional.
- `src/app/globals.css` itself is only touched by design-system token work, never per-module.

## Primitives — compose, never fork

- Shared primitives live in `src/components/ui/*` (button, card, badge, stamp, table, input, tabs, …). **Compose them; never duplicate or re-implement them per module.**
- No module-local files named after a `ui/` primitive (e.g. a local `button.tsx`). Extend the primitive in `ui/`, don't fork it.
- Ownership map and primitives contract: design contract §5.

## Anti-pattern baseline (the user's words: the generic AI-generated UI feel is the enemy)

- No violet/purple, no glow orbs, no decorative gradients, no universal hover-lift (hover = 1px tint, never a lift), no card+table sameness.
- Hairlines do the ordering, 8px radius, tint-only hovers, 120–150ms transitions, visible keyboard focus, `prefers-reduced-motion` honored.

## Bilingual + Ethiopic (non-negotiable)

- Any new user-facing string goes into **both** `src/messages/en.json` and `src/messages/am.json` (match existing key structure).
- Ethiopic typography must render everywhere — every font stack ends in Noto Sans Ethiopic; honor the Amharic metrics rule (`fidel` utility, `html[lang="am"]` bump). Numerals stay standard Arabic in both locales (user override).

## Quality gates — run before pushing

1. `pnpm check:design` — design-contract guardrails clean (exit 0)
2. `npx tsc --noEmit`
3. `pnpm test`
4. `npx biome check`

Commits are conventional (`type(scope): summary` — e.g. `feat(shell): …`). PRs target `dev` and close their ticket.
