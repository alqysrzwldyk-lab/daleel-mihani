"use client";

import { useLocale } from "next-intl";
import { tr, type TranslateVars } from "@/i18n/translate";

export function useT(): (s: string, vars?: TranslateVars) => string {
  const locale = useLocale();
  return (s: string, vars?: TranslateVars) => tr(s, locale, vars);
}
