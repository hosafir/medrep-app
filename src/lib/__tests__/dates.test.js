import { describe, expect, it } from "vitest";
import { groupWorkdaysByWeek, isWedThu, isWeekday, listWorkdays, monthKey, ymd } from "../dates.js";

describe("dates", () => {
  it("liste uniquement les jours ouvrés du mois", () => {
    const days = listWorkdays(2026, 0); // janvier 2026
    expect(days.every(d => isWeekday(d))).toBe(true);
    expect(days[0]).toBe("2026-01-01");
    expect(days).toHaveLength(22);
  });

  it("formate correctement les clés", () => {
    expect(monthKey(2026, 8)).toBe("2026-09");
    expect(ymd(new Date(2026, 8, 5))).toBe("2026-09-05");
  });

  it("identifie mercredi et jeudi (jours cluster)", () => {
    expect(isWedThu("2026-09-02")).toBe(true);  // mercredi
    expect(isWedThu("2026-09-04")).toBe(false); // vendredi
  });

  it("regroupe les jours ouvrés par semaine", () => {
    const weeks = groupWorkdaysByWeek(listWorkdays(2026, 0));
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    expect(weeks.flat()).toHaveLength(22);
  });
});
