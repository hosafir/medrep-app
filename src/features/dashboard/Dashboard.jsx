import { useMemo } from "react";
import { FieldAlertsPanel } from "../../components/FieldAlertsPanel.jsx";
import { OpportunityPanel, WeeklyPriorityPanel } from "../../components/Panels.jsx";
import { Assistant } from "../assistant/Assistant.jsx";
import { loadJSON } from "../../lib/storage.js";
import { useData } from "../../store/dataContext.js";

export function Dashboard({doctors,setPage,hasApi,provider, activeProduct}){
  const { reports } = useData();
  const cntA=doctors.filter(d=>d.potential==="A").length;
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76).length;
  const aConvertir=evaluated.filter(d=>d.adoptionScore>=40&&d.adoptionScore<76).length;
  const totalReports=useMemo(()=>Object.values(reports).reduce((s,arr)=>s+(arr?.length||0),0),[reports]);
  const apiKey=hasApi?loadJSON("medrep_apiKey",""):"";
  
  return(
    <div className="content">
      <div className="kpi-grid">
        <div className="kpi" style={{"--ac":"var(--teal)"}}><div className="kpi-lbl">Médecins</div><div className="kpi-val">{doctors.length}</div><div className="kpi-d" style={{color:"var(--teal)"}}>base terrain</div><div className="kpi-ic">🧠</div></div>
        <div className="kpi" style={{"--ac":"var(--violet)"}}><div className="kpi-lbl">Potentiel A</div><div className="kpi-val">{cntA}</div><div className="kpi-d" style={{color:"var(--teal)"}}>{doctors.length?Math.round((cntA/doctors.length)*100):0}%</div><div className="kpi-ic">⭐</div></div>
        <div className="kpi" style={{"--ac":"var(--rose)"}}><div className="kpi-lbl">Prescripteurs 🔥</div><div className="kpi-val">{chauds}</div><div className="kpi-d" style={{color:"var(--rose)"}}>Score ≥ 76</div><div className="kpi-ic">🔥</div></div>
        <div className="kpi" style={{"--ac":"var(--amber)"}}><div className="kpi-lbl">À convertir 🟡</div><div className="kpi-val">{aConvertir.length}</div><div className="kpi-d" style={{color:"var(--amber)"}}>Score 40–75</div><div className="kpi-ic">🎯</div></div>
      </div>
      
      {/* ALERES TERRAIN */}
      <div className="card" style={{marginBottom:14, borderLeft:"4px solid var(--rose)"}}>
        <div className="card-t">
          🚨 Alertes Terrain
          <span className="pill" style={{borderColor:"rgba(244,63,94,.35)",color:"var(--rose)",marginLeft:8}}>Priorité</span>
        </div>
        <FieldAlertsPanel doctors={doctors} reports={reports} setPage={setPage}/>
      </div>

      <div className="g2" style={{marginBottom:14}}>
        <div className="card"><div className="card-t">Accès rapide</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn btn-p" onClick={()=>setPage("commercial")}>📈 Commercial</button><button className="btn btn-p" onClick={()=>setPage("fumetil")}>📊 {activeProduct || "CRM"}</button><button className="btn btn-g" onClick={()=>setPage("planning")}>📅 Planning</button><button className="btn btn-blue" onClick={()=>setPage("reports")}>📝 Comptes-rendus</button></div><div className="mini" style={{marginTop:12}}>{totalReports} CR enregistrés · Tout sauvegardé automatiquement.</div></div>
        <div className="card"><div className="card-t">Assistant IA {hasApi?<span className="pill" style={{borderColor:(provider?.color||"var(--teal)")+"55"}}><span style={{color:provider?.color}}>{provider?.icon}</span> {provider?.name}</span>:<span className="pill" style={{borderColor:"rgba(244,63,94,.35)",color:"var(--rose)"}}>OFF</span>}</div>{hasApi?<div className="ok">✅ IA active.</div>:<div className="warn">⚠️ Configure une clé API.</div>}<div style={{marginTop:12,display:"flex",gap:8}}><button className="btn btn-g" onClick={()=>setPage("settings")}>⚙️ Paramètres</button><button className="btn btn-blue" onClick={()=>setPage("assistant")}>✦ Assistant terrain</button></div></div>
      </div>
      <div className="g2">
        <div className="card"><div className="card-t">🎯 Opportunités détectées</div><OpportunityPanel doctors={doctors} reports={reports} setPage={setPage}/></div>
        <div className="card"><div className="card-t">🏆 Priorisation IA · Semaine</div><WeeklyPriorityPanel doctors={doctors} apiKey={apiKey} provider={provider} model={null}/></div>
      </div>
    </div>
  );
}
