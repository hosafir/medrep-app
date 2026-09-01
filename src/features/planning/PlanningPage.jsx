import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { RouteOptimizerPanel } from "../../components/Panels.jsx";
import { VisitPrepModal } from "../doctors/VisitPrepModal.jsx";
import { DirectiveModal } from "./DirectiveModal.jsx";
import { generatePlanning } from "./planningEngine.js";
import { callLLM } from "../../lib/ai.js";
import { CLUSTER, DFR, MFR, dtNowISO, groupWorkdaysByWeek, isWedThu, listWorkdays, monthKey } from "../../lib/dates.js";
import { extractAIMemory, extractAdoptionInsights } from "../../lib/insights.js";
import { stableSortDocs } from "../../lib/normalize.js";
import { loadJSON, saveJSON } from "../../lib/storage.js";
import { useData } from "../../store/dataContext.js";

export function PlanningPage({ doctors, setDoctors, apiKey, provider, model }) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [monthIndex, setMonthIndex] = useState(() => new Date().getMonth());
  const [perDay, setPerDay] = useState(6);
  
  const [directives, setDirectives] = useState(() => loadJSON("medrep_directives", []));
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [editingDirective, setEditingDirective] = useState(null);

  const storageKey = useMemo(() => `medrep_planning_${monthKey(year, monthIndex)}`, [year, monthIndex]);
  const workdays = useMemo(() => listWorkdays(year, monthIndex), [year, monthIndex]);
  const docById = useMemo(() => { const m = new Map(); doctors.forEach(d => m.set(d.id, d)); return m; }, [doctors]);
  const { reports: allReports } = useData();

  const [planState, setPlanState] = useState(() => {
    const saved = loadJSON(storageKey, null);
    if (saved?.plan) return saved;
    return generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports });
  });

  // Régénération EXPLICITE (plus d'effet qui écrasait le planning à chaque rendu).
  // `over` permet de passer la nouvelle valeur avant que le state React ne soit à jour.
  const applyPlan = useCallback((over = {}) => {
    setPlanState(generatePlanning({ doctors, year, monthIndex, perDay, directives, allReports, ...over }));
  }, [doctors, year, monthIndex, perDay, directives, allReports]);

  const regenerate = useCallback(() => applyPlan(), [applyPlan]);

  // Changement de période : on recharge le planning sauvegardé du mois, sinon on en génère un.
  const loadOrGenerate = useCallback((over) => {
    const y = over.year ?? year, mi = over.monthIndex ?? monthIndex;
    const saved = loadJSON(`medrep_planning_${monthKey(y, mi)}`, null);
    if (saved?.plan) setPlanState(saved);
    else applyPlan(over);
  }, [year, monthIndex, applyPlan]);

  const changeMonth = (mi) => { setMonthIndex(mi); loadOrGenerate({ monthIndex: mi }); };
  const changeYear = (y) => { setYear(y); loadOrGenerate({ year: y }); };
  const changePerDay = (p) => { setPerDay(p); applyPlan({ perDay: p }); };

  useEffect(() => saveJSON("medrep_directives", directives), [directives]);
  // Persistance du planning (drag & drop inclus) — corrige la perte des modifications manuelles
  useEffect(() => { if (planState?.plan) saveJSON(storageKey, planState); }, [storageKey, planState]);
  const clearMonth = () => { const blank = {}; workdays.forEach(d => (blank[d] = [])); setPlanState({ plan: blank, backlog: doctors.map(d => d.id), meta: { year, monthIndex, perDay } }); };

  const saveDirective = (dir) => {
    const next = directives.find(d => d.id === dir.id) ? directives.map(d => d.id === dir.id ? dir : d) : [...directives, dir];
    setDirectives(next); applyPlan({ directives: next });
    setShowDirectiveModal(false); setEditingDirective(null);
  };

  const deleteDirective = (id) => { if(!confirm("Supprimer cette règle ?")) return; const next = directives.filter(d => d.id !== id); setDirectives(next); applyPlan({ directives: next }); };

  const scheduledOnceSet = useMemo(() => new Set(Object.values(planState.plan || {}).flat()), [planState.plan]);
  const allVisitedOnce = doctors.length > 0 && scheduledOnceSet.size >= doctors.length;
  const [dragId, setDragId] = useState(null); const [, setDropDay] = useState(null); const [dropBacklog, setDropBacklog] = useState(false); const isDraggingRef = useRef(false);
  const [visitPrepId, setVisitPrepId] = useState(null); const [vpAnalyzing, setVpAnalyzing] = useState(false); const [vpAiErr, setVpAiErr] = useState("");
  const reports = allReports; const [actions, setActions] = useState(() => loadJSON("medrep_actions_v1", {}));
  useEffect(() => { try { localStorage.setItem("medrep_actions_v1", JSON.stringify(actions)); } catch { /* quota localStorage dépassé : ignoré */ } }, [actions]);
  const visitPrepDoctor = visitPrepId ? docById.get(visitPrepId) : null;
  const openVisitPrep = id => { setVpAiErr(""); setVisitPrepId(id); };
  
  const analyzeForVisit = async () => {
    if (!apiKey || !visitPrepDoctor) return; const docReports = (reports[visitPrepId] || []).slice(0, 5);
    if (!docReports.length) { setVpAiErr("Ajoute un CR."); return; }
    const existingMemory = loadJSON(`medrep_memory_${visitPrepId}`, {}); setVpAnalyzing(true); setVpAiErr("");
    try { const prompt = `Analyse ${visitPrepDoctor.name}.\nCR:\n${docReports.map((r, i) => `[${i+1}] ${r.text||'—'}`).join("\n")}\n## Score\n- Score : X/100`; const out = await callLLM(prompt, apiKey, provider, model); const insights = extractAdoptionInsights(out); const newMemory = extractAIMemory(out, existingMemory); setActions(prev => ({ ...prev, [visitPrepId]: { generatedAt: dtNowISO(), text: out } })); saveJSON(`medrep_memory_${visitPrepId}`, newMemory); if (setDoctors) setDoctors(prev => stableSortDocs(prev.map(doc => doc.id === visitPrepId ? { ...doc, adoptionScore: insights.adoptionScore ?? doc.adoptionScore } : doc))); } catch (e) { setVpAiErr(e.message); } setVpAnalyzing(false);
  };

  const isDocInPlan = (id, plan) => { for (const k of Object.keys(plan)) if ((plan[k] || []).includes(id)) return true; return false; };
  const onDropToDay = day => { if (!dragId) return; isDraggingRef.current = false; setPlanState(prev => { const plan = { ...prev.plan }; const doc = docById.get(dragId); if (doc && CLUSTER.includes(doc.city) && !isWedThu(day)) { alert("Cluster Mer/Jeu"); return prev; } const alreadyIn = isDocInPlan(dragId, plan); if (alreadyIn && !allVisitedOnce) { alert("1 visite max"); return prev; } Object.keys(plan).forEach(k => { plan[k] = (plan[k] || []).filter(id => id !== dragId); }); const backlog = (prev.backlog || []).filter(id => id !== dragId); plan[day] = [...(plan[day] || []), dragId]; return { ...prev, plan, backlog }; }); setDragId(null); setDropDay(null); setDropBacklog(false); };
  const onDropToBacklog = () => { if (!dragId) return; isDraggingRef.current = false; setPlanState(prev => { const plan = { ...prev.plan }; Object.keys(plan).forEach(k => { plan[k] = (plan[k] || []).filter(id => id !== dragId); }); const backlog = [dragId, ...(prev.backlog || []).filter(id => id !== dragId)]; return { ...prev, plan, backlog }; }); setDragId(null); setDropDay(null); setDropBacklog(false); };
  const removeFromDay = (day, id) => { setPlanState(prev => { const plan = { ...prev.plan, [day]: (prev.plan[day] || []).filter(x => x !== id) }; const backlog = [id, ...(prev.backlog || []).filter(x => x !== id)]; return { ...prev, plan, backlog }; }); };

  const openMap = (d) => { const query = encodeURIComponent(`${d.name} ${d.sector || ''} ${d.city}`); window.open(`https://www.google.com/maps/search/${query}`, '_blank'); };

  const totalScheduled = Object.values(planState.plan || {}).flat().length;
  const activeDays = Object.entries(planState.plan || {}).filter(([, arr]) => (arr || []).length > 0).length;
  const weeks = useMemo(() => groupWorkdaysByWeek(workdays), [workdays]);
  const realBacklog = useMemo(() => { const scheduled = new Set(Object.values(planState.plan || {}).flat()); return doctors.filter(d => !scheduled.has(d.id)).map(d => d.id); }, [doctors, planState.plan]);
  const [planTab, setPlanTab] = useState("planning");
  
  // Helper pour affichage
  const dayLabels = {1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven"};

  return (
    <div className="content">
      <div className="vp-tab-row" style={{ marginBottom: 14 }}> <button className={`vp-tab${planTab === "planning" ? " active" : ""}`} onClick={() => setPlanTab("planning")}>📅 Planning</button> <button className={`vp-tab${planTab === "route" ? " active" : ""}`} onClick={() => setPlanTab("route")}>🗺️ Tournée</button> </div>
      {planTab === "route" && <div className="card" style={{ marginBottom: 14 }}><div className="card-t">🗺️ Tournée</div><RouteOptimizerPanel doctors={doctors} planState={planState} docById={docById} /></div>}
      {planTab === "planning" && ( <>
        <div className="pl-toolbar"> <div style={{ minWidth: 150 }}><label className="fl">Mois</label><select className="fs" value={monthIndex} onChange={e => changeMonth(parseInt(e.target.value, 10))}>{MFR.map((m, i) => <option key={m} value={i}>{m}</option>)}</select></div> <div style={{ minWidth: 100 }}><label className="fl">Année</label><input className="fi" type="number" value={year} onChange={e => changeYear(parseInt(e.target.value || String(new Date().getFullYear()), 10))} /></div> <div style={{ minWidth: 120 }}><label className="fl">Visites / jour</label><input className="fi" type="number" min={3} max={12} value={perDay} onChange={e => changePerDay(parseInt(e.target.value || "6", 10))} /></div> <div style={{ display: "flex", gap: 8 }}> <button className="btn btn-blue" onClick={() => { setEditingDirective(null); setShowDirectiveModal(true); }}>📋 Règles Pro</button> <button className="btn btn-p" onClick={regenerate}>⚡ Générer</button> <button className="btn btn-g" onClick={clearMonth}>🧹 Vider</button> </div> <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}> <span className="pill">📅 {activeDays} jours</span> <span className="pill" style={{ borderColor: "rgba(0,212,170,.35)" }}>✅ {totalScheduled} planifiées</span> </div> </div>
        {directives.length > 0 && <div className="card" style={{ marginBottom: 10, padding: "8px 12px", display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}> <span style={{ fontSize: 11, fontWeight: 700 }}>Règles actives:</span> {directives.filter(d => d.isActive).map(d => <span key={d.id} className="pill" style={{ borderColor: "var(--violet)", color: "var(--violet)", cursor: 'pointer' }} onClick={() => { setEditingDirective(d); setShowDirectiveModal(true); }}> {d.name} (S{d.week}, P{d.priority || 5}) <span style={{ marginLeft: 4, opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); deleteDirective(d.id); }}>✕</span> </span> )} </div> }
        <div className="ok" style={{ marginBottom: 12 }}>✅ Algo Pro actif (Préférences & Clusters). <b>Clic sur 📋</b> pour préparer.</div>
        <div className="card" style={{ marginBottom: 12 }}> <div className="card-t">Backlog <span className="pill">{realBacklog.length}</span></div> <div onDragOver={e => { e.preventDefault(); setDropBacklog(true); }} onDragLeave={() => setDropBacklog(false)} onDrop={e => { e.preventDefault(); onDropToBacklog(); }} className={dropBacklog ? "drop-hint" : ""} style={{ padding: 10, borderRadius: 12, minHeight: 70 }}> {realBacklog.length === 0 && <div className="empty" style={{ padding: 18 }}>Tout est planifié ✅</div>} <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(200px,1fr))", gap: 10 }}> {realBacklog.slice(0, 40).map(id => { const d = docById.get(id); if (!d) return null; return ( <div key={id} className={`chip chip-clickable ${dragId === id ? "dragging" : ""}`} draggable onDragStart={() => { isDraggingRef.current = true; setDragId(id); }} onDragEnd={() => { isDraggingRef.current = false; setDragId(null); setDropBacklog(false); }}> <div className="chip-l" onClick={() => openVisitPrep(id)}><div className="chip-n">{d.name}</div><div className="chip-s">{d.city} {d.preferredDay ? <span style={{color:"var(--teal)"}}>({dayLabels[d.preferredDay]})</span> : ""}</div></div> <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button className="chip-eye" onClick={e => { e.stopPropagation(); openMap(d); }} title="Localiser">📍</button>
          <span className={`tag t${d.potential || "C"}`}>{d.potential || "C"}</span>
          <button className="chip-eye" onClick={e => { e.stopPropagation(); openVisitPrep(id); }}>📋</button>
        </div> </div> ); })} </div> </div> </div>
        {weeks.map((weekDays, wi) => { const weekVisits = weekDays.reduce((acc, day) => acc + ((planState.plan?.[day] || []).length), 0); const weekTarget = weekDays.length * perDay; return ( <div key={`week_${wi}`} className="week-block"> <div className="week-head"><div><div className="week-title">Semaine {wi + 1}</div><div className="week-sub">{weekDays.length}j · {weekVisits}/{weekTarget}</div></div></div> <div className="pl-grid-week"> {weekDays.map(day => { const dt = new Date(day), list = planState.plan?.[day] || [], isClDay = isWedThu(day); const isDirectiveDay = directives.some(dir => dir.week === (wi+1) && dir.days.includes(dt.getDay()));
                
                // Affichage Cluster
                const locationCount = {}; 
                list.forEach(id => { const doc = docById.get(id); if(doc) { const loc = (doc.sector && /clinique|hôpital|center/i.test(doc.sector)) ? doc.sector : doc.city; locationCount[loc] = (locationCount[loc] || 0) + 1; } });
                const dominantLocation = Object.entries(locationCount).sort((a,b) => b[1] - a[1])[0];

                return ( <div key={day} className={`pl-day ${isClDay ? "cl" : ""} ${isDirectiveDay ? "full" : ""}`} onDragOver={e => { e.preventDefault(); setDropDay(day); }} onDrop={e => { e.preventDefault(); onDropToDay(day); }}> <div className="pl-dh"><div><div className="pl-dn">{DFR[dt.getDay()]} {dt.getDate()}</div>
                  {dominantLocation && (<div className="soft-badge ok" style={{marginTop:2}}>📍 {dominantLocation[0]} ({dominantLocation[1]})</div>)}
                  {isDirectiveDay && <div className="mini" style={{color:"var(--violet)"}}>📋 Directive</div>}
                </div><span className="pill">{list.length}/{perDay}</span></div> <div className="pl-vs"> {list.map(id => { const d = docById.get(id); if (!d) return null; return ( <div key={id} className="chip" draggable onDragStart={() => { isDraggingRef.current = true; setDragId(id); }}> <div className="chip-l" onClick={() => openVisitPrep(id)} style={{ cursor: "pointer" }}><div className="chip-n">{d.name}</div><div className="chip-s">{d.city}</div></div> <div style={{ display: "flex", gap: 4 }}>
                  <button className="chip-eye" onClick={() => openMap(d)} title="Localiser">📍</button>
                  <button className="chip-eye" onClick={() => openVisitPrep(id)}>📋</button>
                  <button className="btn btn-g" style={{ padding: "2px 6px", fontSize: 10 }} onClick={() => removeFromDay(day, id)}>✕</button>
                </div> </div> ); })} </div> </div> ); })} </div> </div> ); })}
      </> )}
    
      {showDirectiveModal && <DirectiveModal directive={editingDirective} onSave={saveDirective} onClose={() => { setShowDirectiveModal(false); setEditingDirective(null); }} doctors={doctors} />}
      {visitPrepDoctor && <VisitPrepModal doctor={visitPrepDoctor} reports={reports} aiAction={actions[visitPrepId]} apiKey={apiKey} provider={provider} model={model} onClose={() => { setVisitPrepId(null); }} onAnalyze={analyzeForVisit} analyzing={vpAnalyzing} aiErr={vpAiErr} setDoctors={setDoctors} />}
    </div>
  );
}
