import { useMemo, useRef, useState } from "react";
import { AnimBar } from "../../components/Charts.jsx";
import { Modal } from "../../components/Modal.jsx";
import { accountTypeInfo } from "../../lib/accounts.js";
import {
  CHANNELS, METRICS, OBJECTIVE_SCOPES, createObjective, elapsedRatioForPeriod,
  filterSales, formatMAD, groupBy, growth, importSalesFromFile, lastPeriods,
  objectiveProgress, periodLabel, samePeriodLastYear, seriesByPeriod, sumSales,
} from "../../lib/sales.js";
import { useData } from "../../store/dataContext.js";

const fmt = (v, metric) => (metric === "units" ? `${Math.round(v).toLocaleString("fr-FR")} u` : formatMAD(v));

/* Histogramme 12 mois */
function SalesChart({ serie, metric }) {
  const max = Math.max(...serie.map(s => s.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 170, padding: "8px 0" }}>
      {serie.map(s => (
        <div key={s.period} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 9, color: "var(--t3)", whiteSpace: "nowrap" }}>
            {s.value ? (metric === "units" ? Math.round(s.value) : Math.round(s.value / 1000) + "k") : ""}
          </div>
          <div
            title={`${s.label} — ${fmt(s.value, metric)}`}
            style={{
              width: "100%", height: `${(s.value / max) * 100}%`, minHeight: s.value ? 4 : 1,
              background: "linear-gradient(180deg,var(--teal),rgba(0,212,170,.25))",
              borderRadius: "4px 4px 0 0", transition: "height .8s cubic-bezier(.4,0,.2,1)",
            }}
          />
          <div style={{ fontSize: 9, color: "var(--t2)", whiteSpace: "nowrap" }}>{s.label.split(" ")[0]}</div>
        </div>
      ))}
    </div>
  );
}

function ObjectiveCard({ objective, sales, accounts, onEdit, onDelete }) {
  const ratio = elapsedRatioForPeriod(objective.period);
  const p = objectiveProgress(objective, sales, { elapsedRatio: ratio });
  const scopeLabel = objective.scope === "account"
    ? (accounts.find(a => a.id === objective.refId)?.name || "Compte supprimé")
    : objective.scope === "product" ? objective.refId : "Global";
  const color = p.rate == null ? "var(--t3)" : p.onTrack ? "var(--teal)" : p.rate >= 70 ? "var(--amber)" : "var(--rose)";

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 700 }}>{scopeLabel} · {periodLabel(objective.period)}</div>
          <div className="mini" style={{ margin: 0 }}>
            {METRICS.find(m => m.id === objective.metric)?.label} — cible {fmt(objective.target || objective.value, objective.metric)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, color }}>{p.rate ?? "—"}%</span>
          <button className="chip-eye" title="Éditer" onClick={() => onEdit(objective)}>✏️</button>
          <button className="chip-eye" title="Supprimer" onClick={() => onDelete(objective.id)}>🗑️</button>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <AnimBar pct={Math.min(p.rate || 0, 100)} color={color} height={10} />
        <span className="mini" style={{ margin: 0, minWidth: 150, textAlign: "right" }}>
          {fmt(p.actual, objective.metric)} / {fmt(p.target, objective.metric)}
        </span>
      </div>
      <div className="mini" style={{ marginTop: 6 }}>
        {p.onTrack === null ? "Définis une cible." : p.onTrack
          ? `✅ En avance sur le rythme (attendu ${fmt(p.expected, objective.metric)} à ce stade).`
          : `⚠️ En retard : ${fmt(p.expected - p.actual, objective.metric)} manquants pour tenir le rythme.`}
        {p.projectedRate != null && ` Projection fin de période : ${p.projectedRate}%.`}
      </div>
    </div>
  );
}

