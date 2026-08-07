#!/usr/bin/env node
/**
 * Design-contract guardrails — Adisu Serategna admin (አዲሱ ሥራተኛ).
 *
 * Enforces the token-only contract (docs/design-system.md §12) on src/:
 *   1. no raw color hexes outside globals.css and the allowlists below
 *   2. no arbitrary-value color utilities (bg-[#…], text-[#…], border-[#…], …)
 *   3. no inline style= attributes carrying raw hex colors
 *   4. no module-local re-implementations of a src/components/ui primitive
 *
 * Run: pnpm check:design   (or node scripts/check-design-contract.js)
 * Exit 0 = clean · exit 1 = violations.
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

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css", ".html", ".js", ".mjs", ".svg"]);

const HEX_COLOR = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{8}\b/g;

const ARBITRARY_COLOR_UTILITY =
  /(?:^|[^A-Za-z0-9_-])((?:bg|text|border(?:-[trbl])?|from|to|via|ring|fill|stroke|shadow|outline|decoration|divide(?:-[xy])?|placeholder|caret|accent|selection)-\[#[0-9a-fA-F]{3,8}\])/g;

const INLINE_STYLE_HEX =
  /style\s*=\s*{[^{}\n]*#[0-9a-fA-F]{3,8}|style\s*=\s*["'`][^"'\n]*#[0-9a-fA-F]{3,8}/g;

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

function isAllowed(repoPath) {
  return ALLOWED.has(repoPath) || FIXME_ALLOWED.has(repoPath);
}

/** Comment lines and URL-bearing lines (hex-looking URL fragments) are skipped. */
function isSkippedLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*") ||
    line.includes("://")
  );
}

function scanFile(file, violations) {
  const repoPath = relative(ROOT, file);
  if (isAllowed(repoPath)) return;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (isSkippedLine(line)) return;
    const n = i + 1;
    for (const match of line.matchAll(HEX_COLOR)) {
      violations.push(
        `${repoPath}:${n} — raw color hex ${match[0]} — use a semantic token utility (bg-navy, text-ink, border-line, text-success-strong, …)`
      );
    }
    for (const match of line.matchAll(ARBITRARY_COLOR_UTILITY)) {
      violations.push(
        `${repoPath}:${n} — arbitrary-value color utility ${match[1]} — use a semantic token utility (bg-navy, text-ink, border-line, …)`
      );
    }
    for (const match of line.matchAll(INLINE_STYLE_HEX)) {
      violations.push(
        `${repoPath}:${n} — inline style carries a raw color (${match[0].slice(0, 40)}) — move it to a token-backed class`
      );
    }
  });
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

const files = collectFiles(SRC);
const violations = [];
for (const file of files) {
  const isUiFile = file.startsWith(`${UI_DIR}/`);
  scanFile(file, violations); // ui files must be token-clean too (chart.tsx is allowlisted)
  if (!isUiFile) scanOwnership(file, violations);
}

const TOKEN_MAP_HINT =
  "Token map: globals.css @theme inline exposes bg-canvas, bg-panel, bg-navy, bg-navy-tint, text-ink, text-muted-foreground, border-line, text-success-strong, bg-success-tint, …";

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
console.log("  ✓ no raw hex / arbitrary color utilities / inline-style colors / forked primitives");
if (FIXME_ALLOWED.size > 0) {
  console.log("  FIXME allowlist still active (surfaces #39–41 in parallel):");
  for (const path of FIXME_ALLOWED.keys()) console.log(`    · ${path}`);
}
console.log("design contract: OK");
process.exit(0);
