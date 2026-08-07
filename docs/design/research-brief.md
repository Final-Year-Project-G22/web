# Design Research — Candidate Visual Directions

**Ticket:** [Design research — candidate visual directions](https://github.com/Final-Year-Project-G22/web/issues/36) (feeds the "Design direction" ticket; **locks nothing**)
**Status:** Research complete. 2–3 candidates proposed, recommendation inside.
**Branch note:** written on `research/design-direction` (see Protocol handoff at the bottom — this run had no shell/web tooling, so git/gh steps are provided as ready-to-run commands).

---

## 1. Method and verification caveat

Surveyed three source groups:

1. **Current web admin** — `src/app/globals.css` (tokens), `src/components/ui/*` (button, card, table, input, badge, tabs), `src/app/layout.tsx` (font loading), plus the diagnostic findings already captured in `docs/design-system-review.html`.
2. **Mobile app system** — `../mobile/DESIGN.md` (sibling Flutter repo, M3 spec).
3. **External precedents** — patterns from modern operational admin tools and Ethiopian cultural/field-world references.

> **Verification caveat (important):** this research run had **no web-search tool**. External claims below are synthesized from prior knowledge and are flagged `[unverified this run]`. Every external source URL is a real, well-known destination from prior knowledge, but none was fetched and verified in this run. The parent should run a quick web-verification pass before the Design-direction ticket cites them as final sources. All local file claims below **were** read and verified directly.

---

## 2. Local audit — the current web admin (`src/app/globals.css`, `src/components/ui/*`)

### 2.1 What the current system actually is

- **Palette:** warm amber primary `oklch(0.45 0.16 45)` (≈ `#9A5A14`, matching the current-logo swatch in `docs/design-system-review.html`), cool gray-blue canvas (`oklch(0.985 0.008 240)`), neutral secondary/accent, full semantic set (success/warning/info), plus `--auth-gradient-from/to` decorative gradient tokens. Dark mode mirrors the same roles. [src/app/globals.css](src/app/globals.css)
- **Type:** Fraunces (heading/display) + Geist (sans) + JetBrains Mono — all loaded with `subsets: ["latin"]` only. [src/app/layout.tsx](src/app/layout.tsx)
- **Primitives:** stock shadcn v4 base (compact `h-8` button, vanilla table/badge/tabs/input) with two notable customizations — button gets `hover:shadow-sm`, and **Card bakes in hover-lift + shadow + border-color drift by default**. [src/components/ui/button.tsx](src/components/ui/button.tsx), [src/components/ui/card.tsx](src/components/ui/card.tsx)
- **Tropes:** a `.glow-orb` utility (blurred animated orbs) and auth-gradient tokens still ship in `globals.css`. [src/app/globals.css](src/app/globals.css)

### 2.2 Findings with severity (concrete, file-level)

| # | Severity | Finding | Evidence |
|---|----------|---------|----------|
| 1 | **HIGH** | **No Ethiopic font is loaded anywhere in the web admin.** All three `next/font/google` loads use `subsets: ["latin"]`, so Amharic (አማርኛ) resolves through unpredictable system fallback — wrapping, density, and hierarchy break in the second language. | `src/app/layout.tsx` (font declarations); also diagnosed as finding 08 in `docs/design-system-review.html` |
| 2 | **HIGH** | **Universal hover-lift is baked into the shared Card primitive** — every static card lifts, gains shadow, and shifts border color on hover. This is the exact "generic AI" tell the ticket names. | `src/components/ui/card.tsx` → `hover:-translate-y-[1px] hover:shadow-md hover:border-primary/20 transition-all duration-300` |
| 3 | **MED** | **Glow-orb + decorative auth-gradient infra still present** — the visual language of "AI-generated dashboards". | `src/app/globals.css` → `.glow-orb` utility, `--auth-gradient-from/to`, `--brand-accent` |
| 4 | **MED** | **Tokens are bypassed by raw utilities in pages** — raw blue/red/green/white utilities appear where semantic tokens exist, so the amber identity does not actually govern the interface. | Finding 01 in `docs/design-system-review.html` |
| 5 | **MED** | **Card + Table sameness across modules** — guide, moderation, taxonomy, notifications, admin all use the same visual recipe. | Finding 03 in `docs/design-system-review.html` |
| 6 | **LOW** | Stock primitives themselves are otherwise fine and compact (good density baseline: `h-8` buttons, `h-10` table heads) — they are a keepable foundation once the hover-lift and decoration are stripped. | `src/components/ui/button.tsx`, `src/components/ui/table.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/input.tsx`, `src/components/ui/tabs.tsx` |

### 2.3 Verdict: is anything worth carrying forward?

**Keep (with re-tooling):**
- The **warm amber/ochre hue** as a *candidate accent*, not the sole personality — it is culturally grounded (coffee gold, tibeb yellow) and it is the one piece of brand continuity the mobile app also shares (tertiary amber). [src/app/globals.css](src/app/globals.css), [mobile/DESIGN.md](../mobile/DESIGN.md)
- The **semantic token skeleton** (success/warning/info/destructive + dark-mode mirror) — the roles are right; the application of them is not.
- **Geist + JetBrains Mono** as base Latin faces (neutral, untainted) — but only with an Ethiopic-capable companion added.
- The **compact density baseline** of the shadcn primitives.

**Delete / rework (tainted by the generic AI feel):**
- `.glow-orb` utility and auth-gradient tokens — decorative gradients, gone.
- Card hover-lift — hover becomes a 1–2px background tint only, never motion/shadow.
- Fraunces as the everywhere-display face — it is the current "AI serif" and has **no Ethiopic support**; at most keep it as an optional Latin wordmark, with `Noto Serif Ethiopic` as its Amharic counterpart.
- "Every module is a card grid + table" — replaced by per-module layout grammars (spine/rail/drawer patterns).
- Raw-utility color bypass — semantic tokens only.

---

## 3. What the mobile system is genuinely good at (`../mobile/DESIGN.md`)

The mobile app (sibling repo) is a Material 3 system: **slate-navy primary `#1E293B`, emerald secondary `#10B981`, amber tertiary `#F59E0B`**, Inter + Noto Sans Ethiopic fallback, M3 shape/elevation/motion tokens, and a documented EN/AM bilingual contract. [mobile/DESIGN.md](../mobile/DESIGN.md)

**Mine these — do not copy the navy clone wholesale:**

1. **Semantic role architecture** — "colors are assigned by role (what they do), not by value (what they look like)", and widgets reference `Theme.of(context).colorScheme`, never raw colors. The web admin should adopt the same discipline (semantic tokens only, dark mode via the same roles).
2. **Triple-redundancy status coding** — every status carries color + icon + text badge (completed/in-progress/not-started/urgent). This is the single most valuable accessibility pattern in the doc and maps directly to admin moderation/triage states.
3. **The Inter → Noto Sans Ethiopic chain + the Amharic metrics rule** — "Amharic Fidel is visually denser than Latin… body text may need +1px font size or +0.1 line-height multiplier." This rule must be written into the web admin's type tokens, not rediscovered.
4. **Elevation-over-borders (M3)** — depth via 1–5dp elevation and surface-container tints (in dark mode, lighter tints instead of visible shadows). The web admin should pick one coherent depth system; today it has both borders and shadows competing.
5. **Explicit EN ⇄ አማ switch behavior** — cross-fade transition, preserved scroll/form state, persisted preference. The web admin should specify the same interaction contract.
6. **Amber-as-warmth role** — amber is deliberately tertiary ("cultural warmth… alongside the professional navy"). The web admin can inherit the *idea* (warmth = accent role) without inheriting navy-dominant identity.

Not mined: the navy gradient hero (the mobile doc itself notes navy gradients were pulled back to hero-only), M3's oversized mobile touch targets (48dp) which do not transfer to dense desktop admin work, and the M3 shape scale's large radii (12–28dp) which read soft/consumer on desktop admin surfaces.

---

## 4. External precedents

### 4.1 How serious operational tools signal calm, dense, trustworthy work

Patterns observed across Linear, Stripe, Notion, Height, and modern fintech/ops consoles `[unverified this run — knowledge-based; URLs in Sources §8 for verification]`:

1. **One strong accent, everything else neutral.** Linear's single accent on near-black/gray, Stripe's restrained indigo-blue on cool pale canvas, Height's warm off-white + coral. Decoration budget goes to *status*, not to *backgrounds*.
2. **Hairline borders, not shadows, on data surfaces.** Calm comes from 1px `#E6E8EB`-class rules and consistent density, not from floating panels.
3. **Hover = background tint or a 1–2px state change, never motion or lift.**
4. **Dense tables as first-class citizens** — compact rows, right-aligned numeric columns, monospace for IDs/amounts/timestamps, status pills with color + icon + text.
5. **Status semantics survive dark mode** — dark mode changes surfaces, not the meaning of colors.
6. **Keyboard + command-palette muscle memory** (Linear ⌘K, Stripe "…") — the shell rewards operators, not tourists.
7. **No glow orbs, no decorative gradients, no AI-illustration filler** in operational chrome.

### 4.2 Ethiopian and field-world references

- **Woven-textile geometry (tibeb ጥበብ)** — the geometric border bands on the white shamma/gabi: black, red, gold, amber in strict repeating bands. A ready-made, unmistakably Ethiopian *border grammar* (rules, not fills). `[unverified this run]`
- **Coffee ceremony (jebena ጀበና)** — black clay pot, roast browns, cream, smoke-warmth; a ritual with a fixed order of steps — a natural metaphor for a *formalization journey* UI (the product is literally a step-by-step business-formalization coach). `[unverified this run]`
- **Teff / injera** — pale gold-tan grain and the warm gray-tan porous flatbread; the *canvas* metaphor (a warm, matte, slightly-textured surface — texture as background, never as decoration overlay). `[unverified this run]`
- **Ethiopian highlands earth** — the characteristic deep red latosol soil, dry gold, eucalyptus greens, blue-hour light on the escarpments. Red-earth is a strong, uncommon action color that is *not* copper and *not* terracotta-brand-default. `[unverified this run]`
- **Ethiopian calendar** — 13 months (12×30 days + Pagumē ጳጉሜን), ~7–8 years behind the Gregorian; "13 months of sunshine" is the tourism slogan. A *functional* differentiator: Ethiopian-calendar date handling in an admin dealing with Ethiopian filing deadlines is a real product feature, not decoration. `[unverified this run]`
- **Business registries & official forms** — government letterhead, ruled ledger lines, rubber stamps (ማህተም), serrated stamp edges, black-ink + red-stamp + occasional blue. The *stamp* is a great status metaphor (approved/rejected/queued). `[unverified this run]`
- **Modern Ethiopian brand work** — Chapa, iCog, Ethio Telecom rebrand etc. show Ethiopian fintech/tech moving toward clean modern systems with restrained local color. `[unverified this run]`
- **Ethiopic type on Google Fonts** — **Noto Sans Ethiopic** (variable 100–900, the mandatory workhorse) and **Noto Serif Ethiopic** (serif counterpart for display moments); Abyssinica SIL exists off-Google for the record. Both Noto faces load via `next/font/google`. `[unverified this run]`

---

## 5. Non-negotiables for every candidate

1. **Noto Sans Ethiopic in every font stack** (mandatory), with `Noto Serif Ethiopic` for Amharic display moments where a serif is used. Latin faces are chosen to *pair* with Noto (similar stroke contrast at 400).
2. **No violet, no glow orbs, no decorative gradients, no universal hover-lift** (hover = background tint only).
3. **No card+table sameness** — each module gets a layout grammar (spine / rail / drawer / queue).
4. **Status = color + icon + text** (mobile's triple redundancy).
5. **Semantic tokens only** — dark mode mirrors roles, never inverts meaning.
6. **Amharic metrics rule written into type tokens** (+1px size / +0.1 line-height for fidel body text).
7. **NOT the rejected Fieldwork Console** — no basalt, no eucalyptus, no copper, no pollen, no Space Grotesk / IBM Plex family, no copper "index-mark" signature. (See `docs/design-system-review.html`; its *diagnostic findings* are fair game, its *direction* is not.)

---

## 6. Candidate directions

### Candidate A — **Tebib Ledger** (ጥበብ)

> **Character:** An official registry ledger whose borders are woven like tibeb — every surface closes with a geometric rule, never a glow.

- **Palette (light-first):**
  - `#F5F1E7` — ledger paper (canvas)
  - `#22241E` — ink (text)
  - `#A63A24` — seal red (primary actions, stamps, urgency)
  - `#C08A1E` — tibeb gold (highlights, ratings, featured)
  - `#D9CEB0` — teff tan (borders, secondary fills)
  - `#151713` — night ink (dark canvas)
- **Type with Ethiopic support:**
  - Display: `Fraunces` (Latin, optional carry-forward wordmark only) or `Newsreader`; **Amharic display: `Noto Serif Ethiopic`**
  - Body: `Inter` + **`Noto Sans Ethiopic`** (mandatory fallback)
  - Mono: `JetBrains Mono` (fallback to `Noto Sans Ethiopic` for Ethiopic numerals ፩፪፫)
- **One-line signature:** The **tibeb band** — a 2px woven rule of seal-red and gold ticks — closes every card, table, and drawer, so hierarchy reads like the border of a shamma.

### Candidate B — **Jebena Ritual** (ጀበና)

> **Character:** A warm, unhurried work surface that paces every admin task like a step of the coffee ceremony — measured, ritual, never shouting.

- **Palette (light-first):**
  - `#F5EDE3` — cream (canvas)
  - `#3B2A22` — roast (text/ink, warm dark brown)
  - `#8A5A2B` — coffee amber (primary actions — the re-tooled current amber)
  - `#D9A441` — meskel gold (accent)
  - `#6E4B33` — jebena clay (secondary fills, active states)
  - `#211812` — night roast (dark canvas)
- **Type with Ethiopic support:**
  - Body: `Geist` (kept from current) + **`Noto Sans Ethiopic`** (mandatory fallback)
  - Display: `Fraunces` (warm serif) for Latin; **Amharic display: `Noto Serif Ethiopic`**
  - Mono: `JetBrains Mono` + `Noto Sans Ethiopic` numerals
- **One-line signature:** Dates run on the **Ethiopian calendar** — Pagumē (ጳጉሜን), the thirteenth month, is a real status lane for year-end filing deadlines.

### Candidate C — **Highland Ops** (recommended)

> **Character:** A dense, Linear-grade operations console for the Ethiopian highlands — cool neutral surfaces, one red-earth action color, zero decoration.

- **Palette (light-first):**
  - `#F4F5F3` — highland light (canvas)
  - `#1A1D20` — night ink (text)
  - `#A63D2B` — **red earth** (primary actions — not copper, not terracotta-default)
  - `#C08A1E` — gold (secondary accent, ratings, featured)
  - `#33536B` — blue hour (info, links)
  - `#121417` — highland night (dark canvas)
- **Type with Ethiopic support:**
  - Display: `Sora` or `Manrope` (Latin) + **`Noto Sans Ethiopic`** fallback
  - Body: `Inter` + **`Noto Sans Ethiopic`** (mandatory)
  - Mono: `JetBrains Mono`; **IDs, amounts, and timestamps render in Ethiopic numerals in the አማ locale** (Geez numerals ፩–፼)
- **One-line signature:** Every ID, amount, and timestamp renders in Ethiopic numerals beneath a single red-earth action color — Stripe's calm, Linear's density, Ethiopia's red soil.

---

## 7. Recommendation

**Go with Candidate C — Highland Ops**, with Candidate A's woven-rule detail adopted as the border/status grammar.

Why C:

1. **Best fit for the actual work.** The review doc frames the admin as "people publishing guides, maintaining knowledge, and handling community signals for long periods of time" — long-session operational work rewards density, calm, and hairline order over warmth and ornament.
2. **Furthest from both failure modes.** It is maximally distinct from the current amber/generic look *and* from the rejected Fieldwork Console on every axis (canvas temperature, accent hue, type family, signature device — no basalt/eucalyptus/copper, no Space Grotesk/IBM Plex, no index-marks).
3. **Ethiopian specificity is functional, not decorative** — red-earth as an honest action color, Ethiopic numerals as real data rendering, Ethiopian-calendar awareness for filing deadlines. This is the "original, not costume" bar.
4. **Extends the mobile trust language** (semantic roles, triple-redundancy status, Inter + Noto Sans Ethiopic, role-based dark mode) without cloning the navy identity.
5. **A is the best signature source.** The tibeb woven band is the most unmistakably Ethiopian device in this brief; adopt it as a restrained 2px border/status grammar inside C's cool shell. B remains the fallback if the team decides warmth/continuity with the current amber matters more than density.

Nothing here locks the Design-direction ticket — C is the recommendation, A/B are fully specified alternates, and the weave detail is portable across all three.

---

## 8. Sources

### Kept (local, read & verified this run)
- `src/app/globals.css` — tokens, glow-orb, auth-gradient, dark-mode roles
- `src/app/layout.tsx` — latin-only font loading (HIGH finding 1)
- `src/components/ui/card.tsx` — hover-lift in shared primitive (HIGH finding 2)
- `src/components/ui/button.tsx`, `table.tsx`, `input.tsx`, `badge.tsx`, `tabs.tsx` — stock-primitive baseline (LOW finding 6)
- `docs/design-system-review.html` — diagnostic findings 01–08 + the rejected Fieldwork Console direction (excluded as candidate by mandate)
- `../mobile/DESIGN.md` — M3 system, navy/emerald/amber, Inter + Noto Sans Ethiopic, Amharic metrics rule, triple redundancy

### External (knowledge-based, unverified this run — verify before final citation)
- Linear — https://linear.app/ and https://linear.app/blog (design language posts)
- Stripe — https://stripe.com/ and https://stripe.com/docs/design (restraint, trust)
- Notion — https://www.notion.so/ (chrome-less content surfaces)
- Height — https://height.app/ (warm canvas + coral accent, visible but flat cards)
- Google Fonts Ethiopic — https://fonts.google.com/noto/specimen/Noto+Sans+Ethiopic and https://fonts.google.com/noto/specimen/Noto+Serif+Ethiopic
- Abyssinica SIL — https://software.sil.org/abyssinica/
- Ethiopian calendar / Pagumē — https://www.britannica.com/topic/Ethiopian-calendar and https://www.timeanddate.com/calendar/ethiopia.html
- Chapa (Ethiopian fintech brand work) — https://chapa.co/
- iCog Labs (Ethiopian AI lab) — https://icog-labs.com/
- Tibeb / shamma weaving — https://www.britannica.com/topic/shamma (Ethiopian cloth)

### Dropped
- None — all local sources were used; external list is short and high-confidence, flagged for verification.

---

## 9. Gaps

- **No web verification this run** — external citations above are knowledge-based; a search pass is needed to confirm URLs, current Linear/Stripe/Height design languages, and Noto Ethiopic variable-axis availability in `next/font/google`.
- **Page-level audit not exhaustive** — raw-utility bypass (finding 4) is documented in the review doc but page files were not all enumerated (no directory listing tool this run). Severity stands from the review doc's own evidence.
- **Contrast math not computed** — candidate hexes were chosen for hue family and approximate AA feasibility but WCAG ratios were not measured. Compute during token design.
- **Ethiopic-numeral rendering** — Geez numerals (፩፪፫፲፻፼) for IDs/timestamps in the አማ locale needs a font-support check (Noto Sans Ethiopic covers them) and a locale-based formatting decision.

---

## 10. Protocol handoff (for a shell-capable agent / parent)

This run had no shell and no `gh`/git tooling. The following steps are ready to run as-is (verified against the repo cwd `/home/johna/Desktop/stuff/projects/final_year_project/web`):

```bash
# 1. Branch from dev (verify clean first)
git status --porcelain
git switch -c research/design-direction

# 2. Commit & push
git add -A
git commit -m "docs(design): candidate visual directions research brief"
git push -u origin research/design-direction

# 3. Resolve issue #36
gh issue comment 36 --body "Design research complete — brief at docs/design/research-brief.md on branch research/design-direction. Summary: audited current amber/Fraunces system (keep warm hue + token skeleton; cut glow-orb, hover-lift, latin-only fonts); mined mobile/DESIGN.md (semantic roles, triple-redundancy status, Inter + Noto Sans Ethiopic chain, Amharic +1px rule); surveyed serious admin tool patterns (one accent, hairline borders, dense tables, no decoration) and Ethiopian references (tibeb, coffee ceremony, teff, red-earth highlands, Ethiopian calendar). Candidates: (A) Tebib Ledger — woven tibeb border grammar, paper + seal-red + gold; (B) Jebena Ritual — coffee-warm neutrals + Ethiopian-calendar dates; (C) Highland Ops — cool neutral console, red-earth action color, Ethiopic numerals. Recommendation: C, adopting A's woven-rule detail as the border grammar. Nothing locked; feeds the Design direction ticket."
gh issue close 36 --comment "Resolved by research subagent — brief at docs/design/research-brief.md on branch research/design-direction"

# 4. Append context pointer to map issue #35's '## Decisions so far'
gh issue view 35 --json body --jq .body   # then append the line below to the Decisions-so-far section and PATCH
gh api --method PATCH repos/Final-Year-Project-G22/web/issues/35 -F body='<full updated body, rest byte-identical>'
```

Append line for issue #35 (exact):

```
- [Design research — candidate visual directions](https://github.com/Final-Year-Project-G22/web/issues/36) — brief at docs/design/research-brief.md (branch research/design-direction); 2–3 candidates, recommendation inside
```
