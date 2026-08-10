import { describe, expect, it } from "vitest";
import {
  REPORT_STATUS_KEYS,
  REPORT_STATUS_PILL_VARIANTS,
  REPORT_STATUS_STAMP_VARIANTS,
  REPORT_STATUS_TRANSLATION_KEYS,
  reportStatusLabelKey,
  triageNextAction,
} from "./report-status";

describe("report status grammar (single source of truth)", () => {
  it("orders the queue filter keys all → dismissed", () => {
    expect(REPORT_STATUS_KEYS).toEqual(["all", "pending", "under_review", "resolved", "dismissed"]);
  });

  it("maps every status key to a moderation translation key", () => {
    for (const key of REPORT_STATUS_KEYS) {
      expect(REPORT_STATUS_TRANSLATION_KEYS[key]).toMatch(/^status/);
    }
  });

  it("resolves row labels and falls back to dismissed for unknown statuses", () => {
    expect(reportStatusLabelKey("pending")).toBe("statusPending");
    expect(reportStatusLabelKey("under_review")).toBe("statusUnderReview");
    expect(reportStatusLabelKey("resolved")).toBe("statusResolved");
    expect(reportStatusLabelKey("dismissed")).toBe("statusDismissed");
    expect(reportStatusLabelKey("mystery-status")).toBe("statusDismissed");
  });

  it("keeps decided statuses on stamps and open statuses on pills", () => {
    expect(REPORT_STATUS_STAMP_VARIANTS).toEqual({ resolved: "good", dismissed: "bad" });
    expect(REPORT_STATUS_PILL_VARIANTS).toEqual({ pending: "warning", under_review: "info" });
  });

  it("offers skip on pending, return-to-pending on in-review, verdicts on decided", () => {
    expect(triageNextAction("pending")).toBe("skip");
    expect(triageNextAction("under_review")).toBe("returnToPending");
    expect(triageNextAction("resolved")).toBe("decided");
    expect(triageNextAction("dismissed")).toBe("decided");
    expect(triageNextAction("mystery-status")).toBe("skip");
  });
});
