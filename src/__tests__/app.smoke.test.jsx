/**
 * @vitest-environment jsdom
 * Test de fumée : l'application se rend sans planter (imports, contexte, pages).
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import App from "../App.jsx";

describe("App", () => {
  it("se rend sans erreur avec les données par défaut", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("MedRep AI");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Planning");
  });
});
