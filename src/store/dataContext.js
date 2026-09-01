import { createContext, useContext } from "react";

/**
 * Contexte de données global : médecins, comptes-rendus, produits, config IA.
 * Évite les lectures directes de localStorage dans les composants
 * (qui provoquaient des désynchronisations d'affichage).
 */
export const DataContext = createContext(null);

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData() doit être utilisé dans <DataProvider>");
  return ctx;
}
