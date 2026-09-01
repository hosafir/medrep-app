/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import {
  accountSalesSummary, buildSalesHeaderMap, createObjective, elapsedRatioForPeriod,
  filterSales, groupBy, growth, lastPeriods, linkSalesToAccounts, normalizeChannel,
  normalizeSaleRow, objectiveCoversPeriod, objectiveProgress, parseNumber, parsePeriod,
  periodLabel, samePeriodLastYear, seriesByPeriod, sumSales,
} from "../sales.js";

const S = (period, accountId, product, revenue, units = 0, channel = "sell_in") =>
  ({ id: `${period}-${accountId}-${product}`, period, accountId, accountName: accountId, product, revenue, units, channel });

const SALES = [
  S("2026-07", "acc_1", "Fumetil", 10000, 100),
  S("2026-08", "acc_1", "Fumetil", 15000, 150),
  S("2026-08", "acc_2", "Fumetil", 5000, 50),
  S("2026-08", "acc_1", "Nexil", 3000, 20, "sell_out"),
  S("2025-08", "acc_1", "Fumetil", 12000, 120),
];

describe("périodes", () => {
  it("comprend les formats de date usuels", () => {
    expect(parsePeriod("2026-08")).toBe("2026-08");
    expect(parsePeriod("08/2026")).toBe("2026-08");
    expect(parsePeriod("05/08/2026")).toBe("2026-08");
    expect(parsePeriod("2026-08-05")).toBe("2026-08");
    expect(parsePeriod("Août 2026")).toBe("2026-08");
    expect(parsePeriod(new Date(2026, 7, 5))).toBe("2026-08");
    expect(parsePeriod("n'importe quoi")).toBeNull();
    expect(parsePeriod("")).toBeNull();
    expect(parsePeriod("2026-13")).toBeNull();
  });

  it("formate et décale les périodes", () => {
    expect(periodLabel("2026-08")).toBe("Aoû 2026");
    expect(samePeriodLastYear("2026-08")).toBe("2025-08");
    const p = lastPeriods(3, new Date(2026, 7, 15));
    expect(p).toEqual(["2026-06", "2026-07", "2026-08"]);
  });
});

describe("nombres", () => {
  it("parse les formats français et anglo-saxons", () => {
    expect(parseNumber("1 234,50")).toBeCloseTo(1234.5);
    expect(parseNumber("1,234.50")).toBeCloseTo(1234.5);
    expect(parseNumber("12 000 MAD")).toBe(12000);
    expect(parseNumber(4200)).toBe(4200);
    expect(parseNumber("")).toBe(0);
    expect(parseNumber("abc")).toBe(0);
  });
});

describe("import de ventes", () => {
  const headers = ["Mois", "Client", "Produit", "Quantité", "CA", "Canal"];

  it("reconnaît les colonnes", () => {
    const hm = buildSalesHeaderMap(headers);
    expect(hm.period).toBe(0);
    expect(hm.account).toBe(1);
    expect(hm.units).toBe(3);
    expect(hm.revenue).toBe(4);
  });

  it("normalise une ligne", () => {
    const hm = buildSalesHeaderMap(headers);
    const row = ["08/2026", "Clinique Agdal", "Fumetil", "150", "15 000", "sell-out"];
    const sale = normalizeSaleRow(row, hm, 1);
    expect(sale.period).toBe("2026-08");
    expect(sale.revenue).toBe(15000);
    expect(sale.units).toBe(150);
    expect(sale.channel).toBe("sell_out");
  });

  it("ignore les lignes sans période ou sans montant", () => {
    const hm = buildSalesHeaderMap(headers);
    expect(normalizeSaleRow(["", "X", "Y", "1", "1"], hm, 1)).toBeNull();
    expect(normalizeSaleRow(["08/2026", "X", "Y", "0", "0"], hm, 2)).toBeNull();
  });

  it("détecte le canal", () => {
    expect(normalizeChannel("Sell Out")).toBe("sell_out");
    expect(normalizeChannel("sorties patients")).toBe("sell_out");
    expect(normalizeChannel("")).toBe("sell_in");
  });

  it("rattache les ventes aux comptes par nom", () => {
    const raw = [{ accountName: "Clinique  AGDAL", accountId: null }];
    const linked = linkSalesToAccounts(raw, [{ id: "acc_1", name: "Clinique Agdal" }]);
    expect(linked[0].accountId).toBe("acc_1");
  });
});

