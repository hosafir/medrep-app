import { useState, useMemo } from "react";
import { DoctorTimeline } from "../../components/Panels.jsx";
import { callLLM } from "../../lib/ai.js";
import { parseAISections } from "../../lib/aiParse.js";
import { computePredictiveScore, scoreColor } from "../../lib/insights.js";

export function VisitPrepModal({ doctor, reports, aiAction, apiKey, provider, model, onClose, onAnalyze, analyzing, aiErr, setDoctors }) {
  const [tab, setTab] = useState("brief");
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(doctor.nextVisitGoal || "");
  
  const doctorReports = (reports[doctor.id] || []).slice(0, 5);
  const aiText = aiAction?.text || "";
  const sections = useMemo(() => parseAISections(aiText), [aiText]);
  const hasAI = !!aiText;
  const predictiveScore = useMemo(() => computePredictiveScore(doctor, reports), [doctor, reports]);

  // --- Helpers Visuels ---
  
  // 1. Stade d'adoption (Texte -> Objet visuel)
  const stage = useMemo(() => {
    const s = (sections.score || "").toLowerCase();
    if (s.includes("prescripteur") || s.includes("adopté")) return { lbl: "Prescripteur", ic: "🔥", color: "var(--rose)", bg: "rgba(244,63,94,.1)", desc: "Fidèle et actif" };
    if (s.includes("potentiel") || s.includes("tiède")) return { lbl: "Potentiel", ic: "🌡️", color: "var(--amber)", bg: "rgba(245,158,11,.1)", desc: "En progression" };
    if (s.includes("froid") || s.includes("réfractaire")) return { lbl: "Froid", ic: "❄️", color: "var(--blue)", bg: "rgba(59,130,246,.1)", desc: "Peu intéressé" };
    if (s.includes("découverte")) return { lbl: "Découverte", ic: "🆕", color: "var(--teal)", bg: "rgba(0,212,170,.1)", desc: "Premiers contacts" };
    return { lbl: "Non évalué", ic: "📋", color: "var(--t3)", bg: "var(--navy4)", desc: "Lance l'analyse" };
  }, [sections]);

  // 2. Probabilité de Prescription (Jauge)
  const proba = useMemo(() => {
    const val = aiAction?.prescriptionProba || sections.score || "";
    const s = val.toLowerCase();
    if (s.includes("élevée") || parseInt(s) >= 65) return { pct: 85, lbl: "Élevée", ic: "🟢", color: "var(--teal)" };
    if (s.includes("moyenne") || parseInt(s) >= 35) return { pct: 50, lbl: "Moyenne", ic: "🟡", color: "var(--amber)" };
    if (s.includes("faible") || parseInt(s) >= 0) return { pct: 20, lbl: "Faible", ic: "🔴", color: "var(--rose)" };
    return { pct: 0, lbl: "N/A", ic: "⚪", color: "var(--t3)" };
  }, [aiAction, sections]);

  // 3. Température (Score Global)
  const temp = useMemo(() => {
    const s = doctor.adoptionScore;
    if (s == null) return { lbl: "N/A", ic: "❔", color: "var(--t3)", bg: "var(--navy4)" };
    if (s >= 76) return { lbl: "Chaud", ic: "🔥", color: "var(--rose)", bg: "rgba(244,63,94,.1)" };
    if (s >= 26) return { lbl: "Tiède", ic: "🌡️", color: "var(--amber)", bg: "rgba(245,158,11,.1)" };
    return { lbl: "Froid", ic: "❄️", color: "var(--blue)", bg: "rgba(59,130,246,.1)" };
  }, [doctor]);

  // 4. Sentiment Détecté
  const sentiment = useMemo(() => {
    const txt = (aiText + " " + (doctor.mainObjection || "")).toLowerCase();
    if (txt.includes("hostile") || txt.includes("refus catégorique") || txt.includes("mécontent")) return { lbl: "Hostile", ic: "😠", color: "var(--rose)" };
    if (txt.includes("sceptique") || txt.includes("réserve") || txt.includes("doute")) return { lbl: "Sceptique", ic: "🤨", color: "var(--amber)" };
    if (txt.includes("enthousiaste") || txt.includes("très intéressé") || txt.includes("partenaire")) return { lbl: "Enthousiaste", ic: "😊", color: "var(--teal)" };
    return { lbl: "Neutre", ic: "😐", color: "var(--t2)" };
  }, [aiText, doctor]);

  const initials = name => { const p = name.replace(/^Dr\.?\s*/i, "").split(" "); return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase(); };

  // Sauvegarde Objectif
  const saveGoal = () => {
    if (setDoctors) setDoctors(prev => prev.map(d => d.id === doctor.id ? { ...d, nextVisitGoal: tempGoal } : d));
    setEditingGoal(false);
  };

  // Génération Message
  const [msgType, setMsgType] = useState("email");
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgResult, setMsgResult] = useState("");
  
  const generateMessage = async () => {
    if (!apiKey) return;
    setMsgLoading(true); setMsgResult("");
    const prompt = `Rédige un ${msgType === 'email' ? 'email professionnel' : 'SMS'} pour Dr. ${doctor.name}.
Contexte: ${doctor.city}, Score ${doctor.adoptionScore}/100, Frein: ${doctor.mainObjection || "Aucun"}.
Objectif: ${tempGoal || "Découvrir le produit"}.
Tonalité: Adaptée au sentiment ${sentiment.lbl}.`;
    try {
      const out = await callLLM(prompt, apiKey, provider, model);
      setMsgResult(out);
    } catch (e) { setMsgResult("Erreur: " + e.message); }
    setMsgLoading(false);
  };

  const TABS = [
    { id: "brief", label: "📋 Brief" }, 
    { id: "objection", label: "🚧 Objection" },
    { id: "messages", label: "✉️ Messages" }, 
    { id: "actions", label: "✅ Actions" }, 
    { id: "reports", label: `📝 CR (${doctorReports.length})` },
    ...(hasAI ? [{ id: "fullai", label: "🤖 IA" }] : [])
  ];

  return (
    <div className="vp-overlay" onMouseDown={onClose}>
      <div className="vp-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-header-top">
            <div className="vp-avatar">{initials(doctor.name)}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="vp-name">{doctor.name}</div>
              <div className="vp-meta">
                <span>📍 {doctor.city}{doctor.sector ? ` · ${doctor.sector}` : ""}</span>
                <span className={`tag t${doctor.potential || "C"}`}>{doctor.potential || "C"}</span>
                {/* Badge Température */}
                <span className="pill" style={{ borderColor: temp.color, color: temp.color, background: temp.bg }}>{temp.ic} {temp.lbl}</span>
              </div>
            </div>
            <button className="vp-close" onClick={onClose}>✕</button>
          </div>
          
          {/* Ligne des KPIs Visuels */}
          <div className="vp-score-row">
            {/* Score IA */}
            <div className="vp-kpi">
              <div className="vp-kpi-lbl">Score</div>
              <div className="vp-kpi-val" style={{ color: scoreColor(doctor.adoptionScore) }}>{doctor.adoptionScore != null ? `${doctor.adoptionScore}` : "—"}</div>
            </div>
            
            {/* Stade Adoption (Badge) */}
            <div className="vp-kpi" style={{ background: stage.bg, border: `1px solid ${stage.color}`, minWidth: 100 }}>
              <div className="vp-kpi-lbl" style={{ color: stage.color }}>Stade</div>
              <div style={{ fontSize: 20 }}>{stage.ic}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: stage.color, marginTop: 2 }}>{stage.lbl}</div>
            </div>

            {/* Jauge Probabilité Prescription */}
            <div className="vp-kpi" style={{ minWidth: 120 }}>
              <div className="vp-kpi-lbl">Prob. Rx</div>
              <div style={{ width: "100%", height: 6, background: "var(--navy4)", borderRadius: 3, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: `${proba.pct}%`, height: "100%", background: proba.color, transition: "width 0.5s", borderRadius: 3 }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "var(--t3)" }}>0%</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: proba.color }}>{proba.ic} {proba.lbl}</span>
                <span style={{ fontSize: 10, color: "var(--t3)" }}>100%</span>
              </div>
            </div>

            {/* Sentiment */}
            <div className="vp-kpi">
              <div className="vp-kpi-lbl">Humeur</div>
              <span style={{ fontSize: 22 }}>{sentiment.ic}</span>
              <div style={{ fontSize: 10, color: sentiment.color, fontWeight: 600 }}>{sentiment.lbl}</div>
            </div>
          </div>

          {/* Objectif Next Visit */}
          <div style={{ marginTop: 12, background: "var(--navy3)", padding: 10, borderRadius: 8, border: "1px solid var(--bdr)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--teal)" }}>🎯 OBJECTIF</div>
              {!editingGoal && <button className="btn btn-g" style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => setEditingGoal(true)}>✏️</button>}
            </div>
            {editingGoal ? (
              <div>
                <textarea className="fta" value={tempGoal} onChange={e => setTempGoal(e.target.value)} style={{ fontSize: 12 }} rows={2} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
                  <button className="btn btn-g" onClick={() => setEditingGoal(false)}>Annuler</button>
                  <button className="btn btn-p" onClick={saveGoal}>💾</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "var(--t1)", lineHeight: 1.5 }}>{tempGoal || <span style={{ color: "var(--t3)" }}>Définir un objectif...</span>}</div>
            )}
          </div>
        </div>

        {/* Tabs & Body (identique avant) */}
        <div style={{ padding: "10px 24px 0", borderBottom: "1px solid var(--bdr)" }}>
          <div className="vp-tab-row">{TABS.map(t => <button key={t.id} className={`vp-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>)}</div>
        </div>

        <div className="vp-body">
          {aiErr && <div className="warn" style={{ marginBottom: 10 }}>⚠️ {aiErr}</div>}
          {analyzing && <div className="vp-analyzing"><span className="sp" /> Analyse...</div>}
          {tab === "brief" && !analyzing && (
            <div className="vp-grid">
              <div className="vp-section"><div className="vp-sec-title">📈 Score prédictif</div><div className="vp-sec-body" style={{ fontFamily: "var(--fd)", fontSize: 24, fontWeight: 800, color: scoreColor(predictiveScore) }}>{predictiveScore}<span style={{ fontSize: 12, color: "var(--t3)" }}>/100</span></div></div>
              <div className="vp-section accent-teal"><div className="vp-sec-title">🎯 Situation</div><div className="vp-sec-body">{sections.situation || "Lance l'analyse."}</div></div>
              <div className="vp-section accent-rose"><div className="vp-sec-title">🚧 Frein</div><div className="vp-sec-body">{doctor.mainObjection || "Aucun."}</div></div>
            </div>
          )}
          {tab === "messages" && (
            <div>
              <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
                <button className={`msg-type-btn ${msgType === 'email' ? 'active' : ''}`} onClick={() => setMsgType('email')}>Email</button>
                <button className={`msg-type-btn ${msgType === 'sms' ? 'active' : ''}`} onClick={() => setMsgType('sms')}>SMS</button>
              </div>
              <button className="btn btn-p" onClick={generateMessage} disabled={!apiKey || msgLoading} style={{ width: "100%", marginBottom: 12 }}>{msgLoading ? <><span className="sp" />...</> : `✨ Générer ${msgType}`}</button>
              {msgResult && <div className="msg-output">{msgResult}</div>}
            </div>
          )}
          {tab === "actions" && !analyzing && <div className="vp-section"><div className="vp-sec-title">✅ Actions</div><div className="vp-sec-body" style={{ whiteSpace: "pre-wrap" }}>{sections.actions || "Lance l'analyse."}</div></div>}
          {tab === "reports" && <DoctorTimeline doctorId={doctor.id} reports={reports} />}
          {tab === "fullai" && hasAI && !analyzing && <div className="vp-ai-raw">{aiText}</div>}
        </div>

        <div className="vp-footer">
          <div style={{ display: "flex", gap: 8 }}>
            {!hasAI && <button className="btn btn-p" onClick={onAnalyze} disabled={!apiKey || analyzing}>⚡ Analyser</button>}
            {hasAI && <button className="btn btn-blue" onClick={onAnalyze} disabled={!apiKey || analyzing}>🔄 Re-analyser</button>}
          </div>
          <button className="btn btn-g" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
