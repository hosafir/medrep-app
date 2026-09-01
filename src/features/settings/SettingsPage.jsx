import { useState } from "react";
import { callLLM, detectProvider } from "../../lib/ai.js";
import { exportBackup, idbClearAll, importBackup } from "../../lib/storage.js";

export function SettingsPage({apiKey,setApiKey,model,setModel, products, addProduct, deleteProduct, activeProduct, monthlyTarget, setMonthlyTarget}){
  const[draft,setDraft]=useState(apiKey||"");
  const[testing,setTesting]=useState(false);
  const[testResult,setTestResult]=useState(null);
  const[manualProvider,setManualProvider]=useState(null);
  
  // Infos utilisateur
  const[userSpecialty,setUserSpecialty]=useState(()=>localStorage.getItem("medrep_user_specialty")||"");
  const[userProduct,setUserProduct]=useState(()=>localStorage.getItem("medrep_user_product")||"");
  

  const activeProvider=manualProvider||detectProvider(draft);
  const testKey=async()=>{const key=draft.trim();if(!key)return;setTesting(true);setTestResult(null);try{const p=activeProvider||detectProvider(key);if(!p)throw new Error("Provider non reconnu.");const m=model||p.defaultModel;await callLLM("Réponds uniquement par: OK",key,p,m,"Tu réponds seulement OK.");setTestResult({ok:true,msg:`✓ Connexion ${p.name} réussie`});setApiKey(key);setModel(p.defaultModel);}catch(e){setTestResult({ok:false,msg:`✗ ${e.message}`});}setTesting(false);};
  const save=()=>{const key=draft.trim();const p=activeProvider||detectProvider(key);setApiKey(key);if(p){setModel(p.defaultModel);}setTestResult({ok:true,msg:"✓ Sauvegardé."});};

  const saveProfile=()=>{
    localStorage.setItem("medrep_user_specialty", userSpecialty);
    localStorage.setItem("medrep_user_product", userProduct);
    setTestResult({ok:true,msg:"✓ Profil et objectifs mis à jour."});
  };

  const[includeAudio,setIncludeAudio]=useState(true);
  
  return(
    <div className="content" style={{maxWidth:900}}>
      
      {/* Section Profil Utilisateur */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">👤 Mon Profil Délégué</div>
        <div className="mini" style={{marginBottom:10}}>Ces informations aident l'IA à personnaliser ses réponses.</div>
        <div className="grid2">
          <div className="fg">
            <label className="fl">Spécialité Médicale</label>
            <input className="fi" placeholder="Ex: Cardiologie, Neurologie..." value={userSpecialty} onChange={e=>setUserSpecialty(e.target.value)}/>
          </div>
          <div className="fg">
            <label className="fl">Produit Principal</label>
            <input className="fi" placeholder="Ex: Fumetil..." value={userProduct} onChange={e=>setUserProduct(e.target.value)}/>
          </div>
          {/* NOUVEAU : Champ Objectif */}
          <div className="fg" style={{maxWidth: 150}}>
            <label className="fl">Objectif visites / mois</label>
            <input className="fi" type="number" min="1" value={monthlyTarget} onChange={e=>setMonthlyTarget(parseInt(e.target.value||"0",10))}/>
          </div>
        </div>
        <div style={{marginTop:10}}><button className="btn btn-p" onClick={saveProfile}>💾 Sauvegarder le profil</button></div>
      </div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">🔑 Clé API</div>
        <div className="mini" style={{marginBottom:10}}>Colle ta clé (Gemini → AIza…). Stockée localement.</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input className="fi" type="password" placeholder="AIzaSy… / sk-…" value={draft} onChange={e=>{setDraft(e.target.value);setManualProvider(null);setTestResult(null);}} style={{flex:1,fontFamily:"monospace"}}/>
          <button className="btn btn-blue" onClick={testKey} disabled={testing||!draft.trim()}>{testing?<><span className="sp" style={{borderTopColor:"var(--blue)"}}/> Test…</>:"Tester"}</button>
          <button className="btn btn-p" onClick={save} disabled={!draft.trim()}>Sauvegarder</button>
        </div>
        {testResult&&<div style={{marginTop:10,padding:"9px 14px",borderRadius:10,fontSize:12,background:testResult.ok?"rgba(0,212,170,.1)":"rgba(244,63,94,.1)",color:testResult.ok?"var(--teal)":"var(--rose)",border:`1px solid ${testResult.ok?"rgba(0,212,170,.2)":"rgba(244,63,94,.2)"}`}}>{testResult.msg}</div>}
      </div>
      
      {activeProvider&&<div className="card" style={{marginBottom:14}}><div className="card-t" style={{color:activeProvider.color}}>{activeProvider.icon} Modèle ({activeProvider.name})</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{activeProvider.models.map(m=><button key={m} className={`btn ${model===m?"btn-p":"btn-g"}`} style={model===m?{background:activeProvider.color}:{}} onClick={()=>setModel(m)}>{m}</button>)}</div></div>}
      
      <div className="card"><div className="card-t">💾 Backup</div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><label className="pill" style={{cursor:"pointer"}}><input type="checkbox" checked={includeAudio} onChange={e=>setIncludeAudio(e.target.checked)} style={{accentColor:"#00d4aa"}}/> Inclure audio</label><button className="btn btn-p" onClick={()=>exportBackup({includeAudio})}>⬇️ Exporter</button><label className="btn btn-blue" style={{cursor:"pointer"}}>⬆️ Importer<input type="file" accept="application/json" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)importBackup(f,{includeAudio});e.target.value="";}} /></label><button className="btn btn-rose" onClick={async()=>{if(!confirm("Reset ?"))return;const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith("medrep_"))keys.push(k);}keys.forEach(k=>localStorage.removeItem(k));try{await idbClearAll();}catch{ /* import annulé ou fichier invalide */ }alert("Réinitialisé. Recharge la page.");}}>🧨 Reset</button></div><div className="warn" style={{marginTop:12}}>⚠️ Tes données restent dans le navigateur. Utilise le Backup pour migrer.</div></div>

      {/* GESTION DES PRODUITS */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-t">💊 Gestion des Produits</div>
        <div className="mini" style={{marginBottom:10}}>Créez ou supprimez des espaces de travail pour chaque produit médical.</div>
        
        <div style={{marginBottom:12}}>
           {products.map(p => (
             <div key={p} className="prio-row" style={{marginBottom:4, borderColor: activeProduct === p ? "var(--teal)" : "var(--bdr)"}}>
                <span style={{fontWeight: activeProduct === p ? 700 : 400, color: activeProduct === p ? "var(--teal)" : "var(--t1)"}}>{p}</span>
                {products.length > 1 && 
                  <button className="btn btn-rose" style={{padding:"2px 8px", fontSize:10, marginLeft:"auto"}} onClick={() => deleteProduct(p)}>🗑️</button>
                }
             </div>
           ))}
        </div>

        <div style={{display:"flex", gap:8}}>
          <input className="fi" placeholder="Nouveau produit..." id="newProdInput" />
          <button className="btn btn-p" onClick={() => {
            const inp = document.getElementById("newProdInput");
            if(inp && inp.value) {
               addProduct(inp.value);
               inp.value = "";
            }
          }}>➕ Ajouter</button>
        </div>
      </div>
    </div>
  );
}
