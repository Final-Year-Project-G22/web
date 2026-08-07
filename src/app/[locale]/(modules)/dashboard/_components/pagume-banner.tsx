"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ጳጉሜን — the Ethiopian 13th month as a live year-end filing window
 * (locked §10.3, reference prototype-v7). No calendar library: a JDN
 * Gregorian→Ethiopian conversion (verified against Intl's ethiopic
 * calendar) plus Intl for localized month/date names.
 */
function toEthiopian(date: Date): { year: number; month: number; day: number } {
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

export function PagumeBanner() {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  /* Date work happens after mount so server HTML and client hydration
     never disagree about "today". */
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);

  const info = useMemo(() => {
    if (!today) return null;
    const et = toEthiopian(today);
    const pagumeLength = (et.year + 1) % 4 === 0 ? 6 : 5;
    const daysUntil = (13 - et.month) * 30 - (et.day - 1);
    const pagumeStart = new Date(today);
    pagumeStart.setDate(today.getDate() + daysUntil);

    const intlLocale = locale === "am" ? "am-ET" : "en";
    const monthName = new Intl.DateTimeFormat(intlLocale, {
      calendar: "ethiopic",
      month: "long",
      numberingSystem: "latn",
    }).format(today);
    const startDate = new Intl.DateTimeFormat(intlLocale, {
      month: "long",
      day: "numeric",
      numberingSystem: "latn",
    }).format(pagumeStart);

    return { et, pagumeLength, monthName, startDate };
  }, [today, locale]);

  if (!info) return null;

  const { et, pagumeLength, monthName, startDate } = info;
  const inPagume = et.month === 13;
  const daysLeft = inPagume ? pagumeLength - et.day : 0;

  return (
    <div
      role="note"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-warning/40 bg-warning-tint px-4 py-2.5 text-[12.5px]"
    >
      <span className="rounded border border-current bg-panel px-2 py-0.5 font-display text-[11.5px] font-bold tracking-[0.06em] whitespace-nowrap text-warning-strong">
        {t("pagume.flag")}
      </span>

      <p className={cn("min-w-0 flex-1 basis-56 text-ink-2", locale === "am" && "fidel")}>
        {inPagume
          ? daysLeft > 0
            ? t("pagume.open", { days: daysLeft })
            : t("pagume.openLast")
          : t("pagume.soon", { date: startDate, done: et.month })}
      </p>

      <span
        aria-hidden="true"
        className="flex h-2 min-w-[150px] flex-1 basis-40 gap-[3px] overflow-hidden rounded-[3px]"
      >
        {Array.from({ length: 13 }, (_, i) => {
          const n = i + 1;
          return (
            <span
              key={n}
              className={cn(
                "h-full flex-1 rounded-[2px]",
                n < et.month
                  ? "bg-success"
                  : n === et.month
                    ? "bg-warning"
                    : "border border-line bg-panel-2"
              )}
            />
          );
        })}
      </span>

      <span className="text-[11.5px] font-medium whitespace-nowrap text-muted">
        {t("pagume.monthMeta", { month: et.month, name: monthName })}
      </span>
    </div>
  );
}
