import { describe, expect, it } from "vitest";
import { generatePlanning, pickEvenly } from "../planningEngine.js";
import { listWorkdays } from "../../../lib/dates.js";

const makeDoctors = (n, over = {}) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1, name: `Dr. ${i + 1}`, city: "Rabat", sector: "",
    potential: i % 3 === 0 ? "A" : "B", ...over,
  }));

describe("pickEvenly", () => {
  it("répartit sans doublon", () => {
    const days = ["a", "b", "c", "d", "e", "f"];
    const picked = pickEvenly(days, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });
  it("gère les cas limites", () => {
    expect(pickEvenly(["a", "b"], 0)).toEqual([]);
    expect(pickEvenly(["a", "b"], 9)).toEqual(["a", "b"]);
  });
});

describe("generatePlanning", () => {
  const base = { year: 2026, monthIndex: 8, perDay: 6, directives: [], allReports: {} };

  it("ne planifie que des jours ouvrés", () => {
    const { plan } = generatePlanning({ ...base, doctors: makeDoctors(20) });
    expect(Object.keys(plan).sort()).toEqual(listWorkdays(2026, 8).sort());
  });

  it("ne dépasse jamais le quota de visites par jour", () => {
    const { plan } = generatePlanning({ ...base, doctors: makeDoctors(200) });
    for (const day of Object.keys(plan)) expect(plan[day].length).toBeLessThanOrEqual(base.perDay);
  });

  it("ne planifie jamais deux fois le même médecin le même jour", () => {
    const { plan } = generatePlanning({ ...base, doctors: makeDoctors(60) });
    for (const day of Object.keys(plan)) expect(new Set(plan[day]).size).toBe(plan[day].length);
  });

  it("place les villes cluster uniquement le mercredi ou le jeudi", () => {
    const doctors = makeDoctors(30, { city: "Kénitra" });
    const { plan } = generatePlanning({ ...base, doctors });
    for (const [day, ids] of Object.entries(plan)) {
      if (!ids.length) continue;
      const wd = new Date(day).getDay();
      expect([3, 4]).toContain(wd);
    }
  });

  it("respecte une directive de jour sur une ville hors cluster", () => {
    const doctors = makeDoctors(12, { city: "Casablanca" });
    const directives = [{
      id: "d1", name: "Casa lundi", isActive: true, days: [1], priority: 9, maxVisits: "",
      cities: ["Casablanca"], specialties: [], products: [], potentials: [], excludeIds: [], week: 0,
    }];
    const { plan } = generatePlanning({ ...base, doctors, directives });
    const mondayVisits = Object.entries(plan)
      .filter(([day]) => new Date(day).getDay() === 1)
      .reduce((s, [, ids]) => s + ids.length, 0);
    expect(mondayVisits).toBeGreaterThan(0);
  });

  it("fait primer la contrainte cluster (Mer/Jeu) sur une directive contradictoire", () => {
    const doctors = makeDoctors(12, { city: "Rabat" });
    const directives = [{
      id: "d2", name: "Rabat lundi", isActive: true, days: [1], priority: 9, maxVisits: "",
      cities: ["Rabat"], specialties: [], products: [], potentials: [], excludeIds: [], week: 0,
    }];
    const { plan } = generatePlanning({ ...base, doctors, directives });
    for (const [day, ids] of Object.entries(plan)) {
      if (ids.length) expect([3, 4]).toContain(new Date(day).getDay());
    }
  });

  it("renvoie un backlog cohérent (médecins non planifiés)", () => {
    const doctors = makeDoctors(500);
    const { plan, backlog } = generatePlanning({ ...base, doctors });
    const scheduled = new Set(Object.values(plan).flat());
    expect(backlog.every(id => !scheduled.has(id))).toBe(true);
  });
});
