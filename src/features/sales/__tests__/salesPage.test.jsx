/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SalesPage } from "../SalesPage.jsx";
import { DataProvider } from "../../../store/DataProvider.jsx";
import { lastPeriods } from "../../../lib/sales.js";

const P = lastPeriods(1)[0];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("medrep_accounts_v1", JSON.stringify([
    { id: "acc_1", name: "Clinique Agdal", city: "Rabat", tier: "A", type: "clinique" },
  ]));
  localStorage.setItem("medrep_sales_v1", JSON.stringify([
    { id: "s1", period: P, accountId: "acc_1", accountName: "Clinique Agdal", product: "Fumetil", channel: "sell_in", units: 100, revenue: 15000 },
  ]));
  localStorage.setItem("medrep_objectives_v1", JSON.stringify([
    { id: "o1", scope: "global", refId: null, metric: "revenue", period: P, value: 20000 },
  ]));
});

describe("écran Ventes & objectifs", () => {
  it("affiche les KPI, l'objectif et le top comptes", () => {
    const html = renderToStaticMarkup(<DataProvider><SalesPage setPage={() => {}} /></DataProvider>);
    expect(html).toContain("Ventes");
    expect(html).toContain("Clinique Agdal");
    expect(html).toContain("MAD");
    expect(html).toContain("Objectifs");
  });

  it("propose l'import quand aucune vente n'existe", () => {
    localStorage.setItem("medrep_sales_v1", "[]");
    const html = renderToStaticMarkup(<DataProvider><SalesPage setPage={() => {}} /></DataProvider>);
    expect(html).toContain("Importer");
  });
});
