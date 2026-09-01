import { useMemo } from "react";
import { OpportunityPanel, WeeklyPriorityPanel } from "../../components/Panels.jsx";
import { Dashboard } from "../dashboard/Dashboard.jsx";
import { MFR, monthKey } from "../../lib/dates.js";
import { computePredictiveScore, scoreColor } from "../../lib/insights.js";

import { useData } from "../../store/dataContext.js";
import {
  elapsedRatioForPeriod, filterSales, formatMAD, groupBy, growth, lastPeriods,
  objectiveProgress, periodLabel, sumSales,
} from "../../lib/sales.js";

export function CommercialDashboard({doctors,setPage,apiKey,provider,model, activeProduct}){
  const { reports, monthlyTarget, sales, objectives, accounts } = useData();
  const totalReports=useMemo(()=>Object.values(reports).reduce((s,arr)=>s+(arr?.length||0),0),[reports]);
  const totalWithReports=useMemo(()=>Object.keys(reports).filter(id=>reports[id]?.length>0).length,[reports]);
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76);
  const aConvertir=evaluated.filter(d=>d.adoptionScore>=40&&d.adoptionScore<76);
  const convRate=doctors.length?Math.round((chauds.length/doctors.length)*100):0;
  const monthlyData=useMemo(()=>{const now=new Date();return Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-(5-i),1);const key=monthKey(d.getFullYear(),d.getMonth());const cnt=Object.values(reports).reduce((s,arr)=>s+(arr||[]).filter(r=>r.createdAt?.startsWith(key)).length,0);return{label:MFR[d.getMonth()],value:cnt};});},[reports]);
  const maxM=Math.max(...monthlyData.map(m=>m.value),1);
  const cityScores=useMemo(()=>{const map={};doctors.forEach(d=>{if(!map[d.city])map[d.city]={total:0,count:0};if(d.adoptionScore!=null){map[d.city].total+=d.adoptionScore;map[d.city].count++;}});return Object.entries(map).filter(([,v])=>v.count>0).map(([city,v])=>({city,avg:Math.round(v.total/v.count)})).sort((a,b)=>b.avg-a.avg);},[doctors]);
  const objections=useMemo(()=>{const map={};doctors.forEach(d=>{if(d.mainObjection){const k=d.mainObjection.slice(0,50);map[k]=(map[k]||0)+1;}});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);},[doctors]);
  const predictiveScores=useMemo(()=>doctors.map(d=>computePredictiveScore(d,reports)),[doctors,reports]);
  const avgPred=predictiveScores.length?Math.round(predictiveScores.reduce((s,v)=>s+v,0)/predictiveScores.length):0;

  // NOUVEAU : Objectif Mensuel
  const target = monthlyTarget || 60;
  const progressPct = Math.min(100, Math.round((totalReports / target) * 100));
  
  // Performance commerciale (ventes importées)
  const salesBlock = useMemo(() => {
    if (!sales.length) return null;
    const periods = lastPeriods(6);
    const current = periods[periods.length - 1];
    const value = sumSales(filterSales(sales, { period: current }));
    const prev = sumSales(filterSales(sales, { period: periods[periods.length - 2] }));
    const globalObj = objectives.find(o => o.scope === "global" && o.period === current)
      || objectives.find(o => o.scope === "global" && o.period === current.slice(0, 4));
    const progress = globalObj
      ? objectiveProgress(globalObj, sales, { elapsedRatio: elapsedRatioForPeriod(globalObj.period) })
      : null;
    const top = groupBy(filterSales(sales, { periods }), "accountId").slice(0, 5).map(r => ({
      ...r,
      label: accounts.find(a => a.id === r.key)?.name
        || sales.find(s => (s.accountId || "—") === r.key)?.accountName
        || "Non rattaché",
    }));
    return { current, value, growth: growth(value, prev), progress, top };
  }, [sales, objectives, accounts]);

  // NOUVEAU : Export PDF
  const handleExportPDF = () => window.print();

  return(
    <div className="content">
      {/* Bouton Export PDF */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-g" onClick={handleExportPDF}>📄 Exporter en PDF</button>
      </div>

      {/* NOUVEAU : Barre de Progression Objectif */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>🎯 Objectif Mensuel</span>
          <span style={{ fontFamily: "var(--fd)" }}>{totalReports} / {target} visites</span>
        </div>
        <div style={{ background: "var(--navy4)", borderRadius: 10, height: 12, overflow: 'hidden' }}>
          <div style={{ 
            width: `${progressPct}%`, 
            height: '100%', 
            background: progressPct >= 100 ? "var(--teal)" : progressPct > 50 ? "var(--amber)" : "var(--rose)", 
            transition: "width 0.5s ease",
            boxShadow: progressPct >= 100 ? "0 0 10px var(--teal)" : "none"
          }} />
        </div>
        {progressPct >= 100 && <div style={{ textAlign: 'right', color: "var(--teal)", fontSize: 11, marginTop: 4 }}>🏆 Objectif atteint !</div>}
      </div>

      {salesBlock && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-t">💰 Performance commerciale — {periodLabel(salesBlock.current)}</div>
          <div className="g2">
            <div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--fd)", fontSize: 26, fontWeight: 800 }}>{formatMAD(salesBlock.value)}</span>
                {salesBlock.growth != null && (
                  <span style={{ color: salesBlock.growth >= 0 ? "var(--teal)" : "var(--rose)", fontSize: 12, fontWeight: 700 }}>
                    {salesBlock.growth > 0 ? "+" : ""}{salesBlock.growth}% vs mois précédent
                  </span>
                )}
              </div>
              {salesBlock.progress ? (
                <div style={{ marginTop: 10 }}>
                  <div className="mini" style={{ margin: "0 0 4px" }}>
                    Objectif : {formatMAD(salesBlock.progress.target)} — atteint à <b>{salesBlock.progress.rate}%</b>
                    {salesBlock.progress.projectedRate != null && ` (projection ${salesBlock.progress.projectedRate}%)`}
                  </div>
                  <div style={{ background: "var(--navy4)", borderRadius: 10, height: 10, overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(salesBlock.progress.rate || 0, 100)}%`, height: "100%",
                      background: salesBlock.progress.onTrack ? "var(--teal)" : "var(--amber)", transition: "width .6s ease",
                    }} />
                  </div>
                </div>
              ) : (
                <div className="mini" style={{ marginTop: 8 }}>Aucun objectif global défini pour cette période.</div>
              )}
            </div>
            <div>
              <div className="card-t" style={{ fontSize: 12 }}>Top comptes (6 mois)</div>
              {salesBlock.top.map(t => (
                <div key={t.key} className="perf-bar-row">
                  <div className="perf-lbl" style={{ fontWeight: 600 }}>{t.label}</div>
                  <div style={{ marginLeft: "auto", fontFamily: "var(--fd)", fontSize: 11 }}>{formatMAD(t.value)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="sep" />
          <button className="btn btn-p" style={{ fontSize: 11 }} onClick={() => setPage("sales")}>💰 Ventes &amp; objectifs →</button>
        </div>
      )}

      <div className="cd-kpi-grid">
        <div className="kpi" style={{"--ac":"var(--teal)"}}><div className="kpi-lbl">Visites totales</div><div className="kpi-val">{totalReports}</div><div className="kpi-d" style={{color:"var(--teal)"}}>comptes-rendus</div><div className="kpi-ic">📋</div></div>
        <div className="kpi" style={{"--ac":"var(--rose)"}}><div className="kpi-lbl">Prescripteurs</div><div className="kpi-val">{chauds.length}</div><div className="kpi-d" style={{color:"var(--rose)"}}>score ≥ 76</div><div className="kpi-ic">🔥</div></div>
        <div className="kpi" style={{"--ac":"var(--amber)"}}><div className="kpi-lbl">À convertir</div><div className="kpi-val">{aConvertir.length}</div><div className="kpi-d" style={{color:"var(--amber)"}}>score 40-75</div><div className="kpi-ic">🌡️</div></div>
        <div className="kpi" style={{"--ac":"var(--violet)"}}><div className="kpi-lbl">Taux conversion</div><div className="kpi-val">{convRate}%</div><div className="kpi-d" style={{color:"var(--violet)"}}>médecins actifs</div><div className="kpi-ic">📈</div></div>
      </div>
      <div className="cd-section">
        <div className="card"><div className="card-t">📅 Activité mensuelle</div>{monthlyData.map((m,i)=><div key={i} className="perf-bar-row"><div className="perf-lbl">{m.label}</div><div style={{flex:1,background:"var(--navy4)",borderRadius:4,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:"var(--teal)",width:`${(m.value/maxM)*100}%`,transition:"width 1s ease"}}/></div><div className="perf-val" style={{color:"var(--teal)"}}>{m.value}</div></div>)}<div className="sep"/><div style={{display:"flex",gap:12}}><div style={{flex:1}}><div className="kpi-lbl">Total CR</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800,color:"var(--teal)"}}>{totalReports}</div></div><div style={{flex:1}}><div className="kpi-lbl">Médecins actifs</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:800}}>{totalWithReports}</div></div></div></div>
        <div className="card"><div className="card-t">🗺️ Score moyen par ville</div>{cityScores.length===0?<div className="empty" style={{padding:20}}>Lance les analyses IA.</div>:cityScores.map((c,i)=><div key={i} className="perf-bar-row"><div className="perf-lbl" style={{fontWeight:600}}>{c.city}</div><div style={{flex:1,background:"var(--navy4)",borderRadius:4,height:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:4,background:scoreColor(c.avg),width:`${c.avg}%`,transition:"width 1.2s ease"}}/></div><div className="perf-val" style={{color:scoreColor(c.avg)}}>{c.avg}</div></div>)}</div>
        <div className="card"><div className="card-t">🚧 Freins {activeProduct || "Produit"}</div>{objections.length===0?<div className="empty" style={{padding:16}}>Aucun frein extrait.</div>:objections.map(([obj,cnt],i)=><div key={i} className="perf-bar-row"><div style={{flex:1,fontSize:11}}>{obj.length>45?obj.slice(0,45)+"…":obj}</div><span style={{fontFamily:"var(--fd)",fontSize:11,fontWeight:800,color:"var(--rose)"}}>{cnt}x</span></div>)}<div className="sep"/><div className="card-t" style={{marginBottom:8}}>📊 Score prédictif moyen</div><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{fontFamily:"var(--fd)",fontSize:32,fontWeight:800,color:scoreColor(avgPred)}}>{avgPred}</div><div><div style={{fontSize:11,color:"var(--t2)"}}>Score moyen calculé</div><div style={{fontSize:10,color:"var(--t3)"}}>{doctors.length} médecins</div></div></div></div>
      </div>
      <div className="cd-section-2">
        <div className="card"><div className="card-t">🎯 Opportunités détectées</div><OpportunityPanel doctors={doctors} reports={reports} setPage={setPage}/><div className="sep"/><button className="btn btn-p" style={{fontSize:11}} onClick={()=>setPage("fumetil")}>📊 Dashboard {activeProduct || "Produit"} →</button></div>
        <div className="card"><div className="card-t">🏆 Priorisation IA · Semaine</div><WeeklyPriorityPanel doctors={doctors} apiKey={apiKey} provider={provider} model={model}/></div>
      </div>
    </div>
  );
}
