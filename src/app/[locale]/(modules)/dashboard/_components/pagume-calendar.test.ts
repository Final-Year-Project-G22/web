import { describe, expect, it } from "vitest";
import { pagumeLength, toEthiopian } from "./pagume-calendar";

/** Local-noon Date so calendar-day reads never straddle a date (DST-safe). */
const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

describe("toEthiopian", () => {
  it("maps known Gregorian anchors to the Ethiopian calendar", () => {
    // Ethiopian New Year (Meskerem 1) after the 6-day Pagume of leap years 2007/2011/2015 EC.
    expect(toEthiopian(at(2015, 9, 12))).toEqual({ year: 2008, month: 1, day: 1 });
    expect(toEthiopian(at(2019, 9, 12))).toEqual({ year: 2012, month: 1, day: 1 });
    expect(toEthiopian(at(2023, 9, 12))).toEqual({ year: 2016, month: 1, day: 1 });

    // Last day of Pagume for a 5-day year (2016 EC → 2017 EC).
    expect(toEthiopian(at(2024, 9, 10))).toEqual({ year: 2016, month: 13, day: 5 });
    expect(toEthiopian(at(2024, 9, 11))).toEqual({ year: 2017, month: 1, day: 1 });

    // Mid-year spot checks.
    expect(toEthiopian(at(2000, 1, 1))).toEqual({ year: 1992, month: 4, day: 22 });
    expect(toEthiopian(at(2026, 1, 15))).toEqual({ year: 2018, month: 5, day: 7 });
  });

  it("agrees with Intl's ethiopic calendar", () => {
    const dates = [
      at(2000, 1, 1),
      at(2015, 9, 11),
      at(2015, 9, 12),
      at(2019, 9, 11),
      at(2019, 9, 12),
      at(2022, 9, 11),
      at(2023, 9, 11),
      at(2023, 9, 12),
      at(2024, 9, 10),
      at(2025, 9, 10),
      at(2026, 1, 15),
    ];

    for (const date of dates) {
      const expected = toEthiopian(date);
      const parts = new Intl.DateTimeFormat("en-US-u-ca-ethiopic", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).formatToParts(date);
      const read = (type: string) => Number(parts.find((p) => p.type === type)?.value);
      expect({ year: read("year"), month: read("month"), day: read("day") }).toEqual(expected);
    }
  });
});

describe("pagumeLength", () => {
  it("returns 6 for Ethiopian leap years (year ≡ 3 mod 4): 2007, 2011, 2015, 2019", () => {
    for (const year of [2007, 2011, 2015, 2019]) {
      expect(pagumeLength(year)).toBe(6);
    }
  });

  it("returns 5 for non-leap years: 2016, 2017, 2018, 2020", () => {
    for (const year of [2016, 2017, 2018, 2020]) {
      expect(pagumeLength(year)).toBe(5);
    }
  });
});
