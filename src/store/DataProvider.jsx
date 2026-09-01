import { useCallback, useEffect, useMemo, useState } from "react";
import { DataContext } from "./dataContext.js";
import { detectProvider } from "../lib/ai.js";
import { loadCloudData, saveCloudData } from "../lib/cloud.js";
import { DOCS_FALLBACK } from "../lib/fallbackDoctors.js";
import { stableSortDocs } from "../lib/normalize.js";
import { loadJSON, saveJSON } from "../lib/storage.js";

const enrich = d => ({
  ...d,
  adoptionScore: d?.adoptionScore ?? null,
  mainObjection: d?.mainObjection ?? "",
  nextVisitGoal: d?.nextVisitGoal ?? "",
  priorityLevel: d?.priorityLevel ?? "",
});

export function DataProvider({ children }) {
  const [doctors, setDoctors] = useState(() => {
    const saved = loadJSON("medrep_doctors_v1", null);
    if (Array.isArray(saved) && saved.length) return stableSortDocs(saved.map(enrich));
    return stableSortDocs(DOCS_FALLBACK.map(enrich));
  });

  // Source de vérité unique des comptes-rendus (plus de loadJSON dispersés)
  const [reports, setReports] = useState(() => loadJSON("medrep_reports_v1", {}));
  const [products, setProducts] = useState(() => loadJSON("medrep_products", ["Fumetil"]));
  const [activeProduct, setActiveProduct] = useState(() => loadJSON("medrep_active_product", "Fumetil"));
  const [monthlyTarget, setMonthlyTarget] = useState(() => loadJSON("medrep_monthly_target", 60));

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("medrep_apiKey") || "");
  const [model, setModel] = useState(() => localStorage.getItem("medrep_model") || "");
  const provider = useMemo(() => detectProvider(apiKey), [apiKey]);

  const [syncState, setSyncState] = useState("idle"); // idle | loading | saving | saved | error | off
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // --- Chargement cloud (optionnel, seulement si configuré) ---
  useEffect(() => {
    let alive = true;
    (async () => {
      setSyncState("loading");
      const cloudData = await loadCloudData();
      if (!alive) return;
      if (cloudData) {
        if (cloudData.doctors) setDoctors(stableSortDocs(cloudData.doctors.map(enrich)));
        if (cloudData.products) setProducts(cloudData.products);
        if (cloudData.activeProduct) setActiveProduct(cloudData.activeProduct);
        setSyncState("saved");
      } else {
        setSyncState("off");
      }
      setCloudLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  // --- Persistance locale ---
  useEffect(() => { saveJSON("medrep_doctors_v1", doctors); }, [doctors]);
  useEffect(() => { saveJSON("medrep_reports_v1", reports); }, [reports]);
  useEffect(() => { saveJSON("medrep_products", products); }, [products]);
  useEffect(() => { saveJSON("medrep_active_product", activeProduct); }, [activeProduct]);
  useEffect(() => { saveJSON("medrep_monthly_target", monthlyTarget); }, [monthlyTarget]);
  useEffect(() => { localStorage.setItem("medrep_apiKey", apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem("medrep_model", model); }, [model]);

  // --- Sauvegarde cloud (debounce) ---
  useEffect(() => {
    if (!cloudLoaded) return;
    const timer = setTimeout(async () => {
      const ok = await saveCloudData({ doctors, products, activeProduct, lastSaved: new Date().toISOString() });
      setSyncState(ok === false ? "error" : "saved");
    }, 3000);
    return () => clearTimeout(timer);
  }, [doctors, products, activeProduct, cloudLoaded]);

  const addProduct = useCallback((name) => {
    const clean = (name || "").trim();
    if (!clean) return;
    setProducts(prev => (prev.includes(clean) ? prev : [...prev, clean]));
    setActiveProduct(clean);
  }, []);

  const deleteProduct = useCallback((name) => {
    setProducts(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(p => p !== name);
      setDoctors(docs => docs.filter(d => (d.product || prev[0]) !== name));
      setActiveProduct(cur => (cur === name ? next[0] : cur));
      return next;
    });
  }, []);

  const filteredDoctors = useMemo(
    () => doctors.filter(d => (d.product || "Fumetil") === activeProduct),
    [doctors, activeProduct]
  );

  const value = useMemo(() => ({
    doctors, setDoctors, filteredDoctors,
    reports, setReports,
    products, addProduct, deleteProduct,
    activeProduct, setActiveProduct,
    monthlyTarget, setMonthlyTarget,
    apiKey, setApiKey, model, setModel, provider,
    hasApi: !!apiKey.trim(),
    syncState,
  }), [doctors, filteredDoctors, reports, products, addProduct, deleteProduct, activeProduct,
       monthlyTarget, apiKey, model, provider, syncState]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