describe("agrégats", () => {
  it("filtre et somme", () => {
    expect(sumSales(filterSales(SALES, { period: "2026-08" }))).toBe(23000);
    expect(sumSales(filterSales(SALES, { accountId: "acc_1", product: "Fumetil" }))).toBe(37000);
    expect(sumSales(filterSales(SALES, { channel: "sell_out" }))).toBe(3000);
    expect(sumSales(filterSales(SALES, { period: "2026-08" }), "units")).toBe(220);
  });

  it("construit une série temporelle", () => {
    const serie = seriesByPeriod(SALES, ["2026-07", "2026-08"]);
    expect(serie.map(s => s.value)).toEqual([10000, 23000]);
  });

  it("regroupe et classe", () => {
    const g = groupBy(filterSales(SALES, { period: "2026-08" }), "accountId");
    expect(g[0]).toEqual({ key: "acc_1", value: 18000 });
    expect(groupBy(SALES, "product")[0].key).toBe("Fumetil");
  });

  it("calcule la croissance", () => {
    expect(growth(15000, 12000)).toBe(25);
    expect(growth(0, 100)).toBe(-100);
    expect(growth(100, 0)).toBeNull();
    expect(growth(0, 0)).toBe(0);
  });

  it("résume un compte avec comparaison N-1", () => {
    const s = accountSalesSummary("acc_1", SALES, ["2026-08"]);
    expect(s.value).toBe(18000);
    expect(s.previous).toBe(12000);
    expect(s.growth).toBe(50);
    expect(s.share).toBe(78.3);
  });
});

describe("objectifs", () => {
  it("couvre les périodes mensuelles et annuelles", () => {
    expect(objectiveCoversPeriod(createObjective({ period: "2026-08" }), "2026-08")).toBe(true);
    expect(objectiveCoversPeriod(createObjective({ period: "2026" }), "2026-03")).toBe(true);
    expect(objectiveCoversPeriod(createObjective({ period: "2026" }), "2025-03")).toBe(false);
  });

  it("mesure l'avancement et projette la fin de période", () => {
    const obj = createObjective({ scope: "global", metric: "revenue", period: "2026-08", value: "40 000" });
    const p = objectiveProgress(obj, SALES, { elapsedRatio: 0.5 });
    expect(p.target).toBe(40000);
    expect(p.actual).toBe(23000);
    expect(p.rate).toBe(57.5);
    expect(p.onTrack).toBe(true);      // 23 000 > 20 000 attendus à mi-parcours
    expect(p.projection).toBe(46000);
    expect(p.projectedRate).toBe(115);
  });

  it("cible un compte précis", () => {
    const obj = createObjective({ scope: "account", refId: "acc_2", period: "2026-08", value: 10000 });
    expect(objectiveProgress(obj, SALES).actual).toBe(5000);
  });

  it("cible un produit précis", () => {
    const obj = createObjective({ scope: "product", refId: "Nexil", period: "2026-08", value: 5000, metric: "units" });
    expect(objectiveProgress(obj, SALES).actual).toBe(20);
  });

  it("calcule la part de période écoulée", () => {
    expect(elapsedRatioForPeriod("2026-08", new Date(2026, 7, 16, 12))).toBeCloseTo(0.5, 1);
    expect(elapsedRatioForPeriod("2026-08", new Date(2027, 0, 1))).toBe(1);
    expect(elapsedRatioForPeriod("2026", new Date(2025, 0, 1))).toBe(0);
    expect(elapsedRatioForPeriod("")).toBe(1);
  });
});

describe("import de fichier CSV complet", () => {
  it("lit un CSV et rattache les comptes", async () => {
    const { importSalesFromFile } = await import("../sales.js");
    const csv = [
      "Mois,Client,Produit,Quantite,CA,Canal",
      "08/2026,Clinique Agdal,Fumetil,150,15 000,sell_in",
      "08/2026,Inconnu SARL,Fumetil,10,1 000,sell_out",
      "ligne,invalide,,,,",
    ].join("\n");
    const file = new File([csv], "ventes.csv", { type: "text/csv" });
    const rows = await importSalesFromFile(file, { accounts: [{ id: "acc_1", name: "Clinique Agdal" }] });
    expect(rows).toHaveLength(2);
    expect(rows[0].accountId).toBe("acc_1");
    expect(rows[1].accountId).toBeNull();
    expect(rows[0].revenue).toBe(15000);
  });

  it("rejette un format non supporté", async () => {
    const { importSalesFromFile } = await import("../sales.js");
    await expect(importSalesFromFile(new File(["x"], "ventes.pdf"))).rejects.toThrow(/non supporté/i);
  });
});
