#!/usr/bin/env node
/**
 * Design-contract guardrails — Adisu Serategna admin (አዲሱ ሥራተኛ).
 *
 * Enforces the token-only contract (docs/design-system.md §11) on src/:
 *   1. no raw color hexes (3/4/6/8-digit) outside globals.css and the allowlists below
 *   2. no rgb()/oklch() color literals
 *   3. no arbitrary-value color utilities (bg-[#…], text-[#…], border-[#…], …)
 *   4. no Tailwind default-palette color utilities (text-red-500, bg-green-50, …)
 *   5. no inline style= attributes carrying raw color hexes
 *   6. no module-local re-implementations of a src/components/ui primitive
 *
 * Run: pnpm check:design   (or node scripts/check-design-contract.js)
 * Exit 0 = clean · exit 1 = violations.
 *
 * The scan internals are exported for the vitest self-test
 * (scripts/check-design-contract.test.ts); the CLI path only runs when this
 * file is executed directly.
 */

const { readdirSync, readFileSync, statSync } = require("node:fs");
const { join, relative } = require("node:path");

const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");

/** Files that are never scanned (repo-root-relative). Reasons are deliberate. */
const ALLOWED = new Map([
  // The token source of truth — this is the one place raw colors are defined.
  ["src/app/globals.css", "design tokens — the only file where raw colors may live"],
  // Brand vector asset (favicon), not component styling.
  ["src/app/icon.svg", "static brand asset (favicon) — vector art, not a component"],
  // Recharts internals: the #ccc/#fff selectors are chart-library defaults,
  // not design colors (recorded on #38, kept by #42).
  [
    "src/components/ui/chart.tsx",
    "recharts internal selectors (#ccc/#fff) — chart-library defaults, not design colors",
  ],
]);

/**
 * Pre-existing violations on surfaces being redesigned in parallel
 * (#39 shell+dashboard, #40 guide+AI, #41 moderation+auth). Each entry
 * must be removed when its lane lands — never add new violations here.
 */
const FIXME_ALLOWED = new Map([
  [
    "src/app/(auth)/auth/_components/login-form.tsx",
    "Google sign-in brand SVG fills (#4285F4 #34A853 #FBBC05 #EA4335) — auth redesign (#41) owns the call: token-convert or keep as a documented brand-asset exception",
  ],
]);

/**
 * PALETTE_FIXME — pre-existing Tailwind default-palette color utilities
 * (text-red-500, bg-green-50, border-blue-200, …) on surfaces outside this
 * rollout's scope. Every occurrence on this branch was enumerated at fix-up
 * commit time (124 utilities across 22 files; the recorded line lists below
 * are the branch baseline and shift as code moves).
 *
 * Policy: the entry is file-level and exempts ONLY the palette rule — the
 * hex, rgb()/oklch(), arbitrary-value and inline-style checks still run on
 * these files. Entries are pre-existing-only: prune a file when its surface
 * is redesigned; never add files or new palette utilities to in-scope work.
 */
const PALETTE_FIXME = new Map([
  [
    "src/app/[locale]/(modules)/admin/register/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 9 default-palette utilities (lines 101,115,148,148,148,149,149,149,94)",
  ],
  [
    "src/app/[locale]/(modules)/ai/ask/_components/chat-panel.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 6 default-palette utilities (lines 377,379,379,395,395,395)",
  ],
  [
    "src/app/[locale]/(modules)/ai/ask/_components/tool-use-indicator.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 9 default-palette utilities (lines 12,12,12,12,39,40,40,43,43)",
  ],
  [
    "src/app/[locale]/(modules)/ai/ask/debug/_components/debug-panel.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 8 default-palette utilities (lines 212,212,235,235,311,311,313,313)",
  ],
  [
    "src/app/[locale]/(modules)/ai/knowledge-base/_components/sidebar-documents.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 3 default-palette utilities (lines 190,193,193)",
  ],
  [
    "src/app/[locale]/(modules)/guide/_components/edit-guide-sidebar.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 3 default-palette utilities (lines 72,72,86)",
  ],
  [
    "src/app/[locale]/(modules)/guide/_components/edit-step-form.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 4 default-palette utilities (lines 312,312,328,464)",
  ],
  [
    "src/app/[locale]/(modules)/guide/[id]/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 1 default-palette utilities (lines 204)",
  ],
  [
    "src/app/[locale]/(modules)/library/categories/create/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 4 default-palette utilities (lines 108,116,128,96)",
  ],
  [
    "src/app/[locale]/(modules)/library/categories/[id]/edit/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 4 default-palette utilities (lines 131,139,147,159)",
  ],
  [
    "src/app/[locale]/(modules)/library/template-groups/create/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 9 default-palette utilities (lines 123,135,147,171,197,222,249,263,293)",
  ],
  [
    "src/app/[locale]/(modules)/library/template-groups/[id]/edit/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 9 default-palette utilities (lines 150,158,166,187,209,228,251,265,314)",
  ],
  [
    "src/app/[locale]/(modules)/library/template-groups/[id]/templates/create/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 4 default-palette utilities (lines 136,155,167,185)",
  ],
  [
    "src/app/[locale]/(modules)/library/template-groups/[id]/templates/[templateId]/edit/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 2 default-palette utilities (lines 153,161)",
  ],
  [
    "src/app/[locale]/(modules)/notifications/campaigns/[id]/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 15 default-palette utilities (lines 577,577,577,580,580,580,583,583,583,586,586,586,589,589,589)",
  ],
  [
    "src/app/[locale]/(modules)/notifications/campaigns/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 15 default-palette utilities (lines 49,49,49,52,52,52,55,55,55,58,58,58,61,61,61)",
  ],
  [
    "src/app/[locale]/(modules)/notifications/campaign-templates/create/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 1 default-palette utilities (lines 123)",
  ],
  [
    "src/app/[locale]/(modules)/notifications/campaign-templates/[id]/edit/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 1 default-palette utilities (lines 166)",
  ],
  [
    "src/app/[locale]/(modules)/notifications/queue/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 5 default-palette utilities (lines 19,20,21,22,23)",
  ],
  [
    "src/app/[locale]/(modules)/settings/password/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 9 default-palette utilities (lines 103,116,126,126,126,127,127,127,88)",
  ],
  [
    "src/app/[locale]/(modules)/taxonomy/sectors/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 1 default-palette utilities (lines 339)",
  ],
  [
    "src/app/[locale]/(modules)/taxonomy/tags/page.tsx",
    "pre-existing on dev; surface not in this rollout's scope — 2 default-palette utilities (lines 335,342)",
  ],
]);

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".html", ".js", ".mjs", ".svg"]);