export function SalesPage({ setPage }) {
  const { sales, mergeSales, clearSales, objectives, upsertObjective, deleteObjective,
          accounts, products, activeProduct } = useData();

  const [metric, setMetric] = useState("revenue");
  const [channel, setChannel] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [importing, setImporting] = useState(false);
  const [flash, setFlash] = useState(null);
  const [editingObj, setEditingObj] = useState(null);
  const fileRef = useRef(null);

  const periods = useMemo(() => lastPeriods(12), []);
  const currentPeriod = periods[periods.length - 1];

  const scoped = useMemo(
    () => filterSales(sales, { channel: channel || undefined, product: productFilter || undefined }),
    [sales, channel, productFilter]
  );

  const serie = useMemo(() => seriesByPeriod(scoped, periods, metric), [scoped, periods, metric]);

  const kpi = useMemo(() => {
    const current = sumSales(filterSales(scoped, { period: currentPeriod }), metric);
    const prevMonth = sumSales(filterSales(scoped, { period: periods[periods.length - 2] }), metric);
    const lastYear = sumSales(filterSales(scoped, { period: samePeriodLastYear(currentPeriod) }), metric);
    const ytd = sumSales(filterSales(scoped, { periods: periods.filter(p => p.startsWith(currentPeriod.slice(0, 4))) }), metric);
    return { current, mom: growth(current, prevMonth), yoy: growth(current, lastYear), ytd };
  }, [scoped, periods, currentPeriod, metric]);

  const byAccount = useMemo(() => {
    const rows = groupBy(filterSales(scoped, { periods }), "accountId", metric);
    const total = rows.reduce((s, r) => s + r.value, 0) || 1;
    return rows.slice(0, 12).map(r => {
      const acc = accounts.find(a => a.id === r.key);
      const prev = sumSales(filterSales(scoped, { accountId: r.key === "—" ? undefined : r.key, periods: periods.map(samePeriodLastYear) }), metric);
      return {
        ...r,
        label: acc ? acc.name : (sales.find(s => (s.accountId || "—") === r.key)?.accountName || "Non rattaché"),
        icon: acc ? accountTypeInfo(acc.type).ic : "❓",
        share: Math.round((r.value / total) * 1000) / 10,
        growth: growth(r.value, prev),
        linked: !!acc,
      };
    });
  }, [scoped, periods, metric, accounts, sales]);

  const byProduct = useMemo(() => groupBy(filterSales(scoped, { periods }), "product", metric), [scoped, periods, metric]);
  const unlinked = useMemo(() => sales.filter(s => !s.accountId).length, [sales]);

  /** Modèle de fichier prêt à remplir */
  const downloadTemplate = () => {
    const example = accounts.slice(0, 2).map(a => a.name);
    const rows = [
      ["Mois", "Client", "Produit", "Quantite", "CA", "Canal"],
      [currentPeriod, example[0] || "Clinique Agdal", activeProduct, "120", "18000", "sell_in"],
      [currentPeriod, example[1] || "Pharmacie Centrale", activeProduct, "45", "6750", "sell_out"],
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "modele-ventes-medrep.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file) => {
    if (!file) return;
    setImporting(true); setFlash(null);
    try {
      const rows = await importSalesFromFile(file, { accounts, fallbackProduct: activeProduct });
      const { added, replaced } = mergeSales(rows);
      const orphans = rows.filter(r => !r.accountId).length;
      setFlash({
        ok: true,
        msg: `✅ ${rows.length} ligne(s) importée(s) — ${added} ajoutée(s), ${replaced} mise(s) à jour.` +
             (orphans ? ` ⚠️ ${orphans} ligne(s) non rattachée(s) à un compte (noms non reconnus).` : ""),
      });
    } catch (e) {
      setFlash({ ok: false, msg: `❌ ${e.message}` });
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const metricUnit = METRICS.find(m => m.id === metric);

  return (
    <div className="content">
      <div className="fum-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="fum-hero-title">💰 Ventes &amp; objectifs</div>
            <div className="fum-hero-sub">
              {sales.length} lignes de vente · {objectives.length} objectif(s)
              {unlinked > 0 && ` · ${unlinked} ligne(s) sans compte`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => doImport(e.target.files?.[0])} />
            <button className="btn btn-g" disabled={importing} onClick={() => fileRef.current?.click()}>
              {importing ? <><span className="sp" /> Import…</> : "📥 Importer les ventes"}
            </button>
            <button className="btn btn-g" onClick={downloadTemplate}>📄 Modèle CSV</button>
            <button className="btn btn-p" onClick={() => setEditingObj(createObjective({ period: currentPeriod, metric }))}>🎯 Nouvel objectif</button>
          </div>
        </div>
      </div>

      {flash && <div className={flash.ok ? "ok" : "warn"} style={{ marginBottom: 12 }}>{flash.msg}</div>}

      {sales.length === 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="card-t">📥 Importer un fichier de ventes</div>
          <div className="mini">
            Formats acceptés : <b>.xlsx, .xls, .csv</b>. Les colonnes sont reconnues automatiquement :
            <b> Mois/Période/Date</b>, <b>Client/Compte/Établissement</b>, <b>Produit</b>,
            <b> Quantité/Unités</b>, <b>CA/Montant</b>, <b>Canal</b> (sell-in / sell-out).
            Les lignes sont rattachées aux comptes existants par leur nom.
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="pl-toolbar" style={{ marginBottom: 0 }}>
          <div style={{ minWidth: 160 }}>
            <label className="fl">Indicateur</label>
            <select className="fs" value={metric} onChange={e => setMetric(e.target.value)}>
              {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 160 }}>
            <label className="fl">Canal</label>
            <select className="fs" value={channel} onChange={e => setChannel(e.target.value)}>
              <option value="">Tous</option>
              {CHANNELS.map(c => <option key={c.id} value={c.id}>{c.ic} {c.label}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 150 }}>
            <label className="fl">Produit</label>
            <select className="fs" value={productFilter} onChange={e => setProductFilter(e.target.value)}>
              <option value="">Tous</option>
              {[...new Set([...products, ...sales.map(s => s.product)])].filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {sales.length > 0 && (
            <button className="btn btn-rose no-print" style={{ alignSelf: "flex-end" }}
              onClick={() => { if (confirm("Supprimer toutes les lignes de ventes importées ?")) clearSales(); }}>
              🧹 Vider les ventes
            </button>
          )}
        </div>
      </div>

      <div className="cd-kpi-grid">
        <div className="kpi" style={{ "--ac": "var(--teal)" }}>
          <div className="kpi-lbl">{periodLabel(currentPeriod)}</div>
          <div className="kpi-val" style={{ fontSize: 22 }}>{fmt(kpi.current, metric)}</div>
          <div className="kpi-d">mois en cours</div><div className="kpi-ic">📅</div>
        </div>
        <div className="kpi" style={{ "--ac": kpi.mom >= 0 ? "var(--teal)" : "var(--rose)" }}>
          <div className="kpi-lbl">vs mois précédent</div>
          <div className="kpi-val">{kpi.mom == null ? "—" : `${kpi.mom > 0 ? "+" : ""}${kpi.mom}%`}</div>
          <div className="kpi-d">évolution</div><div className="kpi-ic">📈</div>
        </div>
        <div className="kpi" style={{ "--ac": kpi.yoy >= 0 ? "var(--teal)" : "var(--rose)" }}>
          <div className="kpi-lbl">vs N-1</div>
          <div className="kpi-val">{kpi.yoy == null ? "—" : `${kpi.yoy > 0 ? "+" : ""}${kpi.yoy}%`}</div>
          <div className="kpi-d">même mois</div><div className="kpi-ic">🔁</div>
        </div>
        <div className="kpi" style={{ "--ac": "var(--violet)" }}>
          <div className="kpi-lbl">Cumul {currentPeriod.slice(0, 4)}</div>
          <div className="kpi-val" style={{ fontSize: 22 }}>{fmt(kpi.ytd, metric)}</div>
          <div className="kpi-d">année en cours</div><div className="kpi-ic">🏁</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">📊 Évolution 12 mois — {metricUnit?.label}</div>
        {sales.length === 0
          ? <div className="empty" style={{ padding: 24 }}>Importe un fichier de ventes pour voir la courbe.</div>
          : <SalesChart serie={serie} metric={metric} />}
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">🎯 Objectifs</div>
        {objectives.length === 0
          ? <div className="empty" style={{ padding: 20 }}>Aucun objectif. Crée une cible mensuelle ou annuelle, globale, par compte ou par produit.</div>
          : objectives
              .slice()
              .sort((a, b) => (b.period || "").localeCompare(a.period || ""))
              .map(o => (
                <ObjectiveCard key={o.id} objective={o} sales={sales} accounts={accounts}
                  onEdit={setEditingObj} onDelete={deleteObjective} />
              ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-t">🏥 Top comptes (12 mois)</div>
          {byAccount.length === 0 ? <div className="empty" style={{ padding: 20 }}>Aucune vente.</div> : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Compte</th>
                    <th style={{ textAlign: "right" }}>{metricUnit?.label}</th>
                    <th style={{ textAlign: "center" }}>Poids</th>
                    <th style={{ textAlign: "center" }}>vs N-1</th>
                  </tr>
                </thead>
                <tbody>
                  {byAccount.map(r => (
                    <tr key={r.key}>
                      <td>
                        {r.icon} {r.label}
                        {!r.linked && <span className="pill" style={{ marginLeft: 6, fontSize: 9, borderColor: "rgba(245,158,11,.35)", color: "var(--amber)" }}>non rattaché</span>}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{fmt(r.value, metric)}</td>
                      <td style={{ textAlign: "center" }}>{r.share}%</td>
                      <td style={{ textAlign: "center", color: r.growth == null ? "var(--t3)" : r.growth >= 0 ? "var(--teal)" : "var(--rose)" }}>
                        {r.growth == null ? "—" : `${r.growth > 0 ? "+" : ""}${r.growth}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {unlinked > 0 && (
            <div className="mini" style={{ marginTop: 8 }}>
              💡 {unlinked} ligne(s) non rattachée(s) : crée les comptes correspondants dans
              <button className="btn btn-g" style={{ fontSize: 10, marginLeft: 6 }} onClick={() => setPage?.("accounts")}>🏥 Comptes</button>
              puis réimporte le fichier.
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-t">💊 Répartition par produit</div>
          {byProduct.length === 0 ? <div className="empty" style={{ padding: 20 }}>Aucune vente.</div> : byProduct.map((p, i) => {
            const total = byProduct.reduce((s, x) => s + x.value, 0) || 1;
            return (
              <div key={p.key} className="city-row">
                <div className="city-name">{p.key}</div>
                <AnimBar pct={(p.value / total) * 100} color="var(--blue)" delay={i * 70} />
                <div className="city-score-val" style={{ minWidth: 90, textAlign: "right" }}>{fmt(p.value, metric)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {editingObj && (
        <Modal
          title={objectives.some(o => o.id === editingObj.id) ? "Éditer l'objectif" : "Nouvel objectif"}
          subtitle="Cible mensuelle (YYYY-MM) ou annuelle (YYYY)"
          onClose={() => setEditingObj(null)}
          actions={[
            { label: "Annuler", kind: "g", onClick: () => setEditingObj(null) },
            {
              label: "💾 Enregistrer", kind: "p", onClick: () => {
                if (!editingObj.period) return alert("Renseigne la période (ex : 2026-09 ou 2026).");
                if (!editingObj.value) return alert("Renseigne la valeur cible.");
                if (editingObj.scope !== "global" && !editingObj.refId) return alert("Sélectionne la cible (compte ou produit).");
                upsertObjective(createObjective(editingObj));
                setEditingObj(null);
              }
            },
          ]}
        >
          <div className="g2">
            <div className="fg"><label className="fl">Portée</label>
              <select className="fs" value={editingObj.scope} onChange={e => setEditingObj(p => ({ ...p, scope: e.target.value, refId: null }))}>
                {OBJECTIVE_SCOPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            {editingObj.scope === "account" && (
              <div className="fg"><label className="fl">Compte</label>
                <select className="fs" value={editingObj.refId || ""} onChange={e => setEditingObj(p => ({ ...p, refId: e.target.value }))}>
                  <option value="">— Sélectionner —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {editingObj.scope === "product" && (
              <div className="fg"><label className="fl">Produit</label>
                <select className="fs" value={editingObj.refId || ""} onChange={e => setEditingObj(p => ({ ...p, refId: e.target.value }))}>
                  <option value="">— Sélectionner —</option>
                  {[...new Set([...products, ...sales.map(s => s.product)])].filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}
            <div className="fg"><label className="fl">Indicateur</label>
              <select className="fs" value={editingObj.metric} onChange={e => setEditingObj(p => ({ ...p, metric: e.target.value }))}>
                {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Période</label>
              <input className="fi" placeholder="2026-09 ou 2026" value={editingObj.period}
                onChange={e => setEditingObj(p => ({ ...p, period: e.target.value.trim() }))} />
            </div>
            <div className="fg"><label className="fl">Valeur cible</label>
              <input className="fi" type="number" min="0" value={editingObj.value || ""}
                onChange={e => setEditingObj(p => ({ ...p, value: e.target.value }))} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
