/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountsPage } from "../AccountsPage.jsx";
import { AccountDetail } from "../AccountDetail.jsx";
import { DataProvider } from "../../../store/DataProvider.jsx";
import { createAccount } from "../../../lib/accounts.js";

const ACCOUNT = createAccount({ id: "acc_1", name: "Clinique Agdal", city: "Rabat", tier: "A", type: "clinique" });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("medrep_accounts_v1", JSON.stringify([ACCOUNT]));
  localStorage.setItem("medrep_doctors_v1", JSON.stringify([
    { id: 1, name: "Dr. Alaoui", city: "Rabat", sector: "Clinique Agdal", potential: "A", product: "Fumetil", accountId: "acc_1", influence: 5, support: 4, adoptionScore: 70 },
    { id: 2, name: "Dr. Bennis", city: "Rabat", sector: "", potential: "B", product: "Fumetil" },
  ]));
});

describe("écrans Comptes", () => {
  it("affiche la liste des comptes avec ses indicateurs", () => {
    const html = renderToStaticMarkup(<DataProvider><AccountsPage setPage={() => {}} /></DataProvider>);
    expect(html).toContain("Clinique Agdal");
    expect(html).toContain("Comptes clients");
    expect(html).toContain("Champions");
  });

  it("affiche la fiche 360 d'un compte", () => {
    const html = renderToStaticMarkup(
      <DataProvider><AccountDetail account={ACCOUNT} onBack={() => {}} setPage={() => {}} /></DataProvider>
    );
    expect(html).toContain("Clinique Agdal");
    expect(html).toContain("Couverture");
    expect(html).toContain("Cartographie");
  });
});
