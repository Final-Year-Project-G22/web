import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: unknown): string {
  if (err == null) return "";
  const maybe = err as { title?: string; detail?: string } | undefined;
  if (maybe?.title) return maybe.title;
  if (maybe?.detail) return maybe.detail;
  try {
    return JSON.stringify(err);
  } catch {
    return "Request failed";
  }
}
