import { useState, useMemo } from "react";
import { callLLM } from "../lib/ai.js";
import { CLUSTER, dtNowISO } from "../lib/dates.js";
import { detectOpportunities, scoreColor } from "../lib/insights.js";
import { loadJSON, saveJSON } from "../lib/storage.js";

export function OpportunityPanel({doctors,reports,setPage}){
  const opps=useMemo(()=>detectOpportunities(doctors,reports),[doctors,reports]);
  if(!opps.length)return <div className="ok" style={{fontSize:12}}>✅ Aucune opportunité critique détectée.</div>;
  return(<div>{opps.map((o,i)=><div key={i} className={`opp-item ${o.type}`} onClick={()=>setPage("reports")}><div className="opp-ic">{o.ic}</div><div className="opp-info"><div className="opp-name">{o.doctor.name}</div><div className="opp-why">{o.doctor.city} · {o.reason}</div></div><div style={{fontFamily:"var(--fd)",fontSize:14,fontWeight:800,flexShrink:0,color:scoreColor(o.doctor.adoptionScore)}}>{o.doctor.adoptionScore??""}</div></div>)}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Weekly Priority Panel
───────────────────────────────────────────────────────────── */
export function WeeklyPriorityPanel({doctors,apiKey,provider,model}){
  const[result,setResult]=useState(()=>loadJSON("medrep_weekly_prio",null));
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const generate=async()=>{if(!apiKey)return;setLoading(true);setErr("");try{const top=[...doctors].sort((a,b)=>(b.adoptionScore??0)-(a.adoptionScore??0)).slice(0,10);const prompt=`Génère le plan de priorisation de visites pour cette semaine.\n\nMÉDECINS :\n${top.map(d=>`- ${d.name} (${d.city}, Pot ${d.potential}, Score ${d.adoptionScore??'N/A'}/100, Frein: ${d.mainObjection||'—'})`).join("\n")}\n\nRéponds en JSON uniquement :\n{"haute":[{"name":"...","why":"..."}],"moyenne":[{"name":"...","why":"..."}],"basse":[{"name":"...","why":"..."}]}`;const raw=await callLLM(prompt,apiKey,provider,model);const clean=raw.replace(/```json|```/g,"").trim();const parsed=JSON.parse(clean);const data={generatedAt:dtNowISO(),priorities:parsed};setResult(data);saveJSON("medrep_weekly_prio",data);}catch(e){setErr(e.message);}setLoading(false);};
  const renderPrios=(list,cls,ic)=>(list||[]).map((item,i)=><div key={i} className={`prio-ai-item ${cls}`}><div className="prio-ai-rank">{ic}</div><div><div className="prio-ai-n">{item.name}</div><div className="prio-ai-why">{item.why}</div></div></div>);
  return(<div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap"}}>{result?.generatedAt&&<span className="mini" style={{margin:0}}>Généré: {new Date(result.generatedAt).toLocaleDateString("fr-FR")}</span>}<button className="btn btn-p" style={{fontSize:11}} onClick={generate} disabled={!apiKey||loading}>{loading?<><span className="sp"/> Génération…</>:"⚡ Générer priorités semaine"}</button></div>{err&&<div className="warn" style={{marginBottom:8}}>⚠️ {err}</div>}{!apiKey&&<div className="warn" style={{fontSize:11}}>🔑 Clé API requise.</div>}{result?.priorities&&<div>{renderPrios(result.priorities.haute,"h","🔥")}{renderPrios(result.priorities.moyenne,"m","🌡️")}{renderPrios(result.priorities.basse,"l","❄️")}</div>}{!result&&!loading&&<div className="empty" style={{padding:20}}>Clique sur "Générer" pour les priorités IA.</div>}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Doctor Timeline
───────────────────────────────────────────────────────────── */
export function DoctorTimeline({doctorId,reports}){
  const dr=useMemo(()=>(reports[doctorId]||[]).slice().sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)),[doctorId,reports]);
  if(!dr.length)return <div className="empty" style={{padding:16}}>Aucun compte-rendu.</div>;
  return(<div className="tl-wrap">{dr.map((r,i)=><div key={r.id} className="tl-item"><div className={`tl-dot ${i>0?"old":""}`}/><div className="tl-date">{new Date(r.createdAt).toLocaleString("fr-FR",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</div><div className="tl-body">{r.text&&<div><b style={{color:"var(--t1)"}}>CR :</b> {r.text.slice(0,220)}</div>}{r.transcript&&<div style={{marginTop:3}}><b style={{color:"var(--t1)"}}>Dictée :</b> {r.transcript.slice(0,220)}</div>}{!r.text&&!r.transcript&&<i>Audio uniquement.</i>}</div></div>)}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Message Suggester
───────────────────────────────────────────────────────────── */
export function MessageSuggesterTab({doctor,apiKey,provider,model}){
  const[msgType,setMsgType]=useState("sms");
  const[result,setResult]=useState("");
  const[loading,setLoading]=useState(false);
  const[err,setErr]=useState("");
  const generate=async()=>{if(!apiKey)return;setLoading(true);setErr("");setResult("");const labels={sms:"SMS de rappel (max 160 car.)",email:"email de suivi professionnel",rappel:"message de rappel visite"};const prompt=`Rédige un ${labels[msgType]} pour Dr. ${doctor.name} (${doctor.city}) dans le cadre du suivi Fumetil.\nObjectif : ${doctor.nextVisitGoal||"—"}\nFrein : ${doctor.mainObjection||"—"}\nScore : ${doctor.adoptionScore??'N/A'}/100\nRédige uniquement le message, sans commentaire.`;try{const out=await callLLM(prompt,apiKey,provider,model);setResult(out.replace(/^(Voici|Bien sûr)[^:]*/i,"").trim());}catch(e){setErr(e.message);}setLoading(false);};
  return(<div><div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>{[["sms","💬 SMS"],["email","✉️ Email"],["rappel","🔔 Rappel"]].map(([id,lbl])=><button key={id} className={`msg-type-btn${msgType===id?" active":""}`} onClick={()=>{setMsgType(id);setResult("");}}>{lbl}</button>)}</div><button className="btn btn-p" style={{marginBottom:12,width:"100%"}} onClick={generate} disabled={!apiKey||loading}>{loading?<><span className="sp"/> Génération…</>:`⚡ Générer ${msgType}`}</button>{err&&<div className="warn" style={{marginBottom:8}}>⚠️ {err}</div>}{!apiKey&&<div className="fum-insight info">🔑 Configure une clé API.</div>}{result&&<div><div className="msg-output">{result}</div>{msgType==="sms"&&<div className="mini" style={{marginTop:6}}>{result.length} car. {result.length>160?"⚠️":"✅"}</div>}<div style={{display:"flex",gap:8,marginTop:8}}><button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(result)}>📋 Copier</button><button className="btn btn-g" onClick={()=>setResult("")}>🗑️ Effacer</button></div></div>}{!result&&!loading&&<div className="empty" style={{padding:20}}>Sélectionne un type et génère.</div>}</div>);
}

/* ─────────────────────────────────────────────────────────────
  Route Optimizer
───────────────────────────────────────────────────────────── */
export function RouteOptimizerPanel({planState,docById}){
  const allScheduledByCity=useMemo(()=>{const allIds=Object.values(planState?.plan||{}).flat();const unique=[...new Set(allIds)];const map={};unique.forEach(id=>{const d=docById.get(id);if(!d)return;const city=d.city||"Autre";if(!map[city])map[city]=[];map[city].push(d);});Object.keys(map).forEach(city=>{map[city].sort((a,b)=>{const pa=a.potential==="A"?0:a.potential==="B"?1:2,pb=b.potential==="A"?0:b.potential==="B"?1:2;return pa-pb||(b.adoptionScore??0)-(a.adoptionScore??0);});});return map;},[planState,docById]);
  const cities=Object.keys(allScheduledByCity).sort((a,b)=>{const co=c=>CLUSTER.includes(c)?0:1;return co(a)-co(b)||a.localeCompare(b);});
  if(!cities.length)return <div className="empty" style={{padding:20}}>Génère un planning pour voir l'optimisation de tournée.</div>;
  return(<div><div className="fum-insight info" style={{marginBottom:12,fontSize:11}}>📍 {cities.length} villes · {Object.values(allScheduledByCity).flat().length} médecins. Cluster Rabat/Salé/Temara/Kénitra → Mer/Jeu.</div>{cities.map(city=>{const docs=allScheduledByCity[city];return(<div key={city} className="route-city-card"><div className="route-city-hd"><div className="route-city-nm">{CLUSTER.includes(city)?"📍 ":"🏙️ "}{city}</div><div style={{display:"flex",gap:8,alignItems:"center"}}>{CLUSTER.includes(city)&&<span className="soft-badge ok">Cluster · Mer/Jeu</span>}<span className="pill">{docs.length}</span></div></div>{docs.map((d,i)=><div key={d.id} className="route-doc-row"><div className="route-num">#{i+1}</div><div className="route-info"><div className="route-name">{d.name}</div><div className="route-meta">{d.sector||d.activite||"—"} · Pot. {d.potential}</div></div><div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>{d.adoptionScore!=null&&<span style={{fontFamily:"var(--fd)",fontSize:11,fontWeight:800,color:scoreColor(d.adoptionScore)}}>{d.adoptionScore}</span>}<span className={`tag t${d.potential}`}>{d.potential}</span></div></div>)}</div>);})}</div>);
}
