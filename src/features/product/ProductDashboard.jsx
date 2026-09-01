import { useMemo } from "react";
import { AnimBar, DonutChart, ScoreGauge } from "../../components/Charts.jsx";
import { Dashboard } from "../dashboard/Dashboard.jsx";
import { scoreColor } from "../../lib/insights.js";

export function FumetilDashboard({doctors,setPage, activeProduct}){
  const evaluated=doctors.filter(d=>d.adoptionScore!=null);
  const chauds=evaluated.filter(d=>d.adoptionScore>=76);
  const tiedesArr=evaluated.filter(d=>d.adoptionScore>=26&&d.adoptionScore<76);
  const froids=evaluated.filter(d=>d.adoptionScore<26);
  const nonEvalues=doctors.filter(d=>d.adoptionScore==null);
  const total=doctors.length||1;
  const avgScore=evaluated.length?Math.round(evaluated.reduce((s,d)=>s+d.adoptionScore,0)/evaluated.length):null;
  const cityScores=useMemo(()=>{const map={};for(const d of evaluated){if(!map[d.city])map[d.city]={sum:0,count:0};map[d.city].sum+=d.adoptionScore;map[d.city].count++;}return Object.entries(map).map(([city,{sum,count}])=>({city,avg:Math.round(sum/count),count})).sort((a,b)=>b.avg-a.avg);},[evaluated]);
  const objections=useMemo(()=>{const freq={};for(const d of doctors){const obj=(d.mainObjection||"").trim();if(!obj)continue;const key=obj.toLowerCase().slice(0,80);if(!freq[key])freq[key]={text:obj,count:0};freq[key].count++;}return Object.values(freq).sort((a,b)=>b.count-a.count).slice(0,7);},[doctors]);
  const highPrio=useMemo(()=>doctors.filter(d=>d.priorityLevel==="haute").sort((a,b)=>(b.adoptionScore??-1)-(a.adoptionScore??-1)).slice(0,6),[doctors]);
  const top5=useMemo(()=>[...doctors].filter(d=>d.priorityLevel||d.adoptionScore!=null).sort((a,b)=>{const po={haute:0,moyenne:1,basse:2,"":3};const pd=(po[a.priorityLevel]??3)-(po[b.priorityLevel]??3);return pd||((b.adoptionScore??-1)-(a.adoptionScore??-1));}).slice(0,5),[doctors]);
  const insights=useMemo(()=>{const list=[];if(chauds.length>=total*0.3)list.push({type:"good",msg:`🔥 ${chauds.length} médecins chauds (${Math.round(chauds.length/total*100)}%) — pipeline solide !`});if(froids.length>=total*0.4)list.push({type:"warn",msg:`❄️ ${froids.length} médecins froids — stratégie de réchauffement requise.`});if(nonEvalues.length>0)list.push({type:"info",msg:`📋 ${nonEvalues.length} médecins sans score IA — lance l'analyse.`});if(objections.length>0)list.push({type:"warn",msg:`⚠️ Frein #1 : "${objections[0]?.text?.slice(0,55)}" (${objections[0]?.count}x).`});if(cityScores.length>0)list.push({type:"good",msg:`📍 Ville la plus avancée : ${cityScores[0].city} (score moyen ${cityScores[0].avg}/100).`});return list;},[chauds,froids,nonEvalues,objections,cityScores,total]);
  const donutData=[{label:"Chauds",value:chauds.length,color:"var(--rose)"},{label:"Tièdes",value:tiedesArr.length,color:"var(--amber)"},{label:"Froids",value:froids.length,color:"var(--blue)"},{label:"N/A",value:nonEvalues.length,color:"var(--t3)"}];
  const maxObj=objections[0]?.count||1;
  const rankClass=i=>i===0?"gold":i===1?"silver":i===2?"bronze":"";
  const initials=name=>{const p=name.replace(/^Dr\.?\s*/i,"").split(" ");return((p[0]?.[0]||"")+(p[1]?.[0]||"")).toUpperCase();};
  return(
    <div className="content">
      <div className="fum-hero">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
          <div><div className="fum-hero-title">📊 Dashboard {activeProduct || "Produit"}</div><div className="fum-hero-sub">Suivi commercial · {doctors.length} médecins · {evaluated.length} évalués IA</div></div>
          <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={()=>setPage("reports")}>📝 Analyser</button><button className="btn btn-g" onClick={()=>setPage("doctors")}>👨‍⚕️ Médecins</button></div>
        </div>
      </div>
      <div className="temp-grid">
        {[{cls:"chaud",ic:"🔥",val:chauds.length,lbl:"Chauds",sub:"Score ≥ 76/100",pct:chauds.length/total*100},{cls:"tiede",ic:"🌡️",val:tiedesArr.length,lbl:"Tièdes",sub:"Score 26–75/100",pct:tiedesArr.length/total*100},{cls:"froid",ic:"❄️",val:froids.length,lbl:"Froids",sub:"Score < 26/100",pct:froids.length/total*100},{cls:"nevalue",ic:"📋",val:nonEvalues.length,lbl:"Non évalués",sub:"Analyse IA requise",pct:nonEvalues.length/total*100}].map(t=>(
          <div key={t.cls} className={`temp-card ${t.cls}`}><span className="temp-ic">{t.ic}</span><div className="temp-val anim-in">{t.val}</div><div className="temp-lbl">{t.lbl}</div><div className="temp-sub">{t.sub}</div><div className={`temp-bar ${t.cls}`} style={{width:`${t.pct}%`}}/></div>
        ))}
      </div>
      <div className="fum-3col">
        <div className="card">
          <div className="card-t">📍 Score moyen par ville</div>
          {cityScores.length===0?<div className="empty" style={{padding:24}}>Lance les analyses IA.</div>:cityScores.map((c,i)=>(
            <div key={c.city} className="city-row"><div className="city-dot" style={{background:scoreColor(c.avg)}}/><div className="city-name">{c.city}</div><AnimBar pct={c.avg} color={scoreColor(c.avg)} delay={i*80}/><div className="city-score-val" style={{color:scoreColor(c.avg)}}>{c.avg}</div><div style={{fontSize:10,color:"var(--t3)",minWidth:28}}>/{c.count}</div></div>
          ))}
        </div>
        <div className="card">
          <div className="card-t">🎯 Score moyen global</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <ScoreGauge score={avgScore} size={160}/>
            <div style={{display:"flex",alignItems:"center",gap:20}}>
              <DonutChart data={donutData} size={100}/>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {donutData.map(d=><div key={d.label} style={{display:"flex",alignItems:"center",gap:8,fontSize:11}}><div style={{width:10,height:10,borderRadius:3,background:d.color,flexShrink:0}}/><span style={{color:"var(--t2)"}}>{d.label}</span><span style={{marginLeft:"auto",fontFamily:"var(--fd)",fontWeight:800,color:d.color}}>{d.value}</span></div>)}
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-t">🚧 Top objections détectées</div>
          {objections.length===0?<div className="empty" style={{padding:24}}>Aucun frein enregistré.</div>:objections.map((o,i)=>(
            <div key={i} className="obj-row"><div className="obj-rank">#{i+1}</div><div className="obj-text">{o.text.length>55?o.text.slice(0,55)+"…":o.text}</div><div className="obj-bar-wrap"><div className="obj-bar-fill" style={{width:`${(o.count/maxObj)*100}%`}}/></div><div className="obj-cnt" style={{color:"var(--rose)"}}>{o.count}x</div></div>
          ))}
        </div>
      </div>
      <div className="g2" style={{marginBottom:16}}>
        <div className="card">
          <div className="card-t">💡 Insights automatiques</div>
          {insights.length===0?<div className="empty" style={{padding:20}}>Analyse les CR pour générer des insights.</div>:insights.map((ins,i)=><div key={i} className={`fum-insight ${ins.type}`}>{ins.msg}</div>)}
          <div className="sep"/>
          <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={()=>setPage("reports")}>⚡ Lancer analyses IA</button><button className="btn btn-g" onClick={()=>setPage("planning")}>📅 Planning</button></div>
        </div>
        <div className="card">
          <div className="card-t">🏆 Priorités hautes <span className="pill" style={{borderColor:"rgba(0,212,170,.3)",color:"var(--teal)"}}>{highPrio.length}</span></div>
          {highPrio.length===0?<div className="empty" style={{padding:20}}>Aucun médecin "haute priorité".</div>:highPrio.map(d=>(
            <div key={d.id} className="prio-row haute"><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--teal),#00a884)",color:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{initials(d.name)}</div><div style={{flex:1,minWidth:0}}><div className="prio-name">{d.name}</div><div className="prio-city">{d.city}{d.sector?` · ${d.sector}`:""}</div></div><div style={{display:"flex",gap:6,alignItems:"center"}}><span className={`tag t${d.potential||"C"}`}>{d.potential}</span>{d.adoptionScore!=null&&<span style={{fontFamily:"var(--fd)",fontSize:12,fontWeight:800,color:scoreColor(d.adoptionScore)}}>{d.adoptionScore}</span>}</div></div>
          ))}
        </div>
      </div>
      <div className="card" style={{marginBottom:16}}>
        <div className="card-t">🥇 Top 5 médecins à prioriser cette semaine</div>
        {top5.length===0?<div className="empty" style={{padding:24}}>Lance l'analyse IA.</div>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
            {top5.map((d,i)=>(
              <div key={d.id} className="top5-item"><div className={`top5-rank ${rankClass(i)}`}>#{i+1}</div><div className="top5-info"><div className="top5-name">{d.name}</div><div className="top5-meta">{d.city}{d.sector?` · ${d.sector}`:""}</div>{d.nextVisitGoal&&<div style={{fontSize:10,color:"var(--teal)",marginTop:4}}>🎯 {d.nextVisitGoal.slice(0,70)}</div>}</div>
              <svg width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--navy4)" strokeWidth="4"/><circle cx="22" cy="22" r="18" fill="none" stroke={scoreColor(d.adoptionScore)} strokeWidth="4" strokeDasharray={`${((d.adoptionScore??0)/100)*113} 113`} strokeDashoffset="28" strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/><text x="22" y="26" textAnchor="middle" fontFamily="Syne,sans-serif" fontSize="11" fontWeight="800" fill={scoreColor(d.adoptionScore)}>{d.adoptionScore??"?"}</text></svg></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
