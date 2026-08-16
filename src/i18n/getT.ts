import { getLocale } from "next-intl/server";
import { tr, type TranslateVars } from "@/i18n/translate";

export async function getT(): Promise<(s: string, vars?: TranslateVars) => string> {
  const locale = await getLocale();
  return (s: string, vars?: TranslateVars) => tr(s, locale, vars);
}
