import { describe, expect, it } from "vitest";
import {
  computePredictiveScore, detectOpportunities, extractAdoptionInsights,
  probaLabel, scoreColor,
} from "../insights.js";
import { getDefaultFrequency, getFrequencyDays } from "../frequency.js";

const AI_TEXT = `## Score
- Score : 72/100
- Priorité : haute
Frein principal : prix jugé élevé
## Objectif next visit
- Obtenir 3 essais patients
`;

describe("extraction des insights IA", () => {
  it("extrait score, priorité, frein et objectif", () => {
    const r = extractAdoptionInsights(AI_TEXT);
    expect(r.adoptionScore).toBe(72);
    expect(r.priorityLevel).toBe("haute");
    expect(r.mainObjection).toContain("prix");
    expect(r.nextVisitGoal).toContain("essais");
  });

  it("renvoie des valeurs neutres sur un texte vide", () => {
    const r = extractAdoptionInsights("");
    expect(r.adoptionScore).toBeNull();
    expect(r.mainObjection).toBe("");
  });

  it("borne le score entre 0 et 100", () => {
    expect(extractAdoptionInsights("Score : 480/100").adoptionScore).toBe(100);
  });
});

describe("score prédictif", () => {
  it("valorise un potentiel A visité récemment", () => {
    const now = new Date().toISOString();
    const a = computePredictiveScore({ id: 1, potential: "A" }, { 1: [{ createdAt: now }, { createdAt: now }] });
    const c = computePredictiveScore({ id: 2, potential: "C" }, { 2: [] });
    expect(a).toBeGreaterThan(c);
    expect(a).toBeLessThanOrEqual(100);
  });

  it("pénalise un frein non levé", () => {
    const sans = computePredictiveScore({ id: 1, potential: "A" }, {});
    const avec = computePredictiveScore({ id: 1, potential: "A", mainObjection: "prix" }, {});
    expect(avec).toBeLessThan(sans);
  });
});

describe("opportunités", () => {
  it("signale un potentiel A jamais visité", () => {
    const opps = detectOpportunities([{ id: 9, name: "Dr. X", potential: "A", city: "Rabat" }], {});
    expect(opps.some(o => o.type === "warn")).toBe(true);
  });
});

describe("helpers d'affichage", () => {
  it("qualifie la probabilité", () => {
    expect(probaLabel("élevée").cls).toBe("high");
    expect(probaLabel("faible").cls).toBe("low");
    expect(probaLabel("")).toBeNull();
  });
  it("colorise les scores", () => {
    expect(scoreColor(null)).toContain("--t2");
    expect(scoreColor(90)).toContain("--teal");
  });
});

describe("fréquences de visite", () => {
  it("déduit la fréquence par défaut du potentiel", () => {
    expect(getFrequencyDays(getDefaultFrequency("A"))).toBeLessThan(getFrequencyDays(getDefaultFrequency("C")));
  });
});
