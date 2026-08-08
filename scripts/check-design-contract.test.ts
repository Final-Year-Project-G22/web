// @vitest-environment node
import { describe, expect, it } from "vitest";
import { isAllowed, isPaletteExempt, scanText, stripComments } from "./check-design-contract.js";

describe("check-design-contract scan", () => {
  it("flags raw color hexes in 3/4/6/8-digit forms", () => {
    const out = scanText(`const a = "#fff";
const b = "#abcd";
const c = "#ffffff";
const d = "#aabbccdd";`);
    expect(out).toHaveLength(4);
    for (const hex of ["#fff", "#abcd", "#ffffff", "#aabbccdd"]) {
      expect(out.some((v) => v.includes(hex))).toBe(true);
    }
  });

  it("flags arbitrary-value color utilities, incl. 4-digit forms", () => {
    const out = scanText('className="bg-[#123456] text-[#abcd]"');
    expect(out.some((v) => v.includes("bg-[#123456]"))).toBe(true);
    expect(out.some((v) => v.includes("text-[#abcd]"))).toBe(true);
  });

  it("flags Tailwind default-palette color utilities", () => {
    const out = scanText(
      'className="text-red-500 hover:bg-green-50 border-blue-200/50 ring-emerald-400"'
    );
    expect(out.some((v) => v.includes("text-red-500"))).toBe(true);
    expect(out.some((v) => v.includes("bg-green-50"))).toBe(true);
    expect(out.some((v) => v.includes("border-blue-200"))).toBe(true);
    expect(out.some((v) => v.includes("ring-emerald-400"))).toBe(true);
  });

  it("flags rgb()/oklch() literals but not rgb(var(...))", () => {
    const out = scanText(`const a = "rgb(30 41 59 / 0.06)";
const b = "rgba(0,0,0,0.5)";
const c = "oklch(0.7 0.1 200)";
const d = "rgb(var(--canvas))";`);
    expect(out).toHaveLength(3);
    expect(out.some((v) => v.includes("rgb("))).toBe(true);
    expect(out.some((v) => v.includes("rgba("))).toBe(true);
    expect(out.some((v) => v.includes("oklch("))).toBe(true);
    expect(out.some((v) => v.includes("rgb(var"))).toBe(false);
  });

  it("ignores comments and URL fragments while still scanning real code", () => {
    const out = scanText(`// brand color #4285F4
* JSDoc line mentioning #fff
const url = "https://example.com/path#section";
const a = 1; // trailing #ffffff
const b = 2; /* inline #123456 */
const el = <div {/* jsx #abcdef */} />;`);
    expect(out).toEqual([]);
  });

  it("flags a real hex on a line that also carries a URL", () => {
    const out = scanText('const accent = "#4285F4"; const ref = "https://example.com";');
    expect(out.some((v) => v.includes("#4285F4"))).toBe(true);
  });

  it("honors the file allowlists", () => {
    expect(isAllowed("src/app/globals.css")).toBe(true);
    expect(isAllowed("src/app/icon.svg")).toBe(true);
    expect(isAllowed("src/components/ui/chart.tsx")).toBe(true);
    expect(isAllowed("src/app/(auth)/auth/_components/login-form.tsx")).toBe(true);
    expect(isAllowed("src/app/[locale]/(modules)/dashboard/page.tsx")).toBe(false);
  });

  it("scopes the palette exemption to PALETTE_FIXME files only", () => {
    const exempt = "src/app/[locale]/(modules)/notifications/queue/page.tsx";
    const out = scanText('className="text-red-500"\nconst accent = "#4285F4";', {
      repoPath: exempt,
      skipPalette: true,
    });
    expect(out.some((v) => v.includes("text-red-500"))).toBe(false);
    expect(out.some((v) => v.includes("#4285F4"))).toBe(true);
    expect(isPaletteExempt(exempt)).toBe(true);
    expect(isPaletteExempt("src/app/[locale]/(modules)/dashboard/page.tsx")).toBe(false);
  });

  it("reports file:line positions", () => {
    const out = scanText('const ok = "bg-navy";\nconst bad = "#ff0000";');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatch(/^<string>:2 — raw color hex #ff0000/);
  });

  it("strips comments and URLs from scanned lines", () => {
    expect(stripComments("const a = 1; // #fff")).toBe("const a = 1; ");
    expect(stripComments("// full-line #fff")).toBe("");
    expect(stripComments(`const u = "https://example.com/#abc";`)).toBe(`const u = "";`);
  });
});
