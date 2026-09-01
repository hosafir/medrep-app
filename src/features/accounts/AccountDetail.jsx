import { useMemo, useState } from "react";
import {
  CONTACT_ROLES, accountStats, accountTypeInfo, contactsOfAccount,
  stakeholderQuadrant,
} from "../../lib/accounts.js";
import { scoreColor } from "../../lib/insights.js";
import {
  accountSalesSummary, elapsedRatioForPeriod, filterSales, formatMAD, groupBy,
  lastPeriods, objectiveProgress, periodLabel, seriesByPeriod, sumSales,
} from "../../lib/sales.js";
import { AnimBar } from "../../components/Charts.jsx";
import { useData } from "../../store/dataContext.js";

/* Matrice influence (Y) × soutien (X) — 4 quadrants actionnables */
function StakeholderMatrix({ contacts, onSelect }) {
  const size = 300, pad = 34;
  const pos = (v) => pad + ((Number(v) - 1) / 4) * (size - pad * 2);
  const qualified = contacts.filter(c => Number(c.influence) && Number(c.support));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ maxWidth: size }}>
        <rect x={pad} y={pad} width={(size - pad * 2) / 2} height={(size - pad * 2) / 2} fill="rgba(244,63,94,.08)" />
        <rect x={size / 2} y={pad} width={(size - pad * 2) / 2} height={(size - pad * 2) / 2} fill="rgba(0,212,170,.10)" />
        <rect x={pad} y={size / 2} width={(size - pad * 2) / 2} height={(size - pad * 2) / 2} fill="rgba(90,103,133,.08)" />
        <rect x={size / 2} y={size / 2} width={(size - pad * 2) / 2} height={(size - pad * 2) / 2} fill="rgba(59,130,246,.08)" />

        <line x1={pad} y1={size / 2} x2={size - pad} y2={size / 2} stroke="var(--bdr)" strokeWidth="1" />
        <line x1={size / 2} y1={pad} x2={size / 2} y2={size - pad} stroke="var(--bdr)" strokeWidth="1" />

        <text x={pad + 6} y={pad + 14} fontSize="9" fill="var(--rose)">Opposants clés</text>
        <text x={size / 2 + 6} y={pad + 14} fontSize="9" fill="var(--teal)">Champions</text>
        <text x={pad + 6} y={size - pad - 6} fontSize="9" fill="var(--t3)">Périphériques</text>
        <text x={size / 2 + 6} y={size - pad - 6} fontSize="9" fill="var(--blue)">Soutiens</text>

        <text x={size / 2} y={size - 8} fontSize="10" fill="var(--t2)" textAnchor="middle">Soutien →</text>
        <text x={12} y={size / 2} fontSize="10" fill="var(--t2)" textAnchor="middle" transform={`rotate(-90 12 ${size / 2})`}>Influence →</text>

        {qualified.map(c => {
          const q = stakeholderQuadrant(c);
          const cx = pos(c.support);
          const cy = size - pos(c.influence);
          const initials = (c.name || "?").replace(/^Dr\.?\s*/i, "").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
          return (
            <g key={c.id} onClick={() => onSelect?.(c)} style={{ cursor: "pointer" }}>
              <circle cx={cx} cy={cy} r="13" fill={q.color} opacity="0.85" />
              <text x={cx} y={cy + 4} fontSize="9" fontWeight="800" fill="#0b1020" textAnchor="middle">{initials}</text>
              <title>{`${c.name} — ${q.label}`}</title>
            </g>
          );
        })}
      </svg>
      {qualified.length === 0 && (
        <div className="empty" style={{ padding: 16 }}>
          Renseigne l'influence et le soutien de chaque contact pour construire la cartographie.
        </div>
      )}
    </div>
  );
}

