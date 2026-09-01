import { describe, expect, it } from "vitest";
import {
  buildHeaderMap, clamp, findColumnIndex, normalizeCity, normalizeKey,
  normalizePotential, normalizeText, potRank, stableSortDocs,
} from "../normalize.js";
import { dedupeDoctors, normalizeDoctorRow, parseCSVSmart } from "../importDoctors.js";

describe("normalisation", () => {
  it("nettoie les accents et espaces", () => {
    expect(normalizeText("  Dr.   Amine   ")).toBe("Dr. Amine");
    expect(normalizeKey("Kénitra ")).toBe("kenitra");
  });

  it("mappe les alias de villes marocaines", () => {
    expect(normalizeCity("casa")).toBe("Casablanca");
    expect(normalizeCity("SKHIRAT")).toBe("Temara");
    expect(normalizeCity("sale")).toBe("Salé");
    expect(normalizeCity("")).toBe("");
  });

  it("normalise le potentiel", () => {
    expect(normalizePotential("a+")).toBe("A");
    expect(normalizePotential("classe c")).toBe("C");
    expect(normalizePotential("")).toBe("B");
    expect(normalizePotential("inconnu")).toBe("B");
  });

  it("classe et trie les médecins de façon stable", () => {
    expect(potRank("A")).toBeLessThan(potRank("B"));
    const sorted = stableSortDocs([
      { name: "B", city: "Rabat", sector: "", potential: "C" },
      { name: "A", city: "Rabat", sector: "", potential: "A" },
    ]);
    expect(sorted[0].potential).toBe("A");
  });

  it("borne les valeurs", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
  });
});

describe("import de fichiers", () => {
  it("retrouve les colonnes malgré les libellés variables", () => {
    const headers = ["Nom du médecin", "Ville", "Potentiel", "GSM"];
    expect(findColumnIndex(headers, ["name", "nom", "medecin"])).toBe(0);
    const hm = buildHeaderMap(headers);
    expect(hm.city).toBe(1);
    expect(hm.potential).toBe(2);
    expect(hm.phone).toBe(3);
  });

  it("parse un CSV avec guillemets et virgules internes", () => {
    const rows = parseCSVSmart('nom,ville\n"Dr. A, Junior",Rabat\nDr. B,Salé\n');
    expect(rows).toHaveLength(3);
    expect(rows[1][0]).toBe("Dr. A, Junior");
  });

  it("normalise une ligne en médecin", () => {
    const hm = buildHeaderMap(["nom", "ville", "potentiel"]);
    const d = normalizeDoctorRow(["Dr. Alaoui", "casa", "a"], hm, 1);
    expect(d.name).toBe("Dr. Alaoui");
    expect(d.city).toBe("Casablanca");
    expect(d.potential).toBe("A");
  });

  it("dédoublonne sur nom + ville + secteur en fusionnant les champs", () => {
    const out = dedupeDoctors([
      { id: 1, name: "Dr. A", city: "Rabat", sector: "", phone: "" },
      { id: 2, name: "Dr. A", city: "Rabat", sector: "", phone: "0600" },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].phone).toBe("0600");
  });
});
