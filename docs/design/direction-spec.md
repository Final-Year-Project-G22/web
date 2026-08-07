# Design direction — v0 draft spec

**Ticket:** [Design direction — spec ↔ prototype until approval](https://github.com/Final-Year-Project-G22/web/issues/37)
**Pivot (v3 →):** three console-register attempts (v1–v3) rejected on palette — re-based by user pick from [`docs/design/palette-exploration.html`](palette-exploration.html). User chose the **Flag** direction (green acts, gold highlights, red stamps); a **Jebena** sibling is built for in-context comparison. Prototypes: [`prototype-v4.html`](prototype-v4.html) (Flag) + [`prototype-v4b.html`](prototype-v4b.html) (Jebena).
**Status:** Draft for reaction — **nothing locked**. Prototype **v6 (Flag · real-tint canvas)** at [`docs/design/prototype-v6.html`](prototype-v6.html): warm parchment light + deep forest dark — previous canvases were desaturated neutrals, rejected; the surface now carries the identity. Comparison renders: v4 (Flag), v4b (Jebena), v5 (canvas presets) all archived alongside. The አማ toggle and dark mode work live.
**Basis:** research brief at [`docs/design/research-brief.md`](research-brief.md) (Candidate **C — Highland Ops**, recommended; **A — Tebib Ledger's** woven rule adopted as the border grammar).

---

## 1. Identity statement

> **Adisu Serategna (አዲሱ ሥራተኛ) is a night ledger — the registry that works after the coffee is poured.** Warm, dense, dark-first: a coffee-night field (`#171310`) where the tibeb weave, the ማህተም stamp, and the ፲፫-month Ethiopian year are the only ornaments. Ethiopic script and numerals are first-class data, not afterthoughts. Long-session work, zero theater.

Anti-slop contract (from the map): no violet, no glow orbs, no decorative gradients, no universal hover-lift, no card+table sameness. Every visual must justify itself against this.

## 2. Palette

Semantic roles, not raw values. One accent (**tibeb gold**) carries actions; everything else stays neutral; blue/red/status colors are used by *meaning* only. **Dark-first:** night is the default experience; teff paper is the secondary mode.

> **Revision v1 → v2 (user feedback):** v1's palette — pale neutral canvas + dark ink + red-earth accent — read as a Claude/Anthropic copy (their identity is *cream canvas + coral accent*; same relationship, different hexes). The research brief's red-earth recommendation was itself the near-Claude pick. Fix: gold promoted to the single action color, red-earth demoted to destructive/flagged only, canvas cooled further off-beige into ash (`#EEF0EB`).

> **Revision v2 → v3 (user feedback):** the v2 light mode was called worse — diagnosis: gold is warm, the ash canvas was cool, so the pair read as muddy mustard-on-gray; the dark half was called better. Fix: **commit to warmth and dark-first** — coffee-night canvas (`#171310`), cream text, gold actions, teff-paper light mode (deliberately browner than AI cream), plus two original devices: the ማህተም rubber stamp for decision states and the ጳጉሜን 13th-month year-end callout (calendar as product feature).

| Role | Hex (light · paper) | Hex (dark · night, default) | Notes |
|---|---|---|---|
| canvas | `#F2EDE2` teff paper | `#171310` coffee night | warm on both — brown, not gray, not AI cream |
| panel | `#FAF6EC` | `#221C17` | surfaces; hairline borders, no shadows |
| ink | `#22241E` | `#F2EBDD` cream | text (warm black / cream) |
| ink-2 / muted | `#5A5346` / `#7A7261` | `#C6BBA6` / `#A19582` | secondary text |
| hairline | `#DCD3BE` | `#3A322A` | the ordering system |
| **gold (tibeb — primary)** | `#A97C12` | `#D9A441` | actions, active nav, key data. Buttons: ink-fill + gold (paper) / gold-fill + dark (night) |
| blue-hour (info) | `#33536B` | `#7FA0BE` | links, info |
| seal-red (destructive/stamps) | `#B03A2A` | `#E07960` | ማህተም stamps, flags |
| success / warning | `#2F6B4F` / `#9A6B14` | `#7FBE9E` / `#D9AE4E` | status only |

Dark mode mirrors roles — surfaces darken, meanings don't change (mobile's M3 lesson). Tints are 8–16% alpha role fills, never gradients.

## 3. Typography

| Role | Latin | Ethiopic (mandatory) |
|---|---|---|
| Display | **Sora** 600/700 | Noto Sans Ethiopic 700 |
| Body | **Inter** 400/500/600 | **Noto Sans Ethiopic** (same weights) |
| Data/mono | **JetBrains Mono** | Noto Sans Ethiopic (Geez numerals ፩–፼) |

- **Every stack ends in Noto Sans Ethiopic**; Latin faces are chosen to pair with it (similar stroke contrast at 400). This fixes the current HIGH finding — the app loads latin-only subsets today.
- **Amharic metrics rule** (from mobile/DESIGN.md, written into tokens): fidel body text +1px size, +0.1 line-height multiplier. `font-variant-numeric: tabular-nums` on all data.
- Display scale is small and quiet (22px page titles, 25px stat values) — Sora earns its keep in density, not drama.

## 4. Signature

Two devices, used with restraint:

1. **The tibeb woven rule (ጥበብ)** — a 3px band of ink/gold/red repeating ticks that closes the shell top, and a 2px gold inset rule on active nav. Hierarchy reads like the border of a shamma. The *only* repeating pattern in the system.
2. **The ማህተም rubber stamp** — decision states (approved / rejected) render as rotated, serrated, double-bordered stamps in seal-red or green. A registry artifact, used only for *decisions*; pending/sent stay as pills.
3. **ጳጉሜን, the 13th month** — the Ethiopian year-end filing window is a real dashboard feature (a live callout, not decoration): calendar as product.
4. **Black-and-gold buttons** — primary actions are ink-fill with gold text (paper) / gold-fill with dark text (night), inverting on hover.
5. **Ethiopic numerals in the አማ locale** — IDs, amounts, timestamps, and stat values render in Geez numerals (፬፼፳፻፭፻፹፩ = 42,581), and dates on the Ethiopian calendar (ነሐሴ ፩ ፳፻፲፯ ዓ.ም.). Functional Ethiopian specificity — data rendering, not costume. (Locale formatter to be built properly in the tokens ticket; prototype demonstrates the pattern with hand-verified values.)

## 5. Primitives contract

- **Button**: flat, radius 6, `h-8/9`; primary = earth fill, ghost = hairline; hover = color step only (darker fill / tint bg). No shadows, no glow.
- **Card/Panel**: `#FFFFFF` panel on canvas, 1px hairline, radius 8, optional 1px shadow; **no hover-lift, ever** — hover is a 1px background tint.
- **Stat / ledger cell**: hairline-divided cells in a strip (a ledger row, not floating cards).
- **Table**: dense `h-9` rows, hairline dividers, mono IDs, right-aligned numerics, tint-only row hover.
- **Badge/status pill**: **color + icon + text** (triple redundancy, from mobile) — never color alone.
- **Input**: hairline, transparent focus→2px earth ring. Visible keyboard focus everywhere; `prefers-reduced-motion` honored; no animations beyond 120–150ms tint/color transitions.
- **Icons**: lucide (kept), 1.5px stroke, rendered at 15–16px in nav/data.

## 6. Layout grammars (one per surface — no card+table sameness)

| Surface | Grammar |
|---|---|
| **Shell** | 236px flat rail (no blur, no orbs) + hairline topbar; tibeb band as the stage's crown |
| **Dashboard** | ledger stat strip + chart panels + health/log split — dense registry view |
| **Guide editor** | content spine with a fixed step rail (the formalization journey as a real sequence — numbering *means* order here) |
| **AI module** | conversation rail: prompt composer bottom-locked, source citations as a hairline sidebar |
| **Moderation** | triage queue: row = report, left dock of decide/skip actions, stamp-style resolution (ማህተም) |
| **Auth** | centered panel on the plain canvas, tibeb band above, no gradient, no orbs |

## 7. Motion

Minimal by design. 120–150ms color/opacity transitions; a single orchestrated moment at most (e.g., shell mount); nothing decorative on hover; `prefers-reduced-motion: reduce` kills all transitions. No page-load stagger, no orbs, no parallax.

## 8. Enforcement hooks (for the later tickets)

- `docs/design-system.md` + agent instruction block (post-lock).
- Lint bans: raw hex/utilities outside tokens; `hover:` motion/lift utilities; `.glow-orb`, gradients in surfaces; fonts without Ethiopic fallback.
- Token-only utility contract; component ownership for shell/panel/status.

## 9. Open questions for the user

1. **Dark-first**: night as the default experience, teff paper as the light mode — is dark-first right for this admin, or should paper stay the default?
2. **Warmth**: coffee-night + gold + cream (v3) — or do you want the light mode cooler (ash paper instead of teff)?
3. **Stamp device (ማህተም)** for approved/rejected — keep, or too playful inside data rows?
4. **ጳጉሜን callout** as a real dashboard feature — keep in scope for the dashboard redesign?
5. **Type**: Sora display (current) vs Manrope; Fraunces dropped (no Ethiopic support).
6. **Density**: keep the hairline ledger strip + compact tables?

These were answered through the v4–v7 rounds and the labs; see section 10.

## 10. Locked decisions (v7 → final)

Resolved through the prototype rounds; these are final and must not be re-litigated in later tickets:

1. **Palette — product trio (mobile-aligned)**: slate navy #1E293B acts · emerald #10B981 grows · amber #F59E0B warms; red flags, blue informs. Slate-50 canvas #F8FAFC; clean charcoal night #14171A. M3 dropped — web discipline (hairlines, 8px radius, tint-only hovers).
2. **Type**: Sora display / Inter body / JetBrains Mono data, all with Noto Sans Ethiopic fallback; +1px/+0.1 line-height Amharic metrics rule; Geez numerals + Ethiopian-calendar dates in አማ.
3. **Devices kept**: tibeb weave (wearing the product trio), ማህተም stamps, ጳጉሜን 13th-month callout, Geez numerals, አማ toggle, light-first with dark mode.
4. **Rail treatment**: line icons · filled-row active (navy fill, white text; dark-mode text flips) · woven 18px tibeb section bars (ዋና / ማህበረሰብ / ስርዓት).
5. **Sidebar architecture — Full, closable, responsive**: full labeled rail with sub-groups; chevron collapse to a 64px icon rail (persisted); below 760px the rail becomes an off-canvas drawer (hamburger → backdrop → Escape/✕/select closes, scroll-locked).
6. **Reference artifacts**: prototype-v7.html (16 routed pages, the shell contract), sidebar-lab.html (architecture exploration), icon-lab.html (icon/ornament exploration).
