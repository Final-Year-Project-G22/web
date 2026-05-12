"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdminLanguageState {
  language: string;
  setLanguage: (lang: string) => void;
}

export const useAdminLanguageStore = create<AdminLanguageState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "admin-language",
    }
  )
);
