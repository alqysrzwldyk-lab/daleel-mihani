export type ProfessionItem = {
  key: string;
  icon: string;
  arabic: string;
};

const PREDEFINED: ProfessionItem[] = [
  { key: "programmer", icon: "💻", arabic: "مبرمج" },
  { key: "accountant", icon: "📊", arabic: "محاسب" },
  { key: "doctor", icon: "🩺", arabic: "طبيب" },
  { key: "engineer", icon: "⚙️", arabic: "مهندس" },
  { key: "teacher", icon: "📚", arabic: "معلم" },
  { key: "designer", icon: "🎨", arabic: "مصمم" },
  { key: "lawyer", icon: "⚖️", arabic: "محامي" },
  { key: "nurse", icon: "💉", arabic: "ممرض/ة" },
  { key: "chef", icon: "👨‍🍳", arabic: "طباخ" },
  { key: "electrician", icon: "🔌", arabic: "كهربائي" },
  { key: "plumber", icon: "🔧", arabic: "سباك" },
  { key: "driver", icon: "🚗", arabic: "سائق" },
  { key: "marketing", icon: "📣", arabic: "تسويق" },
  { key: "sales", icon: "🤝", arabic: "مبيعات" },
  { key: "other", icon: "✨", arabic: "أخرى" },
];

const PREDEFINED_KEYS = PREDEFINED.map((p) => p.key);

export const PROFESSIONS: readonly ProfessionItem[] = PREDEFINED;

export type ProfessionKey = (typeof PREDEFINED)[number]["key"];

export function getProfessionArabic(key: string): string {
  const found = PREDEFINED.find((p) => p.key === key);
  return found?.arabic || key;
}

export function getProfessionIcon(key: string): string {
  const found = PREDEFINED.find((p) => p.key === key);
  return found?.icon || "⭐";
}

export function getAvailableProfessions(customKeys?: string[]): ProfessionItem[] {
  const list = [...PREDEFINED];
  if (customKeys) {
    for (const k of customKeys) {
      if (!PREDEFINED_KEYS.includes(k) && !list.find((p) => p.key === k)) {
        list.push({ key: k, icon: "⭐", arabic: k });
      }
    }
  }
  return list;
}

export function isCustomProfession(key: string): boolean {
  return !PREDEFINED_KEYS.includes(key);
}
