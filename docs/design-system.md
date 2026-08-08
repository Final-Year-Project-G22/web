# Design System — Adisu Serategna Admin (አዲሱ ሥራተኛ)

**Status:** locked · **Source of truth:** [docs/design/direction-spec.md §10](./design/direction-spec.md) (FINAL — never re-litigate) · **Visual reference:** [docs/design/prototype-v7.html](./design/prototype-v7.html) (16 routed pages), [sidebar-lab.html](./design/sidebar-lab.html), [icon-lab.html](./design/icon-lab.html)

This is the **committed agent-facing contract** for all UI work in this repo. Any agent touching UI — a new page, a redesigned surface, a new component — must read this document (and §10 of the direction spec) before writing code. The automated guardrails in §11 enforce the mechanical parts; this document carries the judgment parts.

---

## 1. Identity and the anti-slop baseline

Adisu Serategna is the night ledger of Ethiopian MSME formalization — a dense, long-session admin. The palette is the product trio (slate-navy acts · emerald grows · amber warms), light-first with dark mode. The signature devices — tibeb weave, ማህተም stamps, the ጳጉሜን 13th month — are used with restraint, never decoration.

**The enemy is the generic AI-generated UI feel.** The baseline (user, recorded on the map ticket #35):

- ❌ no violet/purple anywhere
- ❌ no glow orbs, no decorative gradients
- ❌ no universal hover-lift (hover is a 1px background tint, never a translate/shadow lift)
- ❌ no card+table sameness across modules (each surface has its own grammar, §7)
- Every visual must justify itself against this list.

---

## 2. Tokens — the only colors in the app

**Raw colors live in exactly one file: `src/app/globals.css`.** Everything else consumes the semantic utilities that file exposes (via `@theme inline`). No raw hex, no `rgb()/oklch()` literals, no arbitrary-value color utilities (`bg-[#…]`, `text-[#…]`, `border-[#…]`, `style="…#…"`) in components, and no Tailwind default-palette color utilities (`text-red-500`, `bg-green-50`, `border-blue-200`, …) — enforced by `pnpm check:design` (§11). Pre-existing palette utilities on surfaces outside this rollout's scope are grandfathered under the §11 PALETTE_FIXME policy and must be pruned as each surface is redesigned.

### Roles (summary — the CSS file is the authoritative definition)

| Role group | Tokens (light · dark) | Use for |
|---|---|---|
| Surfaces | `--canvas` (#F8FAFC · #14171A), `--canvas-2`, `--panel`, `--panel-2` | canvas is the ground; panel sits on it; panel-2 tints (hover fills) |
| Hairlines | `--line`, `--line-2` | the ordering system — 1px borders, dividers, table rules |
| Text | `--ink`, `--ink-2`, `--muted` (+ `--muted-foreground`) | ink primary, ink-2 secondary, muted tertiary/captions |
| Product trio | `--navy*` acts, `--emerald*` grows, `--amber*` warms (each: base · `-strong` · `-tint`) | navy = primary actions/active nav; emerald = growth/success; amber = warmth/pending |
| Flags / informs | `--red*` flags, `--blue*` informs | red = destructive/flagged, blue = informational |
| Semantic | `--success*`, `--warning*`, `--info*`, `--destructive*` (each: base · `-strong` text-on-tint · `-tint` fill) | **meaning by role** — use these for status, not the raw trio |
| Chart | `--chart-1..5` | the trio + blue + red (lightened in dark) |
| Geometry | `--radius` (8px), `--shadow-card`, `--shadow-popover` | one quiet card shadow, one for floating layers |
| Motion | `--transition-duration-fast/base/slow` (120/150/220ms) | tint/color transitions only |
| Rail | `--rail` (236px) | shell rail width (consumed by the shell, #39) |

### Semantic utilities the tokens expose

`bg-canvas` · `bg-canvas-2` · `bg-panel` · `bg-panel-2` · `border-line` · `border-line-2` · `text-ink` · `text-ink-2` · `text-muted-foreground` · `bg-navy`/`bg-navy-tint` · `text-navy-strong` · `bg-emerald-tint`/`text-emerald-strong` · `bg-amber-tint`/`text-amber-strong` · `bg-red-tint`/`text-red-strong` · `bg-blue-tint`/`text-blue-strong` · `bg-success-tint`/`text-success-strong` · `bg-warning-tint`/`text-warning-strong` · `bg-info-tint`/`text-info-strong` · `bg-destructive-tint`/`text-destructive-strong` · `shadow-card`/`shadow-popover` · `duration-fast`/`duration-base`/`duration-slow` · `w-rail` · plus shadcn aliases (`bg-card`, `bg-background`, `bg-muted`, `text-foreground`, `border-border`, …). Also `border-current/20`-style opacity modifiers on currentColor.

**Dark mode is not optional.** Every surface must render correctly in both modes by consuming tokens — never hardcode a light-mode value.

---

## 3. Typography

| Role | Face | Notes |
|---|---|---|
| Display | Sora 600/700 (`font-display` / `font-heading`) | page titles ~22px, stat values ~25px, card titles `font-heading text-base` |
| Body | Inter 400/500/600 (`font-sans`) | 14px/1.5 baseline |
| Data / mono | JetBrains Mono (`font-mono`) | IDs, amounts, timestamps; `tabular-nums` enforced in `.font-mono` |

- **Every font stack ends in Noto Sans Ethiopic** (locked §10.2). Ethiopic typography is a non-negotiable requirement — fidel must render everywhere.
- **Amharic metrics rule:** fidel body text +1px size, +0.1 line-height (`html[lang="am"] body` bump + `fidel` utility for fidel-dense blocks). `<HtmlLang />` syncs `document.lang` to the active locale.
- **Numerals stay standard Arabic (0–9) in both locales** — user override recorded on #38. No Geez-numeral conversion.
- Ethiopian-calendar dates in አማ are a surface concern (dashboard, #39).

---

## 4. Signature devices (used with restraint)

1. **Tibeb woven rule (ጥበብ)** — the one approved repeating pattern; closes the shell top (`tibeb` utility, 3px band wearing the trio).
2. **ማህተም rubber stamp** — decision states (approved/rejected) only, via the `Stamp` primitive. Pending/sent stay as pills.
3. **ጳጉሜን 13th-month callout** — the Ethiopian year-end filing window as a real dashboard feature (live, not decoration).
4. **Rail active state** — filled-row active (navy fill, white text; dark mode flips), line icons at 1.5px stroke.
5. **Arabic numerals in both locales** — see §3.

Spend boldness in exactly one place per screen; keep everything else quiet.

---

## 5. Primitives contract

**Compose `src/components/ui/*` — never fork or duplicate them.** If a primitive doesn't fit, extend the primitive in `ui/` (with the design system's owner), don't re-implement it in the module.

| Primitive | Contract |
|---|---|
| `button` | flat, radius 6, h-8/9; primary = navy fill; ghost = hairline; hover = color step only (darker fill / tint bg). No shadows, no glow. |
| `card` | panel fill, 1px hairline, radius 8, `shadow-card`; **no hover-lift, ever** |
| `badge` | pill; `success` / `warning` / `info` / `destructive` variants; **color + icon + text** (triple redundancy — never color alone) |
| `stamp` (ማህተም) | decision states only; `good` / `bad` via semantic tokens |
| `table` | dense h-9 rows, hairline dividers, uppercase muted headers, mono IDs, right-aligned numerics, tint-only row hover |
| `input` / `select` / `textarea` | hairline; transparent focus → 2px ring |
| `tabs` | segmented: panel + hairline, ink-fill active |
| `tibeb` (utility) | the woven band — shell crown only |
| `chart` | recharts wrapper; colors from `chart-*` tokens |

Radius is 8px. Hairlines do the ordering. Hover is a tint, never a lift.

### Component ownership map

| Path | Owner | Rules |
|---|---|---|
| `src/components/ui/*` | Design system (ticket #38, extended here) | The primitives. Token-only. Changed only by design-system work — never per-module. |
| `src/components/layout/*` | Shell (#39) | sidebar, header, rail, drawer — shell grammar only |
| `src/components/providers/*` | Foundation (#38) | theme/query/html-lang wiring |
| `src/components/auth/*` | Auth (#41) | hydrator, guards, route protection |
| `src/app/[locale]/(modules)/*/_components/*` | The module's surface ticket | Compose primitives + surface grammar (§7). **No module-local files named after a ui primitive** (e.g. `button.tsx`, `card.tsx`) — enforced by `check:design`. |

---

## 6. Layout grammars (one per surface — no card+table sameness)

| Surface | Grammar |
|---|---|
| **Shell** (#39) | 236px flat rail (no blur, no orbs) + hairline topbar; tibeb band as the stage's crown; chevron collapse to 64px; drawer <760px |
| **Dashboard** (#39) | ledger stat strip (hairline-divided cells, a ledger row not floating cards) + chart panels + health/log split |
| **Guide editor** (#40) | content spine with a fixed step rail — numbering means order here |
| **AI module** (#40) | conversation rail: prompt composer bottom-locked, source citations as a hairline sidebar |
| **Moderation** (#41) | triage queue: row = report, left dock of decide/skip actions, stamp-style resolution (ማህተም) |
| **Auth** (#41) | centered panel on the plain canvas, tibeb band above, no gradient, no orbs |

---

## 7. Motion and accessibility

- 120–150ms color/opacity transitions only (`duration-fast`/`duration-base`); nothing decorative on hover; no page-load stagger, no orbs, no parallax.
- `prefers-reduced-motion: reduce` kills all transitions (globals.css base).
- **Visible keyboard focus everywhere** (`outline-ring/50` base + 2px input rings).
- New surfaces must be responsive per the shell contract and pass a dark-mode check in both locales.

---

## 8. Bilingual contract

Any new user-facing string goes into **both** `src/messages/en.json` and `src/messages/am.json` (match the existing key structure — module namespaces under `sidebar.*`, `dashboard.*`, etc.). Fidel content must render with the Amharic metrics rule (§3). Do not paste Ethiopic copy into components.

---

## 9. Anti-pattern list (enforced + judgment)

**Banned in code (enforced by `pnpm check:design`, §11):**

- Raw color hexes (3/4/6/8-digit) outside `src/app/globals.css` (+ the documented exceptions: `src/app/icon.svg` brand asset, `src/components/ui/chart.tsx` recharts internals)
- `rgb()/oklch()` color literals (numeric forms — `rgb(var(--…))` stays fine)
- Arbitrary-value **color** utilities: `bg-[#…]`, `text-[#…]`, `border-[#…]`, `from-[#…]`, `to-[#…]`, `via-[#…]`, `ring-[#…]`, `fill-[#…]`, `stroke-[#…]`, `shadow-[#…]`, … (non-color arbitrary values like `w-[4px]` stay fine)
- Tailwind **default-palette** color utilities: `text-red-500`, `bg-green-50`, `border-blue-200`, `ring-emerald-400`, … (any `(bg|text|border|…)` prefix on a named color with a shade — pre-existing ones are grandfathered per §11's PALETTE_FIXME policy)
- Inline `style` attributes carrying raw colors
- Module-local files named after a `ui/` primitive (fork-in-progress)

**Banned by judgment (the anti-slop baseline — review gate, not a lint):**

- Violet/purple anywhere; glow orbs; decorative gradients; universal hover-lift; card+table sameness; shadows doing the ordering the hairlines should do; fonts without the Ethiopic fallback; unreadable dark-mode states; English-only strings; Geez numerals.

---

## 10. Acceptance criteria

A surface "passes" when:

1. `pnpm check:design` is clean (exit 0).
2. Every color is a token utility; the surface renders correctly in light **and** dark mode.
3. It composes `ui/` primitives; no forks, no new hex.
4. It follows its §6 grammar — it does not read like every other module.
5. Fidel renders everywhere (Noto Sans Ethiopic fallback intact); new strings exist in both locales.
6. Motion is 120–150ms tint/color only; keyboard focus is visible; `prefers-reduced-motion` is honored.

---

## 11. Guardrails — what `check:design` enforces

`pnpm check:design` runs `node scripts/check-design-contract.js` and scans `src/` for:

1. **Raw color hexes** (3/4/6/8-digit) outside the allowlist.
2. **`rgb()/oklch()` color literals** (numeric forms).
3. **Arbitrary-value color utilities** and **inline-style hex colors** on all scanned extensions.
4. **Tailwind default-palette color utilities** (`text-red-500`, `bg-green-50`, …) outside the PALETTE_FIXME list below.
5. **Component ownership:** module-local files named like a `ui/` primitive.
6. **Comment/URL precision:** full-line comments, trailing `//` and `/* … */` (incl. JSX `{/* … */}`) are stripped, and URL substrings are removed — hex-looking URL fragments aren't colors, but a line carrying a URL *and* a real color still flags the color.

**Allowlist (deliberate exceptions, with reasons, inside the script):**

- `src/app/globals.css` — the token source of truth
- `src/app/icon.svg` — static brand asset (favicon)
- `src/components/ui/chart.tsx` — recharts `#ccc`/`#fff` internals (recorded #38)

**FIXME allowlist (pre-existing violations on surfaces being redesigned in parallel — must be removed when those lanes land, never extended):**

- `src/app/(auth)/auth/_components/login-form.tsx` — Google sign-in brand SVG fills; auth redesign (#41) owns the call.

**PALETTE_FIXME (pre-existing Tailwind default-palette utilities, file-level):**

- Enumerated at the #46 fix-up commit: 124 utilities across 22 module files (`admin/register`, `ai/*`, `guide/*`, `library/*`, `notifications/*`, `settings/password`, `taxonomy/*`) — pre-existing on dev, surfaces not in this rollout's scope.
- The file-level entry exempts **only the palette rule**; hex, `rgb()/oklch()`, arbitrary-value and inline-style checks still run on those files.
- Policy: **pre-existing only**. Prune a file's entry when its surface is redesigned; never add files or new palette utilities to in-scope work.

Exit 0 = clean (baseline is clean today). Exit 1 = violations, with the offending file:line and the token-map hint.

---

## 12. Quality gates (every agent, before pushing)

1. `pnpm check:design` — design contract clean
2. `npx tsc --noEmit` — types clean
3. `pnpm test` — vitest suite green
4. `npx biome check` — lint/format clean (husky runs `biome check --write` on commit)

Commits are conventional (`type(scope): summary` — e.g. `feat(shell): …`, `refactor(dashboard): …`) per commitlint. PRs target `dev` and reference their ticket.
