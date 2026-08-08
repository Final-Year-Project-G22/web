/**
 * Pure Ethiopian-calendar helpers. No calendar library: the Gregorian→Ethiopian
 * JDN conversion is verified against Intl's ethiopic calendar (see
 * pagume-calendar.test.ts).
 */

export interface EthiopianDate {
  year: number;
  month: number;
  day: number;
}

export function toEthiopian(date: Date): EthiopianDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  const jdn =
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045;

  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year = 4 * Math.floor((jdn - 1723856) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;
  return { year, month, day };
}

/** Pagume (the 13th month) length: 6 days in Ethiopian leap years (year ≡ 3 mod 4), else 5. */
export function pagumeLength(etYear: number): number {
  return (etYear + 1) % 4 === 0 ? 6 : 5;
}
