import { useState, useEffect, useMemo, useRef } from "react";
import { callLLM } from "../../lib/ai.js";
import { dtNowISO } from "../../lib/dates.js";
import { extractAdoptionInsights } from "../../lib/insights.js";
import { stableSortDocs } from "../../lib/normalize.js";
import { deleteAudio, getAudio, loadJSON, saveAudio, saveJSON } from "../../lib/storage.js";
import { useData } from "../../store/dataContext.js";

export function ReportsPage({doctors, setDoctors, apiKey, provider, model, setPage}){
  const[selectedId,setSelectedId]=useState(doctors[0]?.id||null);
  const { reports, setReports } = useData(); // source unique (persistée par DataProvider)
  const[actions,setActions]=useState(()=>loadJSON("medrep_actions_v1",{}));
  
  useEffect(()=>saveJSON("medrep_actions_v1",actions),[actions]);
  
  const docById=useMemo(()=>{const m=new Map();doctors.forEach(d=>m.set(d.id,d));return m;},[doctors]);
  const selectedDoctor=selectedId?docById.get(selectedId):null;
  const doctorReports=(selectedId&&reports[selectedId])?reports[selectedId]:[];
  
  const[text,setText]=useState("");
  const[transcript,setTranscript]=useState("");
  const[saving,setSaving]=useState(false);
  
  // --- Dictée Vocale ---
  const[dictating,setDictating]=useState(false);
  const speechRef=useRef(null);
  const speechSupported=useMemo(()=>typeof window!=="undefined"&&!!(window.SpeechRecognition||window.webkitSpeechRecognition),[]);
  
  const startDictation=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){alert("Dictée non supportée."); return;}
    const rec=new SR();
    rec.lang="fr-FR"; rec.interimResults=true; rec.continuous=true;
    rec.onresult=e=>{
      let ft="";
      for(let i=e.resultIndex;i<e.results.length;i++){
        const chunk=e.results[i][0]?.transcript||"";
        if(e.results[i].isFinal)ft+=chunk+" ";
      }
      if(ft)setTranscript(prev=>(prev+" "+ft).trim());
    };
    rec.onerror=e=>{console.error("Speech Error:",e.error); setDictating(false);};
    rec.onend=()=>setDictating(false);
    speechRef.current=rec;
    setDictating(true);
    rec.start();
  };
  const stopDictation=()=>{try{speechRef.current?.stop();}catch{ /* reconnaissance déjà arrêtée */ } setDictating(false);};

  // --- Audio Recording (CORRIGÉ) ---
  const[recording,setRecording]=useState(false);
  const mediaRecRef=useRef(null),chunksRef=useRef([]);
  
  const startRecording=async()=>{
    // Vérification HTTPS (nécessaire pour le micro)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
       return alert("❌ Le microphone nécessite une connexion sécurisée (HTTPS).");
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mr.ondataavailable = e => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      // Nettoyage des pistes quand on arrête
      mr.onstop = () => {
         stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      alert("Impossible d'accéder au micro : " + err.message);
    }
  };

  const stopRecordingAndSave=async()=>{
    if(!mediaRecRef.current) return;
    
    return new Promise(resolve => {
      const mr = mediaRecRef.current;
      
      mr.onstop = async () => {
        // Création du blob audio
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecording(false);
        // Sauvegarde automatique
        await addReport({ audioBlob: blob });
        resolve();
      };
      
      mr.stop();
    });
  };

  // --- Ajout de rapport ---
  const addReport=async({audioBlob=null}={})=>{
    if(!selectedId)return;
    const content=(text||"").trim(),trans=(transcript||"").trim();
    if(!content&&!trans&&!audioBlob)return alert("Écris un CR ou fais une dictée.");
    setSaving(true);
    try{
      const rId=`r_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      let audioKey=null;
      if(audioBlob){audioKey=`audio_${rId}`;await saveAudio(audioKey,audioBlob);}
      const item={id:rId,createdAt:dtNowISO(),text:content,transcript:trans,audioKey};
      setReports(prev=>{const list=prev[selectedId]?[...prev[selectedId]]:[];list.unshift(item);return{...prev,[selectedId]:list};});
      setText("");setTranscript("");
      if(apiKey&&selectedDoctor)setTimeout(()=>analyze(),600);
    }finally{setSaving(false);}
  };

  const playAudio=async audioKey=>{
    if(!audioKey)return;
    const blob=await getAudio(audioKey);
    if(!blob)return alert("Audio introuvable.");
    const url=URL.createObjectURL(blob);const a=new Audio(url);a.onended=()=>URL.revokeObjectURL(url);a.play();
  };
  
  const deleteReport=async rid=>{
    if(!selectedId||!confirm("Supprimer ?"))return;
    const rep=doctorReports.find(x=>x.id===rid);
    if(rep?.audioKey){try{await deleteAudio(rep.audioKey);}catch{ /* audio déjà supprimé */ }}
    setReports(prev=>({...prev,[selectedId]:(prev[selectedId]||[]).filter(x=>x.id!==rid)}));
  };
  
  // --- Analyse IA ---
  const[analyzing,setAnalyzing]=useState(false);
  const[aiErr,setAiErr]=useState("");
  
  const analyze=async()=>{
    if(!apiKey)return setPage("settings");
    if(!selectedDoctor)return;
    const last=doctorReports.slice(0,5);
    if(last.length===0)return alert("Ajoute au moins un CR.");
    setAnalyzing(true);setAiErr("");
    try{
      const prompt=`Analyse Dr. ${selectedDoctor.name} (${selectedDoctor.city}, Pot. ${selectedDoctor.potential}).\n\nCR:\n${last.map((r,i)=>`[${i+1}] ${r.text||r.transcript||"Audio"}`).join("\n")}\n\n## Score d'adoption\n- Score : X/100\n- Frein principal : ...`;
      const out=await callLLM(prompt,apiKey,provider,model);
      const insights=extractAdoptionInsights(out);
      setActions(prev=>({...prev,[selectedId]:{generatedAt:dtNowISO(),text:out,prescriptionProba:insights.prescriptionProba}}));
      setDoctors(prev=>stableSortDocs(prev.map(doc=>doc.id===selectedId?{...doc,adoptionScore:insights.adoptionScore??doc.adoptionScore,mainObjection:insights.mainObjection||doc.mainObjection}:doc)));
    }catch(e){setAiErr(e.message);}
    setAnalyzing(false);
  };

  // Templates Rapides
  const QUICK_TEMPLATES = [
    { label: "Intro", text: "Présentation du produit. " },
    { label: "Prix", text: "Objection prix. " },
    { label: "Rx", text: "Prescription validée. " },
    { label: "À revoir", text: "À revoir dans 15j. " }
  ];

  if(!doctors.length)return<div className="content"><div className="card"><div className="empty">Aucun médecin.</div></div></div>;
  
  return(
    <div className="content">
      <div className="g2" style={{alignItems:"start"}}>
        <div className="card">
          <div className="card-t">🧾 Compte-rendu</div>
          <div className="fg"><label className="fl">Médecin</label><select className="fs" value={selectedId||""} onChange={e=>setSelectedId(parseInt(e.target.value,10))}>{doctors.map(d=><option key={d.id} value={d.id}>{d.name} — {d.city}</option>)}</select></div>
          
          <div style={{ marginBottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
             {QUICK_TEMPLATES.map(t => (
               <button key={t.label} className="btn btn-g" style={{ fontSize: 10, padding: "4px 8px" }} onClick={() => setText(prev => (prev || "") + t.text)}>{t.label}</button>
             ))}
          </div>

          <textarea className="fta" placeholder="Échanges, intérêt, objections..." value={text} onChange={e=>setText(e.target.value)} style={{minHeight: 120}}/>
          
          <div className="grid2" style={{marginTop:8}}>
             <div className="fg"><label className="fl">Dictée</label><textarea className="fta" placeholder="Clic Démarrer..." value={transcript} onChange={e=>setTranscript(e.target.value)}/></div>
             <div className="fg" style={{display:'flex', flexDirection:'column', gap:8}}>
                <div style={{display:'flex', gap:8}}><button className="btn btn-blue" disabled={!speechSupported||dictating} onClick={startDictation}>🎙️ Démarrer</button><button className="btn btn-g" disabled={!dictating} onClick={stopDictation}>⏹️ Stop</button></div>
                <div className="mini">Autorisez le micro si demandé.</div>
             </div>
          </div>
          
          <div className="sep"/>
          
          <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
             <button className="btn btn-p" disabled={saving} onClick={()=>addReport({})}>{saving?<span className="sp"/>:"💾 Sauvegarder"}</button>
             <button className="btn btn-g" onClick={()=>{setText("");setTranscript("");}}>🧹 Effacer</button>
             <span className="pill" style={{marginLeft:"auto"}}>{doctorReports.length} CR</span>
          </div>
          
          <div className="sep"/>
          <div className="card-t" style={{marginBottom:8}}>🎧 Enregistrement Audio</div>
          <div style={{display:"flex",gap:8}}>
             <button className="btn btn-blue" disabled={recording} onClick={startRecording}>⏺️ Enregistrer</button>
             <button className="btn btn-g" disabled={!recording} onClick={stopRecordingAndSave}>⏹️ Stop + Sauver</button>
             {recording && <span className="pill" style={{color:"var(--rose)", borderColor:"var(--rose)"}}>● REC</span>}
          </div>
        </div>
        
        <div className="card">
          <div className="card-t">🤖 Analyse IA <span className="pill" style={{borderColor:apiKey?"rgba(0,212,170,.35)":"rgba(244,63,94,.35)",color:apiKey?"var(--teal)":"var(--rose)"}}>{apiKey?"ON":"OFF"}</span></div>
          {!apiKey&&<div className="warn" style={{marginBottom:10}}>⚠️ Configure l'API.</div>}
          <button className="btn btn-p" onClick={analyze} disabled={!apiKey||analyzing||!selectedDoctor}>{analyzing?<><span className="sp"/> Analyse…</>:"⚡ Analyser"}</button>
          {aiErr&&<div className="warn" style={{marginTop:10}}>⚠️ {aiErr}</div>}
          <div className="sep"/>
          {!actions[selectedId]?.text?<div className="empty" style={{padding:20}}>Aucune analyse.</div>:(
            <div>
              <div style={{marginBottom:8}}><div className="mini">Généré: {new Date(actions[selectedId].generatedAt).toLocaleString("fr-FR")}</div></div>
              <div style={{whiteSpace:"pre-wrap",lineHeight:1.7,fontSize:13,background:"rgba(255,255,255,.02)",border:"1px solid var(--bdr)",borderRadius:12,padding:12,maxHeight:400,overflowY:"auto"}}>{actions[selectedId].text}</div>
              <div style={{display:"flex",gap:8,marginTop:10}}><button className="btn btn-g" onClick={()=>navigator.clipboard.writeText(actions[selectedId].text)}>📋 Copier</button></div>
            </div>
          )}
        </div>
      </div>
      <div style={{height:12}}/>
      <div className="card">
        <div className="card-t">📚 Historique</div>
        {doctorReports.length===0?<div className="empty" style={{padding:22}}>Aucun CR.</div>:(
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {doctorReports.slice(0,10).map(r=>(
              <div key={r.id} style={{border:"1px solid var(--bdr)",borderRadius:12,padding:12,background:"rgba(255,255,255,.02)"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                  <div style={{fontFamily:"var(--fd)",fontWeight:800,fontSize:12}}>{new Date(r.createdAt).toLocaleString("fr-FR")}</div>
                  <div style={{display:"flex",gap:8}}>{r.audioKey&&<button className="btn btn-g" style={{padding:"5px 10px"}} onClick={()=>playAudio(r.audioKey)}>▶︎</button>}<button className="btn btn-rose" style={{padding:"5px 10px"}} onClick={()=>deleteReport(r.id)}>🗑️</button></div>
                </div>
                <div className="mini" style={{marginTop:8}}><b>Texte:</b> {r.text?r.text.slice(0,140):"—"}</div>
                <div className="mini" style={{marginTop:4}}><b>Dictée:</b> {r.transcript?r.transcript.slice(0,140):"—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