const HEX_DIGITS = "(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})";
const HEX_COLOR = new RegExp(`#${HEX_DIGITS}\\b`, "g");

const ARBITRARY_COLOR_UTILITY = new RegExp(
  `(?:^|[^A-Za-z0-9_-])((?:bg|text|border(?:-[trbl])?|from|to|via|ring|fill|stroke|shadow|outline|decoration|divide(?:-[xy])?|placeholder|caret|accent|selection)-\\[#${HEX_DIGITS}\\])`,
  "g"
);

const NAMED_COLORS =
  "(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)";
const PALETTE_SHADES = "(?:50|100|200|300|400|500|600|700|800|900|950)";
const PALETTE_COLOR_UTILITY = new RegExp(
  `(?:^|[^A-Za-z0-9_-])((?:bg|text|border(?:-[trbl])?|ring|from|to|via|fill|stroke|outline|decoration|divide(?:-[xy])?|placeholder|caret|accent|selection)-${NAMED_COLORS}-${PALETTE_SHADES})(?![A-Za-z0-9_-])`,
  "g"
);

/** rgb()/rgba()/oklch() literals — only numeric forms, not rgb(var(--x)). */
const COLOR_FUNCTION = /\b(rgba?|oklch)\s*\(\s*(?=[0-9])/g;

const INLINE_STYLE_HEX =
  /style\s*=\s*{[^{}\n]*#[0-9a-fA-F]{3,8}|style\s*=\s*["'`][^"'\n]*#[0-9a-fA-F]{3,8}/g;

/** URL substrings (scheme://… up to the closing quote/whitespace), removed so
 *  hex-looking URL fragments are never read as colors. */
const URL_RE = /\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`<>()]+/gi;

/**
 * Strip comment and URL content so only real code is scanned:
 *  - full-line //, /* and * JSDoc lines are dropped entirely
 *  - trailing // and slash-star … star-slash comments (incl. JSX comment
 *    blocks) are removed
 *  - URL substrings (with fragments) are removed, but the rest of the line
 *    is still scanned — a line carrying both a URL and a real color now
 *    flags the color (no more ://-based whole-line skip).
 */
function stripComments(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return "";
  }
  return line
    .replace(URL_RE, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/, "");
}

/**
 * Scan a text blob the way the CLI scans a file. Returns violation strings
 * of the form "path:line — message". Exported for the vitest self-test.
 */
function scanText(text, { repoPath = "<string>", skipPalette = false } = {}) {
  const violations = [];
  text.split("\n").forEach((line, i) => {
    const code = stripComments(line);
    if (!code.trim()) return;
    const n = i + 1;
    for (const match of code.matchAll(HEX_COLOR)) {
      violations.push(
        `${repoPath}:${n} — raw color hex ${match[0]} — use a semantic token utility (bg-navy, text-ink, border-line, text-success-strong, …)`
      );
    }
    for (const match of code.matchAll(ARBITRARY_COLOR_UTILITY)) {
      violations.push(
        `${repoPath}:${n} — arbitrary-value color utility ${match[1]} — use a semantic token utility (bg-navy, text-ink, border-line, …)`
      );
    }
    if (!skipPalette) {
      for (const match of code.matchAll(PALETTE_COLOR_UTILITY)) {
        violations.push(
          `${repoPath}:${n} — default-palette color utility ${match[1]} — use a semantic token utility (text-success-strong, bg-success-tint, text-destructive-strong, …)`
        );
      }
    }
    for (const match of code.matchAll(COLOR_FUNCTION)) {
      violations.push(
        `${repoPath}:${n} — raw ${match[1]}(…) color literal — use a semantic token utility (bg-navy, text-ink, border-line, …)`
      );
    }
    for (const match of code.matchAll(INLINE_STYLE_HEX)) {
      violations.push(
        `${repoPath}:${n} — inline style carries a raw color (${match[0].slice(0, 40)}) — move it to a token-backed class`
      );
    }
  });
  return violations;
}

function isAllowed(repoPath) {
  return ALLOWED.has(repoPath) || FIXME_ALLOWED.has(repoPath);
}

/** PALETTE_FIXME exempts only the palette rule; all other checks still run. */
function isPaletteExempt(repoPath) {
  return PALETTE_FIXME.has(repoPath);
}

function scanFile(file, violations) {
  const repoPath = relative(ROOT, file);
  if (isAllowed(repoPath)) return;
  const skipPalette = isPaletteExempt(repoPath);
  violations.push(...scanText(readFileSync(file, "utf8"), { repoPath, skipPalette }));
}

function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, out);
    } else if (SCAN_EXTENSIONS.has(entry.slice(entry.lastIndexOf(".")))) {
      out.push(full);
    }
  }
  return out;
}

/* Component ownership: a file outside src/components/ui that is named like a
   ui primitive is a fork-in-progress — compose the primitive instead. */
const UI_DIR = join(SRC, "components", "ui");
const primitiveNames = new Set(
  readdirSync(UI_DIR)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.slice(0, -".tsx".length))
);

function scanOwnership(file, violations) {
  const repoPath = relative(ROOT, file);
  if (isAllowed(repoPath)) return;
  const base = file.slice(file.lastIndexOf("/") + 1);
  const stem = base.endsWith(".tsx")
    ? base.slice(0, -4)
    : base.endsWith(".ts")
      ? base.slice(0, -3)
      : null;
  if (stem && primitiveNames.has(stem)) {
    violations.push(
      `${repoPath} — module-local file named like the ui primitive "${stem}" — compose src/components/ui/${stem}.tsx instead of re-implementing it`
    );
  }
}

const TOKEN_MAP_HINT =
  "Token map: globals.css @theme inline exposes bg-canvas, bg-panel, bg-navy, bg-navy-tint, text-ink, text-muted-foreground, border-line, text-success-strong, bg-success-tint, …";

function report(files, violations) {
  if (violations.length > 0) {
    console.log(`design contract check — ${files.length} files under src/`);
    console.log(`\n${violations.length} violation(s):\n`);
    for (const v of violations) console.log(`  ✗ ${v}`);
    console.log(`\n  ${TOKEN_MAP_HINT}`);
    if (FIXME_ALLOWED.size > 0) {
      console.log(
        "\n  FIXME allowlist (surfaces #39–41 in parallel — remove entries when they land):"
      );
      for (const [path, reason] of FIXME_ALLOWED) console.log(`    · ${path} — ${reason}`);
    }
    console.log("\ndesign contract: FAIL");
    process.exit(1);
  }

  console.log(`design contract check — ${files.length} files under src/`);
  console.log(
    "  ✓ no raw hex / rgb()·oklch() literals / arbitrary & default-palette color utilities / inline-style colors / forked primitives"
  );
  if (FIXME_ALLOWED.size > 0) {
    console.log("  FIXME allowlist still active (surfaces #39–41 in parallel):");
    for (const path of FIXME_ALLOWED.keys()) console.log(`    · ${path}`);
  }
  if (PALETTE_FIXME.size > 0) {
    console.log("  PALETTE_FIXME still active (pre-existing default-palette utilities):");
    for (const path of PALETTE_FIXME.keys()) console.log(`    · ${path}`);
  }
  console.log("design contract: OK");
  process.exit(0);
}

function main() {
  const files = collectFiles(SRC);
  const violations = [];
  for (const file of files) {
    const isUiFile = file.startsWith(`${UI_DIR}/`);
    scanFile(file, violations); // ui files must be token-clean too (chart.tsx is allowlisted)
    if (!isUiFile) scanOwnership(file, violations);
  }
  report(files, violations);
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED,
  FIXME_ALLOWED,
  PALETTE_FIXME,
  HEX_COLOR,
  ARBITRARY_COLOR_UTILITY,
  PALETTE_COLOR_UTILITY,
  COLOR_FUNCTION,
  isAllowed,
  isPaletteExempt,
  stripComments,
  scanText,
  scanFile,
};
