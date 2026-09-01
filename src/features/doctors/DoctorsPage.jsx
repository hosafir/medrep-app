import { useState, useMemo } from "react";
import { Modal } from "../../components/Modal.jsx";
import { DOCS_FALLBACK } from "../../lib/fallbackDoctors.js";
import { importDoctorsFromFile } from "../../lib/importDoctors.js";
import { computePredictiveScore, priorityBadgeClass, scoreColor } from "../../lib/insights.js";
import { normalizeCity, normalizeText, stableSortDocs } from "../../lib/normalize.js";

import { useData } from "../../store/dataContext.js";
import { CONTACT_ROLES, accountTypeInfo } from "../../lib/accounts.js";

export function DoctorsPage({ doctors, setDoctors, activeProduct, products }){
  const[q,setQ]=useState("");
  const[editing,setEditing]=useState(null);
  const[showNew,setShowNew]=useState(false);
  const[importing,setImporting]=useState(false);
  
  const filtered=useMemo(()=>{
    const s=q.trim().toLowerCase();
    if(!s)return doctors;
    return doctors.filter(d=>
      (d.name||"").toLowerCase().includes(s)||
      (d.city||"").toLowerCase().includes(s)||
      (d.potential||"").toLowerCase().includes(s)||
      (d.mainObjection||"").toLowerCase().includes(s)
    );
  },[doctors,q]);
  
  const nextId=useMemo(()=>doctors.reduce((m,d)=>Math.max(m,d.id||0),0)+1,[doctors]);
  
  const upsert=doc=>{
    setDoctors(prev=>{
      const nd={
        ...doc,
        adoptionScore:doc?.adoptionScore??null,
        mainObjection:doc?.mainObjection??"",
        nextVisitGoal:doc?.nextVisitGoal??"",
        priorityLevel:doc?.priorityLevel??"",
        visitFrequency:doc?.visitFrequency||"quarterly",
        product: doc.product || activeProduct,
        preferredDay: doc?.preferredDay ?? null // Prise en compte du jour préféré
      };
      const exists=prev.some(x=>x.id===nd.id);
      return stableSortDocs(exists?prev.map(x=>x.id===nd.id?nd:x):[...prev,nd]);
    });
  };
  
  const remove=id=>{
    if(!confirm("Supprimer ?"))return;
    setDoctors(prev=>prev.filter(x=>x.id!==id));
  };
  
  const exportJSON=()=>{
    const blob=new Blob([JSON.stringify({doctors},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="medrep_doctors.json";a.click();
    URL.revokeObjectURL(url);
  };
  
  const exportCSV=()=>{
    const header=["id","name","city","sector","potential","phone","email","activite","adoptionScore","mainObjection","nextVisitGoal","priorityLevel","visitFrequency","product","preferredDay"];
    const lines=[header.join(",")];
    for(const d of doctors){
      const row=header.map(k=>`"${(d[k]??"").toString().replaceAll('"','""')}"`);
      lines.push(row.join(","));
    }
    const blob=new Blob([lines.join("\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="medrep_doctors.csv";a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport=async file=>{
    if(!file)return;
    setImporting(true);
    try{
      const list=await importDoctorsFromFile(file);
      if(!list.length){alert("Aucun médecin valide.");return;}
      const updatedList = list.map(d => ({...d, product: activeProduct}));
      setDoctors(prev => stableSortDocs([...prev, ...updatedList]));
      alert(`Import OK ✅ (${list.length} médecins importés dans "${activeProduct}")`);
    }catch(e){alert(`Erreur import ❌\n${e.message}`);}
    finally{setImporting(false);}
  };
  
  const { reports: allReports, accounts } = useData();
  const accountById = useMemo(() => new Map(accounts.map(a => [a.id, a])), [accounts]);

  // Helper jour préféré
  const dayLabels = {1: "Lun", 2: "Mar", 3: "Mer", 4: "Jeu", 5: "Ven"};

  return(
    <div className="content">
      <div className="card" style={{marginBottom:12}}>
        <div className="card-t">👨‍⚕️ Médecins <span className="pill">{doctors.length}</span> <span className="pill" style={{borderColor:"rgba(139,92,246,.3)",color:"var(--violet)"}}>{activeProduct}</span></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <input className="fi" placeholder="Recherche…" value={q} onChange={e=>setQ(e.target.value)} style={{flex:1,minWidth:280}}/>
          <button className="btn btn-p" onClick={()=>{setShowNew(true);setEditing({id:nextId,name:"",city:"",sector:"",potential:"B",phone:"",email:"",activite:"Privé",adoptionScore:null,mainObjection:"",nextVisitGoal:"",priorityLevel:"",visitFrequency:"quarterly", product: activeProduct, preferredDay: null});}}>➕ Ajouter</button>
        </div>
        <div className="sep"/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <button className="btn btn-g" onClick={exportJSON}>⬇️ JSON</button>
          <button className="btn btn-g" onClick={exportCSV}>⬇️ CSV</button>
          <label className="btn btn-blue" style={{cursor:"pointer"}}>
            {importing?"Import…":"⬆️ Import"}
            <input type="file" accept=".xlsx,.xls,.csv,.json" style={{display:"none"}} onChange={async e=>{const f=e.target.files?.[0];if(f)await handleImport(f);e.target.value="";}} />
          </label>
          <button className="btn btn-rose" onClick={()=>{if(!confirm("Reset total ?"))return;setDoctors(DOCS_FALLBACK);}}>🧹 Reset</button>
        </div>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ville / Secteur</th>
                <th>Compte</th>
                <th style={{textAlign:'center'}}>Pot.</th>
                <th style={{textAlign:'center'}}>Score</th>
                <th style={{textAlign:'center'}} title="Score prédictif calculé (potentiel, fréquence de visite, freins)">Prédictif</th>
                <th style={{textAlign:'center'}}>Jour Préféré</th> {/* Nouvelle colonne */}
                <th>Frein</th>
                <th style={{textAlign:'center'}}>Prio</th>
                <th style={{textAlign:'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10}><div className="empty">Aucun médecin pour le produit "{activeProduct}".</div></td></tr>
              )}
              {filtered.map(d => {
                const pred = computePredictiveScore(d, allReports);
                return (
                  <tr key={d.id}>
                    <td style={{fontWeight:700}}>{d.name}</td>
                    <td>{d.city} {d.sector ? <span className="mini" style={{opacity:0.7}}>· {d.sector}</span> : ""}</td>
                    <td>{d.accountId && accountById.get(d.accountId)
                      ? <span className="pill">{accountTypeInfo(accountById.get(d.accountId).type).ic} {accountById.get(d.accountId).name}</span>
                      : <span className="mini" style={{opacity:.5}}>—</span>}</td>
                    <td style={{textAlign:'center'}}><span className={`tag t${d.potential||"C"}`}>{d.potential||"C"}</span></td>
                    <td style={{textAlign:'center', fontWeight:700, color:scoreColor(d.adoptionScore)}}>
                      {d.adoptionScore==null?"—":`${d.adoptionScore}`}
                    </td>
                    <td style={{textAlign:'center', fontWeight:700, color:scoreColor(pred)}} title="Score prédictif">{pred}</td>
                    {/* Affichage Jour Préféré */}
                    <td style={{textAlign:'center'}}>
                      {d.preferredDay ? <span className="soft-badge ok">{dayLabels[d.preferredDay]}</span> : <span className="mini">—</span>}
                    </td>
                    <td style={{maxWidth:140, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={d.mainObjection}>{d.mainObjection||"—"}</td>
                    <td style={{textAlign:'center'}}><span className={`tag ${priorityBadgeClass(d.priorityLevel)}`}>{d.priorityLevel||"—"}</span></td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-g" style={{padding:"4px 8px"}} onClick={()=>{setShowNew(false);setEditing({...d});}}>✏️</button>
                      <button className="btn btn-rose" style={{padding:"4px 8px", marginLeft:4}} onClick={()=>remove(d.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing&&(
        <Modal title={showNew?"Ajouter un médecin":"Éditer médecin"} subtitle="Configurez les détails et le jour de visite préféré" onClose={()=>setEditing(null)}
          actions={[
            {label:"Annuler",kind:"g",onClick:()=>setEditing(null)},
            {label:"Enregistrer",kind:"p",onClick:()=>{
              if(!editing.name?.trim())return alert("Nom requis.");
              if(!editing.city?.trim())return alert("Ville requise.");
              const p=(editing.potential||"B").toString().toUpperCase().slice(0,1);
              upsert({
                ...editing,
                city:normalizeCity(editing.city),
                potential:["A","B","C"].includes(p)?p:"B",
                adoptionScore:editing.adoptionScore==null?null:Math.max(0,Math.min(100,Number(editing.adoptionScore))),
                mainObjection:normalizeText(editing.mainObjection),
                nextVisitGoal:normalizeText(editing.nextVisitGoal),
                priorityLevel:(editing.priorityLevel||"").toLowerCase(),
                preferredDay: editing.preferredDay ? parseInt(editing.preferredDay) : null
              });
              setEditing(null);
            }}
          ]}>
          <div className="grid2">
            <div className="fg"><label className="fl">Spécialité</label><input className="fi" placeholder="Cardiologie..." value={editing.specialite || ""} onChange={e=>setEditing(p => ({...p, specialite: e.target.value}))}/></div>
            <div className="fg"><label className="fl">Nom</label><input className="fi" value={editing.name} onChange={e=>setEditing(p=>({...p,name:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Ville</label><input className="fi" value={editing.city} onChange={e=>setEditing(p=>({...p,city:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Secteur / Clinique</label><input className="fi" placeholder="Ex: Clinique Marjane" value={editing.sector || ""} onChange={e=>setEditing(p=>({...p,sector:e.target.value}))}/></div>
            <div className="fg"><label className="fl">Compte (établissement)</label>
              <select className="fs" value={editing.accountId || ""} onChange={e=>setEditing(p=>({...p, accountId: e.target.value || null}))}>
                <option value="">— Aucun —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}{a.city ? ` · ${a.city}` : ""}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Rôle dans le compte</label>
              <select className="fs" value={editing.role || "prescripteur"} onChange={e=>setEditing(p=>({...p, role: e.target.value}))}>
                {CONTACT_ROLES.map(r => <option key={r.id} value={r.id}>{r.ic} {r.label}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Influence (1-5)</label>
              <select className="fs" value={editing.influence || ""} onChange={e=>setEditing(p=>({...p, influence: e.target.value ? Number(e.target.value) : null}))}>
                <option value="">— Non qualifié —</option>
                {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Soutien produit (1-5)</label>
              <select className="fs" value={editing.support || ""} onChange={e=>setEditing(p=>({...p, support: e.target.value ? Number(e.target.value) : null}))}>
                <option value="">— Non qualifié —</option>
                {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="fg"><label className="fl">Potentiel</label><select className="fs" value={editing.potential||"B"} onChange={e=>setEditing(p=>({...p,potential:e.target.value}))}><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></div>
            
            {/* NOUVEAU : Sélecteur Jour Préféré */}
            <div className="fg">
              <label className="fl">Jour de visite préféré</label>
              <select className="fs" value={editing.preferredDay || ""} onChange={e=>setEditing(p=>({...p, preferredDay: e.target.value ? parseInt(e.target.value) : null}))}>
                <option value="">Aucune préférence</option>
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
              </select>
              <div className="mini" style={{marginTop:2}}>L'algo priorisera ce jour.</div>
            </div>

            <div className="fg"><label className="fl">Produit</label>
              <select className="fs" value={editing.product || activeProduct} onChange={e=>setEditing(p=>({...p,product:e.target.value}))}>
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            
            <div className="fg"><label className="fl">Score (0-100)</label><input className="fi" type="number" min={0} max={100} value={editing.adoptionScore??""} onChange={e=>setEditing(p=>({...p,adoptionScore:e.target.value===""?null:Math.max(0,Math.min(100,parseInt(e.target.value,10)||0))}))}/></div>
            <div className="fg" style={{gridColumn:"1 / -1"}}><label className="fl">Frein principal</label><textarea className="fta" value={editing.mainObjection||""} onChange={e=>setEditing(p=>({...p,mainObjection:e.target.value}))}/></div>
            <div className="fg" style={{gridColumn:"1 / -1"}}><label className="fl">Objectif next visit</label><textarea className="fta" value={editing.nextVisitGoal||""} onChange={e=>setEditing(p=>({...p,nextVisitGoal:e.target.value}))}/></div>
          </div>
        </Modal>
      )}
    </div>
  );
}
