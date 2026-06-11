export const PROFESSIONS = [
  { key: "programmer", icon: "💻" },
  { key: "accountant", icon: "📊" },
  { key: "doctor", icon: "🩺" },
  { key: "engineer", icon: "⚙️" },
  { key: "teacher", icon: "📚" },
  { key: "designer", icon: "🎨" },
  { key: "lawyer", icon: "⚖️" },
  { key: "nurse", icon: "💉" },
  { key: "chef", icon: "👨‍🍳" },
  { key: "electrician", icon: "🔌" },
  { key: "plumber", icon: "🔧" },
  { key: "driver", icon: "🚗" },
  { key: "marketing", icon: "📣" },
  { key: "sales", icon: "🤝" },
  { key: "other", icon: "✨" },
] as const;

export type ProfessionKey = (typeof PROFESSIONS)[number]["key"];
