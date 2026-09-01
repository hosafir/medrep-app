import { describe, expect, it } from "vitest";
import {
  accountAlerts, accountPriorityScore, accountStats, contactsOfAccount, createAccount,
  deriveAccountsFromContacts, guessAccountType, looksLikeEstablishment, stakeholderQuadrant,
} from "../accounts.js";

const DAY = 86400000;
const NOW = new Date("2026-09-01T10:00:00Z").getTime();
const iso = daysAgo => new Date(NOW - daysAgo * DAY).toISOString();

describe("création de comptes", () => {
  it("normalise les champs et applique les valeurs par défaut", () => {
    const a = createAccount({ name: "  Clinique   Marjane ", city: "casa" });
    expect(a.name).toBe("Clinique Marjane");
    expect(a.city).toBe("Casablanca");
    expect(a.tier).toBe("B");
    expect(a.id).toContain("acc_");
  });

  it("devine le type d'établissement", () => {
    expect(guessAccountType("Polyclinique Al Amal")).toBe("clinique");
    expect(guessAccountType("CHU Ibn Sina")).toBe("hopital");
    expect(guessAccountType("Pharmacie Centrale")).toBe("pharmacie");
    expect(guessAccountType("Dr Untel")).toBe("cabinet");
  });

  it("reconnaît un secteur qui est un établissement", () => {
    expect(looksLikeEstablishment("Clinique Agdal")).toBe(true);
    expect(looksLikeEstablishment("Hay Riad")).toBe(false);
    expect(looksLikeEstablishment("")).toBe(false);
  });
});

describe("dérivation depuis le portefeuille", () => {
  const contacts = [
    { id: 1, name: "Dr A", city: "Rabat", sector: "Clinique Agdal" },
    { id: 2, name: "Dr B", city: "Rabat", sector: "Clinique Agdal" },
    { id: 3, name: "Dr C", city: "Rabat", sector: "Hay Riad" },
  ];

  it("crée un compte par établissement et rattache les contacts", () => {
    const { accounts, links } = deriveAccountsFromContacts(contacts);
    expect(accounts).toHaveLength(1);
    expect(links[1]).toBe(accounts[0].id);
    expect(links[2]).toBe(accounts[0].id);
    expect(links[3]).toBeUndefined(); // simple quartier, pas un établissement
  });

  it("est idempotente : pas de doublon au second passage", () => {
    const first = deriveAccountsFromContacts(contacts);
    const second = deriveAccountsFromContacts(contacts, first.accounts);
    expect(second.accounts).toHaveLength(1);
  });
});

describe("matrice influence × soutien", () => {
  it("classe les parties prenantes", () => {
    expect(stakeholderQuadrant({ influence: 5, support: 5 }).id).toBe("champion");
    expect(stakeholderQuadrant({ influence: 5, support: 1 }).id).toBe("bloqueur");
    expect(stakeholderQuadrant({ influence: 1, support: 5 }).id).toBe("soutien");
    expect(stakeholderQuadrant({ influence: 1, support: 1 }).id).toBe("peripherique");
    expect(stakeholderQuadrant({ influence: 3, support: 3 }).id).toBe("aconvaincre");
    expect(stakeholderQuadrant({}).id).toBe("unknown");
  });
});

describe("statistiques de compte", () => {
  const account = createAccount({ id: "acc_1", name: "Clinique X", city: "Rabat", tier: "A" });
  const contacts = [
    { id: 1, accountId: "acc_1", adoptionScore: 80, influence: 5, support: 5 },
    { id: 2, accountId: "acc_1", adoptionScore: 40, influence: 5, support: 1 },
    { id: 3, accountId: "acc_1" },
    { id: 4, accountId: "acc_2" },
  ];
  const reports = { 1: [{ createdAt: iso(10) }, { createdAt: iso(200) }], 2: [{ createdAt: iso(30) }] };

  it("ne compte que les contacts du compte", () => {
    expect(contactsOfAccount("acc_1", contacts)).toHaveLength(3);
  });

  it("calcule couverture, adoption moyenne et activité", () => {
    const s = accountStats(account, contacts, reports, NOW);
    expect(s.contacts).toBe(3);
    expect(s.covered).toBe(2);
    expect(s.coverageRate).toBe(67);
    expect(s.avgAdoption).toBe(60);
    expect(s.totalVisits).toBe(3);
    expect(s.visits90).toBe(2);
    expect(s.daysSinceLastVisit).toBe(10);
    expect(s.champions).toBe(1);
    expect(s.blockers).toBe(1);
  });

  it("gère un compte vide", () => {
    const s = accountStats(createAccount({ id: "vide", name: "V" }), contacts, reports, NOW);
    expect(s.contacts).toBe(0);
    expect(s.avgAdoption).toBeNull();
    expect(s.daysSinceLastVisit).toBeNull();
  });

  it("priorise les comptes A avec champions", () => {
    const big = accountPriorityScore(account, contacts, reports, NOW);
    const small = accountPriorityScore(createAccount({ id: "acc_2", name: "P", tier: "C" }), contacts, reports, NOW);
    expect(big).toBeGreaterThan(small);
    expect(big).toBeLessThanOrEqual(100);
  });
});

describe("alertes compte", () => {
  it("remonte opposants, couverture faible et comptes A dormants", () => {
    const account = createAccount({ id: "acc_1", name: "Clinique X", tier: "A" });
    const contacts = [
      { id: 1, accountId: "acc_1", influence: 5, support: 1 },
      { id: 2, accountId: "acc_1" },
      { id: 3, accountId: "acc_1" },
    ];
    const alerts = accountAlerts([account], contacts, { 1: [{ createdAt: iso(120) }] }, NOW);
    const msgs = alerts.map(a => a.msg).join(" | ");
    expect(msgs).toContain("opposant");
    expect(msgs).toContain("Couverture");
    expect(msgs).toContain("sans visite");
  });

  it("signale un compte sans contact", () => {
    const alerts = accountAlerts([createAccount({ id: "x", name: "Y" })], [], {}, NOW);
    expect(alerts[0].msg).toContain("Aucun contact");
  });
});
