import { useState } from "react";
import { ToastProvider } from "./components/Toast.jsx";
import { AccountsPage } from "./features/accounts/AccountsPage.jsx";
import { Assistant } from "./features/assistant/Assistant.jsx";
import { CommercialDashboard } from "./features/commercial/CommercialDashboard.jsx";
import { Dashboard } from "./features/dashboard/Dashboard.jsx";
import { DoctorsPage } from "./features/doctors/DoctorsPage.jsx";
import { PlanningPage } from "./features/planning/PlanningPage.jsx";
import { FumetilDashboard } from "./features/product/ProductDashboard.jsx";
import { ReportsPage } from "./features/reports/ReportsPage.jsx";
import { SettingsPage } from "./features/settings/SettingsPage.jsx";
import { DataProvider } from "./store/DataProvider.jsx";
import { useData } from "./store/dataContext.js";
import { GS } from "./styles/GlobalStyles.jsx";

const SYNC_LABEL = {
  loading: { txt: "Chargement…", color: "var(--t3)" },
  saving: { txt: "Synchro…", color: "var(--amber)" },
  saved: { txt: "Synchronisé", color: "var(--teal)" },
  error: { txt: "Erreur synchro", color: "var(--rose)" },
  off: { txt: "Local", color: "var(--t3)" },
  idle: { txt: "Local", color: "var(--t3)" },
};

function Shell() {
  const {
    filteredDoctors, setDoctors,
    products, addProduct, deleteProduct, activeProduct, setActiveProduct,
    apiKey, setApiKey, model, setModel, provider, hasApi,
    monthlyTarget, setMonthlyTarget, syncState,
  } = useData();

  const [page, setPageState] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // La navigation ferme le menu mobile (pas d'effet en cascade)
  const setPage = (id) => { setPageState(id); setMobileMenuOpen(false); };

  const NAV = [
    { sec: "Principal", items: [
      { id: "dashboard", ic: "⊞", lbl: "Dashboard" },
      { id: "commercial", ic: "📈", lbl: "Commercial" },
      { id: "fumetil", ic: "📊", lbl: activeProduct, badge: "CRM" },
      { id: "assistant", ic: provider?.icon || "✦", lbl: "Coach IA", needsApi: true },
    ]},
    { sec: "Terrain", items: [
      { id: "accounts", ic: "🏥", lbl: "Comptes", badge: "KAM" },
      { id: "planning", ic: "📅", lbl: "Planning" },
      { id: "reports", ic: "📝", lbl: "Comptes-rendus" },
      { id: "doctors", ic: "👨‍⚕️", lbl: "Médecins" },
    ]},
    { sec: "Compte", items: [
      { id: "settings", ic: "⚙️", lbl: "Paramètres" },
    ]},
  ];

  const TITLES = {
    dashboard: "Vue d'ensemble", commercial: "Commercial", fumetil: `Dashboard ${activeProduct}`,
    assistant: "Coach IA", planning: "Planning", reports: "Comptes-rendus",
    accounts: "Comptes clients", doctors: "Médecins & contacts", settings: "Paramètres",
  };

  const m = model || provider?.defaultModel;
  const render = () => {
    switch (page) {
      case "dashboard": return <Dashboard doctors={filteredDoctors} setPage={setPage} hasApi={hasApi} provider={provider} activeProduct={activeProduct} />;
      case "commercial": return <CommercialDashboard doctors={filteredDoctors} setPage={setPage} apiKey={apiKey} provider={provider} model={m} activeProduct={activeProduct} />;
      case "fumetil": return <FumetilDashboard doctors={filteredDoctors} setPage={setPage} activeProduct={activeProduct} />;
      case "assistant": return <Assistant apiKey={apiKey} provider={provider} model={m} setPage={setPage} doctors={filteredDoctors} />;
      case "accounts": return <AccountsPage setPage={setPage} />;
      case "planning": return <PlanningPage doctors={filteredDoctors} setDoctors={setDoctors} apiKey={apiKey} provider={provider} model={m} />;
      case "reports": return <ReportsPage doctors={filteredDoctors} setDoctors={setDoctors} apiKey={apiKey} provider={provider} model={m} setPage={setPage} />;
      case "doctors": return <DoctorsPage doctors={filteredDoctors} setDoctors={setDoctors} activeProduct={activeProduct} products={products} />;
      case "settings": return (
        <SettingsPage
          apiKey={apiKey} setApiKey={setApiKey} model={m} setModel={setModel}
          products={products} addProduct={addProduct} deleteProduct={deleteProduct}
          activeProduct={activeProduct}
          monthlyTarget={monthlyTarget} setMonthlyTarget={setMonthlyTarget}
        />
      );
      default: return null;
    }
  };

  const sync = SYNC_LABEL[syncState] || SYNC_LABEL.idle;

  return (
    <>
      <GS />
      <div className="root">
        <div className="bg" />
        <aside className={`sb ${mobileMenuOpen ? "open" : ""}`}>
          <div className="sb-logo">
            <div className="logo-ic">🧠</div>
            <div><div className="logo-t">MedRep AI</div><div className="logo-s">{sync.txt}</div></div>
            {mobileMenuOpen && <button className="btn btn-g" style={{ marginLeft: "auto" }} onClick={() => setMobileMenuOpen(false)}>✕</button>}
          </div>

          <div style={{ padding: "10px 10px 0" }}>
            <label className="fl">Produit</label>
            <select className="fs" value={activeProduct} onChange={e => setActiveProduct(e.target.value)}>
              {products.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <nav className="sb-nav">
            {NAV.map(s => (
              <div key={s.sec} className="nav-sec">
                <div className="nav-lbl">{s.sec}</div>
                {s.items.map(it => (
                  <div key={it.id} className={`nav-it${page === it.id ? " on" : ""}`} onClick={() => setPage(it.id)}>
                    <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{it.ic}</span> {it.lbl}
                    {it.badge && <span className="nav-badge ok">{it.badge}</span>}
                    {it.needsApi && (hasApi ? <span className="nav-badge ok">ON</span> : <span className="nav-badge">OFF</span>)}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        {mobileMenuOpen && <div className="ov" style={{ zIndex: 90, background: "rgba(0,0,0,0.5)" }} onClick={() => setMobileMenuOpen(false)} />}

        <main className="main">
          <div className="topbar">
            <button className="hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Menu">☰</button>
            <div className="tb-title">{TITLES[page]}</div>
            <span className="pill no-print" title="État de la sauvegarde" style={{ borderColor: sync.color, color: sync.color }}>● {sync.txt}</span>
            {!hasApi && <button className="btn btn-blue no-print" style={{ fontSize: 11 }} onClick={() => setPage("settings")}>🔑 API</button>}
            {hasApi && <button className="btn btn-g no-print" style={{ fontSize: 11 }} onClick={() => setPage("assistant")}>Coach</button>}
          </div>
          {render()}
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </DataProvider>
  );
}
