import { landingDict } from "./dict/landing";
import { coreDict } from "./dict/core";
import { authSearchDict } from "./dict/auth-search";
import { adsDict } from "./dict/ads";
import { dashboardDict } from "./dict/dashboard";
import { jobsDict } from "./dict/jobs";
import { companyDict } from "./dict/company";
import { miscPagesDict } from "./dict/misc-pages";
import { adminDict } from "./dict/admin";
import { professionalDict } from "./dict/professional";
import { walletDict } from "./dict/wallet";

export const translations: Record<string, string> = {
  ...landingDict,
  ...coreDict,
  ...authSearchDict,
  ...adsDict,
  ...dashboardDict,
  ...jobsDict,
  ...companyDict,
  ...miscPagesDict,
  ...adminDict,
  ...professionalDict,
  ...walletDict,
};

export type TranslateVars = Record<string, string | number>;

export function tr(s: string, locale: string, vars?: TranslateVars): string {
  let out = locale === "en" && translations[s] ? translations[s] : s;
  if (vars) {
    for (const key of Object.keys(vars)) {
      out = out.replaceAll(`{${key}}`, String(vars[key]));
    }
  }
  return out;
}
