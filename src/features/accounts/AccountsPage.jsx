import { useMemo, useState } from "react";
import { Modal } from "../../components/Modal.jsx";
import {
  ACCOUNT_TIERS, ACCOUNT_TYPES, accountAlerts, accountPriorityScore, accountStats,
  accountTypeInfo, createAccount,
} from "../../lib/accounts.js";
import { scoreColor } from "../../lib/insights.js";
import { useData } from "../../store/dataContext.js";
import { AccountDetail } from "./AccountDetail.jsx";

const EMPTY_FILTERS = { q: "", type: "", tier: "", city: "" };

export function AccountsPage({ setPage }) {
  const {
    accounts, upsertAccount, deleteAccount, generateAccountsFromPortfolio,
    doctors, reports,
  } = useData();

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [flash, setFlash] = useState("");

  const cities = useMemo(
    () => [...new Set(accounts.map(a => a.city).filter(Boolean))].sort(),
    [accounts]
  );

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return accounts
      .filter(a => (!q || a.name.toLowerCase().includes(q) || (a.city || "").toLowerCase().includes(q)))
      .filter(a => (!filters.type || a.type === filters.type))
      .filter(a => (!filters.tier || a.tier === filters.tier))
      .filter(a => (!filters.city || a.city === filters.city))
      .map(a => ({
        account: a,
        stats: accountStats(a, doctors, reports),
        priority: accountPriorityScore(a, doctors, reports),
      }))
      .sort((x, y) => y.priority - x.priority);
  }, [accounts, doctors, reports, filters]);

  const alerts = useMemo(() => accountAlerts(accounts, doctors, reports), [accounts, doctors, reports]);
  const alertsByAccount = useMemo(() => {
    const m = {};
    for (const al of alerts) (m[al.accountId] = m[al.accountId] || []).push(al);
    return m;
  }, [alerts]);

  const kpi = useMemo(() => {
    const total = accounts.length;
    const tierA = accounts.filter(a => a.tier === "A").length;
    const linked = doctors.filter(d => d.accountId).length;
    const champions = rows.reduce((s, r) => s + r.stats.champions, 0);
    return { total, tierA, linked, champions, orphans: doctors.length - linked };
  }, [accounts, doctors, rows]);

  const openAccount = openId ? accounts.find(a => a.id === openId) : null;
  if (openAccount) {
    return <AccountDetail account={openAccount} onBack={() => setOpenId(null)} setPage={setPage} />;
  }

  const runGeneration = () => {
    const { created, linked } = generateAccountsFromPortfolio();
    setFlash(created || linked
      ? `✅ ${created} compte(s) créé(s), ${linked} contact(s) rattaché(s).`
      : "ℹ️ Aucun nouvel établissement détecté dans les secteurs du portefeuille.");
    setTimeout(() => setFlash(""), 6000);
  };

  return (
    <div className="content">
      <div className="fum-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="fum-hero-title">🏥 Comptes clients</div>
            <div className="fum-hero-sub">
              {kpi.total} comptes · {kpi.linked} contacts rattachés · {kpi.orphans} contacts sans compte
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={runGeneration}>🪄 Générer depuis le portefeuille</button>
            <button className="btn btn-p" onClick={() => setEditing(createAccount({ name: "" }))}>＋ Nouveau compte</button>
          </div>
        </div>
      </div>

      {flash && <div className="ok" style={{ marginBottom: 12 }}>{flash}</div>}

      <div className="cd-kpi-grid">
        <div className="kpi" style={{ "--ac": "var(--teal)" }}><div className="kpi-lbl">Comptes</div><div className="kpi-val">{kpi.total}</div><div className="kpi-d">portefeuille</div><div className="kpi-ic">🏥</div></div>
        <div className="kpi" style={{ "--ac": "var(--rose)" }}><div className="kpi-lbl">Comptes A</div><div className="kpi-val">{kpi.tierA}</div><div className="kpi-d">stratégiques</div><div className="kpi-ic">🎯</div></div>
        <div className="kpi" style={{ "--ac": "var(--blue)" }}><div className="kpi-lbl">Champions</div><div className="kpi-val">{kpi.champions}</div><div className="kpi-d">relais internes</div><div className="kpi-ic">🏆</div></div>
        <div className="kpi" style={{ "--ac": "var(--amber)" }}><div className="kpi-lbl">Alertes</div><div className="kpi-val">{alerts.length}</div><div className="kpi-d">à traiter</div><div className="kpi-ic">⚠️</div></div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="pl-toolbar" style={{ marginBottom: 0 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label className="fl">Recherche</label>
            <input className="fi" placeholder="Nom ou ville…" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} />
          </div>
          <div style={{ minWidth: 150 }}>
            <label className="fl">Type</label>
            <select className="fs" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">Tous</option>
              {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.ic} {t.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 110 }}>
            <label className="fl">Niveau</label>
            <select className="fs" value={filters.tier} onChange={e => setFilters(f => ({ ...f, tier: e.target.value }))}>
              <option value="">Tous</option>
              {ACCOUNT_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 130 }}>
            <label className="fl">Ville</label>
            <select className="fs" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}>
              <option value="">Toutes</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button className="btn btn-g" style={{ alignSelf: "flex-end" }} onClick={() => setFilters(EMPTY_FILTERS)}>Réinitialiser</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <div className="empty" style={{ padding: 32 }}>
            Aucun compte. Clique sur <b>🪄 Générer depuis le portefeuille</b> : les cliniques, hôpitaux
            et pharmacies présents dans le champ « Secteur » de tes médecins deviendront des comptes.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Compte</th>
                  <th>Type</th>
                  <th style={{ textAlign: "center" }}>Niveau</th>
                  <th style={{ textAlign: "center" }}>Contacts</th>
                  <th style={{ textAlign: "center" }}>Couverture</th>
                  <th style={{ textAlign: "center" }}>Adoption</th>
                  <th style={{ textAlign: "center" }}>Dernière visite</th>
                  <th style={{ textAlign: "center" }}>Priorité</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ account: a, stats: s, priority }) => {
                  const ti = accountTypeInfo(a.type);
                  const accAlerts = alertsByAccount[a.id] || [];
                  return (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 700, cursor: "pointer" }} onClick={() => setOpenId(a.id)}>{a.name}</div>
                        <div className="mini" style={{ margin: 0, opacity: .75 }}>{a.city || "—"}</div>
                        {accAlerts.length > 0 && (
                          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                            {accAlerts.slice(0, 2).map((al, i) => (
                              <span key={i} className="pill" style={{ fontSize: 9, borderColor: "rgba(245,158,11,.35)", color: "var(--amber)" }}>{al.ic} {al.msg}</span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>{ti.ic} {ti.label}</td>
                      <td style={{ textAlign: "center" }}><span className={`tag t${a.tier}`}>{a.tier}</span></td>
                      <td style={{ textAlign: "center" }}>{s.contacts}</td>
                      <td style={{ textAlign: "center", color: s.coverageRate >= 60 ? "var(--teal)" : "var(--amber)", fontWeight: 700 }}>{s.coverageRate}%</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: scoreColor(s.avgAdoption) }}>{s.avgAdoption ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{s.daysSinceLastVisit == null ? "—" : `il y a ${s.daysSinceLastVisit} j`}</td>
                      <td style={{ textAlign: "center", fontWeight: 800, color: scoreColor(priority) }}>{priority}</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button className="chip-eye" title="Fiche 360°" onClick={() => setOpenId(a.id)}>👁️</button>
                        <button className="chip-eye" title="Éditer" onClick={() => setEditing(a)}>✏️</button>
                        <button className="chip-eye" title="Supprimer" onClick={() => { if (confirm(`Supprimer le compte "${a.name}" ? Les contacts seront détachés.`)) deleteAccount(a.id); }}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <Modal
          title={accounts.some(a => a.id === editing.id) ? "Éditer le compte" : "Nouveau compte"}
          subtitle="Établissement, groupement ou point de vente"
          onClose={() => setEditing(null)}
          actions={[
            { label: "Annuler", kind: "g", onClick: () => setEditing(null) },
            {
              label: "💾 Enregistrer", kind: "p", onClick: () => {
                if (!editing.name?.trim()) return alert("Le nom du compte est requis.");
                upsertAccount(createAccount(editing));
                setEditing(null);
              }
            },
          ]}
        >
          <div className="g2">
            <div className="fg"><label className="fl">Nom</label>
              <input className="fi" value={editing.name} onChange={e => setEditing(p => ({ ...p, name: e.target.value }))} placeholder="Clinique Al Amal" />
            </div>
            <div className="fg"><label className="fl">Type</label>
              <select className="fs" value={editing.type} onChange={e => setEditing(p => ({ ...p, type: e.target.value }))}>
                {ACCOUNT_TYPES.map(t => <option key={t.id} value={t.id}>{t.ic} {t.label}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Ville</label>
              <input className="fi" value={editing.city} onChange={e => setEditing(p => ({ ...p, city: e.target.value }))} placeholder="Rabat" />
            </div>
            <div className="fg"><label className="fl">Niveau (segmentation)</label>
              <select className="fs" value={editing.tier} onChange={e => setEditing(p => ({ ...p, tier: e.target.value }))}>
                {ACCOUNT_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Rattaché à (compte parent)</label>
              <select className="fs" value={editing.parentId || ""} onChange={e => setEditing(p => ({ ...p, parentId: e.target.value || null }))}>
                <option value="">— Aucun —</option>
                {accounts.filter(a => a.id !== editing.id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Téléphone</label>
              <input className="fi" value={editing.phone} onChange={e => setEditing(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="fg" style={{ gridColumn: "1 / -1" }}><label className="fl">Adresse</label>
              <input className="fi" value={editing.address} onChange={e => setEditing(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="fg" style={{ gridColumn: "1 / -1" }}><label className="fl">Objectif sur ce compte</label>
              <textarea className="fta" value={editing.objective} onChange={e => setEditing(p => ({ ...p, objective: e.target.value }))} placeholder="Ex : référencement au formulaire, 5 prescripteurs actifs d'ici décembre…" />
            </div>
            <div className="fg" style={{ gridColumn: "1 / -1" }}><label className="fl">Notes</label>
              <textarea className="fta" value={editing.notes} onChange={e => setEditing(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
