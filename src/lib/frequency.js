/* ─── Visit Frequency Logic ─── */
export const FREQ_MAP = {
  "weekly": { label: "Hebdomadaire", days: 7 },
  "biweekly": { label: "Bimensuelle", days: 14 },
  "monthly": { label: "Mensuelle", days: 30 },
  "quarterly": { label: "Trimestrielle", days: 90 },
  "biannual": { label: "Semestrielle", days: 180 },
  "yearly": { label: "Annuelle", days: 365 }
};
export function getDefaultFrequency(potential) {
  if (potential === "A") return "monthly";
  if (potential === "B") return "quarterly";
  return "yearly";
}
export function getFrequencyDays(freqKey) {
  return FREQ_MAP[freqKey]?.days || 90;
}