export function AccountDetail({ account, onBack, setPage }) {
  const { doctors, setDoctors, reports, upsertAccount, sales, objectives } = useData();
  const [tab, setTab] = useState("contacts");
  const [linkOpen, setLinkOpen] = useState(false);

  const contacts = useMemo(() => contactsOfAccount(account.id, doctors), [account.id, doctors]);
  const stats = useMemo(() => accountStats(account, doctors, reports), [account, doctors, reports]);
  const ti = accountTypeInfo(account.type);

  const patchContact = (id, patch) =>
    setDoctors(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));

  const unlinked = useMemo(
    () => doctors.filter(d => !d.accountId).sort((a, b) => (a.name || "").localeCompare(b.name || "")),
    [doctors]
  );

  const lastVisits = useMemo(() => {
    const all = [];
    for (const c of contacts) for (const r of (reports[c.id] || [])) all.push({ ...r, contact: c });
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  }, [contacts, reports]);

  const nextActions = useMemo(
    () => contacts.filter(c => (c.nextVisitGoal || "").trim()),
    [contacts]
  );

  return (
    <div className="content">
      <div className="fum-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <button className="btn btn-g" style={{ marginBottom: 8 }} onClick={onBack}>← Comptes</button>
            <div className="fum-hero-title">{ti.ic} {account.name}</div>
            <div className="fum-hero-sub">
              {ti.label} · {account.city || "ville non renseignée"} · Niveau <b>{account.tier}</b>
              {account.address ? ` · ${account.address}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-g" onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${account.name} ${account.city}`)}`, "_blank")}>📍 Itinéraire</button>
            <button className="btn btn-p" onClick={() => setPage?.("planning")}>📅 Planifier</button>
          </div>
        </div>
      </div>

      <div className="cd-kpi-grid">
        <div className="kpi" style={{ "--ac": "var(--teal)" }}><div className="kpi-lbl">Contacts</div><div className="kpi-val">{stats.contacts}</div><div className="kpi-d">{stats.covered} vus</div><div className="kpi-ic">👥</div></div>
        <div className="kpi" style={{ "--ac": "var(--blue)" }}><div className="kpi-lbl">Couverture</div><div className="kpi-val">{stats.coverageRate}%</div><div className="kpi-d">du compte</div><div className="kpi-ic">🎯</div></div>
        <div className="kpi" style={{ "--ac": "var(--violet)" }}><div className="kpi-lbl">Adoption moy.</div><div className="kpi-val" style={{ color: scoreColor(stats.avgAdoption) }}>{stats.avgAdoption ?? "—"}</div><div className="kpi-d">score IA</div><div className="kpi-ic">📈</div></div>
        <div className="kpi" style={{ "--ac": "var(--amber)" }}><div className="kpi-lbl">Visites 90 j</div><div className="kpi-val">{stats.visits90}</div><div className="kpi-d">{stats.daysSinceLastVisit == null ? "jamais visité" : `dernière il y a ${stats.daysSinceLastVisit} j`}</div><div className="kpi-ic">🗓️</div></div>
      </div>

      <div className="vp-tab-row" style={{ marginBottom: 14 }}>
        {[
          { id: "contacts", label: `👥 Contacts (${stats.contacts})` },
          { id: "matrix", label: "🗺️ Cartographie" },
          { id: "sales", label: "💰 Ventes" },
          { id: "activity", label: "🕑 Activité" },
          { id: "plan", label: "🎯 Plan de compte" },
        ].map(t => (
          <button key={t.id} className={`vp-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === "contacts" && (
        <div className="card">
          <div className="card-t" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Contacts du compte</span>
            <button className="btn btn-blue" style={{ fontSize: 11 }} onClick={() => setLinkOpen(v => !v)}>
              {linkOpen ? "Fermer" : "🔗 Rattacher un contact"}
            </button>
          </div>

          {linkOpen && (
            <div style={{ marginBottom: 12 }}>
              <label className="fl">Contacts sans compte ({unlinked.length})</label>
              <select className="fs" defaultValue="" onChange={e => { if (e.target.value) { patchContact(Number(e.target.value) || e.target.value, { accountId: account.id }); e.target.value = ""; } }}>
                <option value="">— Sélectionner —</option>
                {unlinked.map(d => <option key={d.id} value={d.id}>{d.name} · {d.city}</option>)}
              </select>
            </div>
          )}

          {contacts.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>Aucun contact rattaché à ce compte.</div>
          ) : (
            <div className="tw">
              <table>
                <thead>
                  <tr>
                    <th>Contact</th>
                    <th>Rôle</th>
                    <th style={{ textAlign: "center" }}>Influence</th>
                    <th style={{ textAlign: "center" }}>Soutien</th>
                    <th style={{ textAlign: "center" }}>Position</th>
                    <th style={{ textAlign: "center" }}>Adoption</th>
                    <th style={{ textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => {
                    const q = stakeholderQuadrant(c);
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{c.name}</div>
                          <div className="mini" style={{ margin: 0, opacity: .7 }}>{c.specialite || "—"}</div>
                        </td>
                        <td>
                          <select className="fs" style={{ minWidth: 150 }} value={c.role || "prescripteur"} onChange={e => patchContact(c.id, { role: e.target.value })}>
                            {CONTACT_ROLES.map(r => <option key={r.id} value={r.id}>{r.ic} {r.label}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <select className="fs" value={c.influence || ""} onChange={e => patchContact(c.id, { influence: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">—</option>
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <select className="fs" value={c.support || ""} onChange={e => patchContact(c.id, { support: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">—</option>
                            {[1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="pill" style={{ borderColor: q.color, color: q.color }}>{q.label}</span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: scoreColor(c.adoptionScore) }}>{c.adoptionScore ?? "—"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button className="chip-eye" title="Détacher du compte" onClick={() => patchContact(c.id, { accountId: null })}>⛓️‍💥</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "matrix" && (
        <div className="g2">
          <div className="card">
            <div className="card-t">🗺️ Matrice influence × soutien</div>
            <StakeholderMatrix contacts={contacts} />
          </div>
          <div className="card">
            <div className="card-t">🎬 Actions recommandées</div>
            {contacts.length === 0 && <div className="empty" style={{ padding: 20 }}>Rattache des contacts.</div>}
            {contacts.map(c => {
              const q = stakeholderQuadrant(c);
              if (q.id === "unknown") return null;
              return (
                <div key={c.id} className="opp-item" style={{ borderLeft: `3px solid ${q.color}` }}>
                  <div className="opp-info">
                    <div className="opp-name">{c.name} <span style={{ color: q.color, fontSize: 11 }}>· {q.label}</span></div>
                    <div className="opp-why">{q.advice}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "sales" && <AccountSales account={account} sales={sales} objectives={objectives} />}

      {tab === "activity" && (
        <div className="g2">
          <div className="card">
            <div className="card-t">🕑 Dernières visites</div>
            {lastVisits.length === 0 ? <div className="empty" style={{ padding: 20 }}>Aucun compte-rendu sur ce compte.</div> : lastVisits.map((r, i) => (
              <div key={i} className="prio-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="prio-name">{r.contact.name}</div>
                  <div className="prio-city">{new Date(r.createdAt).toLocaleDateString("fr-FR")} · {(r.text || "").slice(0, 70) || "—"}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-t">🎯 Objectifs de prochaine visite</div>
            {nextActions.length === 0 ? <div className="empty" style={{ padding: 20 }}>Aucun objectif défini.</div> : nextActions.map(c => (
              <div key={c.id} className="fum-insight info">
                <b>{c.name}</b> — {c.nextVisitGoal}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "plan" && (
        <div className="card">
          <div className="card-t">🎯 Plan de compte</div>
          <div className="fg">
            <label className="fl">Objectif sur ce compte</label>
            <textarea
              className="fta"
              value={account.objective || ""}
              placeholder="Ex : obtenir le référencement au formulaire thérapeutique d'ici Q4, convertir 3 prescripteurs A…"
              onChange={e => upsertAccount({ ...account, objective: e.target.value })}
            />
          </div>
          <div className="fg">
            <label className="fl">Notes / historique de la relation</label>
            <textarea
              className="fta"
              value={account.notes || ""}
              onChange={e => upsertAccount({ ...account, notes: e.target.value })}
            />
          </div>
          <div className="sep" />
          <div className="g2">
            <div>
              <div className="card-t">Forces</div>
              <div className="mini">
                {stats.champions > 0 ? `${stats.champions} champion(s) identifié(s).` : "Aucun champion identifié."}
                {stats.avgAdoption != null && ` Adoption moyenne ${stats.avgAdoption}/100.`}
              </div>
            </div>
            <div>
              <div className="card-t">Risques</div>
              <div className="mini">
                {stats.blockers > 0 ? `${stats.blockers} opposant(s) clé(s). ` : ""}
                {stats.coverageRate < 60 ? `Couverture faible (${stats.coverageRate}%). ` : ""}
                {stats.daysSinceLastVisit != null && stats.daysSinceLastVisit > 60 ? `Dernière visite il y a ${stats.daysSinceLastVisit} jours.` : ""}
                {stats.blockers === 0 && stats.coverageRate >= 60 ? "Aucun risque majeur détecté." : ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Ventes du compte : évolution 12 mois, poids, croissance, objectifs liés */
function AccountSales({ account, sales, objectives }) {
  const periods = lastPeriods(12);
  const summary = accountSalesSummary(account.id, sales, periods);
  const serie = seriesByPeriod(filterSales(sales, { accountId: account.id }), periods);
  const max = Math.max(...serie.map(s => s.value), 1);
  const byProduct = groupBy(filterSales(sales, { accountId: account.id, periods }), "product");
  const totalProduct = byProduct.reduce((s, p) => s + p.value, 0) || 1;
  const accObjectives = objectives.filter(o => o.scope === "account" && o.refId === account.id);
  const currentMonth = periods[periods.length - 1];
  const currentValue = sumSales(filterSales(sales, { accountId: account.id, period: currentMonth }));

  if (!summary.lines) {
    return (
      <div className="card">
        <div className="empty" style={{ padding: 28 }}>
          Aucune vente rattachée à ce compte. Importe un fichier de ventes depuis l'onglet
          <b> 💰 Ventes</b> : les lignes sont rattachées automatiquement par le nom du compte
          (« {account.name} »).
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="cd-kpi-grid">
        <div className="kpi" style={{ "--ac": "var(--teal)" }}>
          <div className="kpi-lbl">CA 12 mois</div>
          <div className="kpi-val" style={{ fontSize: 20 }}>{formatMAD(summary.value)}</div>
          <div className="kpi-d">sur ce compte</div><div className="kpi-ic">💰</div>
        </div>
        <div className="kpi" style={{ "--ac": summary.growth >= 0 ? "var(--teal)" : "var(--rose)" }}>
          <div className="kpi-lbl">vs 12 mois N-1</div>
          <div className="kpi-val">{summary.growth == null ? "—" : `${summary.growth > 0 ? "+" : ""}${summary.growth}%`}</div>
          <div className="kpi-d">{formatMAD(summary.previous)}</div><div className="kpi-ic">📈</div>
        </div>
        <div className="kpi" style={{ "--ac": "var(--violet)" }}>
          <div className="kpi-lbl">Poids portefeuille</div>
          <div className="kpi-val">{summary.share}%</div>
          <div className="kpi-d">du CA total</div><div className="kpi-ic">🥧</div>
        </div>
        <div className="kpi" style={{ "--ac": "var(--blue)" }}>
          <div className="kpi-lbl">{periodLabel(currentMonth)}</div>
          <div className="kpi-val" style={{ fontSize: 20 }}>{formatMAD(currentValue)}</div>
          <div className="kpi-d">mois en cours</div><div className="kpi-ic">📅</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="card-t">📊 Évolution du CA (12 mois)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 150 }}>
          {serie.map(s => (
            <div key={s.period} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div
                title={`${s.label} — ${formatMAD(s.value)}`}
                style={{
                  width: "100%", height: `${(s.value / max) * 100}%`, minHeight: s.value ? 4 : 1,
                  background: "linear-gradient(180deg,var(--teal),rgba(0,212,170,.25))",
                  borderRadius: "4px 4px 0 0", transition: "height .8s ease",
                }}
              />
              <div style={{ fontSize: 9, color: "var(--t2)" }}>{s.label.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-t">💊 Mix produits</div>
          {byProduct.map((p, i) => (
            <div key={p.key} className="city-row">
              <div className="city-name">{p.key}</div>
              <AnimBar pct={(p.value / totalProduct) * 100} color="var(--blue)" delay={i * 70} />
              <div className="city-score-val" style={{ minWidth: 90, textAlign: "right" }}>{formatMAD(p.value)}</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-t">🎯 Objectifs sur ce compte</div>
          {accObjectives.length === 0
            ? <div className="empty" style={{ padding: 20 }}>Aucun objectif défini pour ce compte.</div>
            : accObjectives.map(o => {
                const p = objectiveProgress(o, sales, { elapsedRatio: elapsedRatioForPeriod(o.period) });
                const color = p.onTrack ? "var(--teal)" : "var(--amber)";
                return (
                  <div key={o.id} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span>{periodLabel(o.period)}</span>
                      <b style={{ color }}>{p.rate ?? "—"}%</b>
                    </div>
                    <AnimBar pct={Math.min(p.rate || 0, 100)} color={color} height={8} />
                    <div className="mini" style={{ margin: "4px 0 0" }}>
                      {formatMAD(p.actual)} / {formatMAD(p.target)}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </>
  );
}
