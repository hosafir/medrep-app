import { useState, useEffect, useRef } from "react";
import { SYS_PROMPT, callLLM } from "../../lib/ai.js";
import { CHAT_HISTORY_KEY } from "../../lib/constants.js";
import { monthKey, tNow } from "../../lib/dates.js";
import { buildAssistantContext } from "../../lib/insights.js";
import { useData } from "../../store/dataContext.js";
import { getAllKnowledgeFiles, loadJSON, saveJSON, saveKnowledgeFile } from "../../lib/storage.js";

export function Assistant({ apiKey, provider, model, setPage, doctors }) {
  const { reports, accounts, activeProduct } = useData();
  // Contexte réellement alimenté : CR, planning du mois, comptes KAM
  const buildCtx = () => {
    const now = new Date();
    const planning = loadJSON(`medrep_planning_${monthKey(now.getFullYear(), now.getMonth())}`, null)?.plan || {};
    const specialty = localStorage.getItem("medrep_user_specialty") || "";
    return buildAssistantContext(doctors, reports, planning, specialty, activeProduct, accounts);
  };
  // --- États ---
  const [msgs, setMsgs] = useState(() => {
    const saved = loadJSON(CHAT_HISTORY_KEY, null);
    if (saved && Array.isArray(saved) && saved.length > 0) return saved;
    return [{ role: "assistant", text: `Bonjour ! Je suis votre assistant médical personnel.\n\nJe peux analyser des documents (PDF, Images, Excel) et les mémoriser pour vous.\n\nQue puis-je faire pour vous ?`, time: tNow() }];
  });

  const [inp, setInp] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Gestion de la base de connaissance
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const fileInputRef = useRef(null);
  
  // CORRECTION : Déclaration de 'bot'
  const bot = useRef(null);

  // Charger les fichiers mémorisés
  useEffect(() => {
    getAllKnowledgeFiles().then(list => {
      const files = list.map((blob, i) => ({
        id: `file_${i}_${Date.now()}`,
        name: blob.name || `Fichier ${i + 1}`,
        type: blob.type,
        size: blob.size,
        storedAt: blob.storedAt || new Date().toISOString(),
        url: URL.createObjectURL(blob)
      }));
      setKnowledgeFiles(files);
    });
  }, []);

  // Sauvegarde auto
  useEffect(() => {
    saveJSON(CHAT_HISTORY_KEY, msgs);
    bot.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // --- Fonctions ---
  const clearChat = () => {
    if (!confirm("Effacer tout l'historique ?")) return;
    setMsgs([{ role: "assistant", text: `Nouvelle conversation. Je me souviens des fichiers stockés.`, time: tNow() }]);
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // Gestion Fichiers
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuffer = ev.target.result;
      const blob = new Blob([arrayBuffer], { type: file.type });
      blob.name = file.name;
      blob.storedAt = new Date().toISOString();

      await saveKnowledgeFile(`kb_${Date.now()}`, blob);

      const fileUrl = URL.createObjectURL(blob);
      setKnowledgeFiles(prev => [...prev, { name: file.name, type: file.type, size: file.size, url: fileUrl, storedAt: blob.storedAt }]);
      setMsgs(p => [...p, { role: "system", text: `📁 Fichier "${file.name}" stocké.`, time: tNow() }]);
      
      if (file.type.startsWith("image/")) {
        const base64 = arrayBufferToBase64(arrayBuffer);
        analyzeContent(`Analyse cette image ("${file.name}")`, base64, file.type);
      } else if (file.type === "text/plain" || file.name.endsWith(".md")) {
        const text = new TextDecoder().decode(arrayBuffer);
        analyzeContent(`Analyse ce document ("${file.name}") :\n\n${text.slice(0, 3000)}`, null, null);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const deleteFile = async (idx) => {
    if (!confirm("Supprimer ce fichier ?")) return;
    setKnowledgeFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Appel IA
  const analyzeContent = async (prompt, base64, mimeType) => {
    if (!apiKey) return alert("Configurez l'API.");
    setLoading(true);
    setMsgs(p => [...p, { role: "user", text: `📄 Analyse du fichier...`, time: tNow() }]);
    try {
      const imageData = base64 ? { image: { base64: base64, mimeType: mimeType } } : null;
      const ctx = buildCtx();
      const sys = SYS_PROMPT + ctx;
      const r = await callLLM(prompt, apiKey, provider, model, sys, imageData);
      setMsgs(p => [...p.slice(0, -1), { role: "assistant", text: r, time: tNow() }]);
    } catch (e) {
      setMsgs(p => [...p.slice(0, -1), { role: "assistant", text: "Erreur: " + e.message, time: tNow() }]);
    }
    setLoading(false);
  };

  const send = async (overrideMsg) => {
    const m = (overrideMsg || inp).trim();
    if (!m || loading || !apiKey) return;
    setInp("");
    setMsgs(p => [...p, { role: "user", text: m, time: tNow() }]);
    setLoading(true);
    try {
      const ctx = buildCtx();
      const sysExt = SYS_PROMPT + ctx;
      const r = await callLLM(m, apiKey, provider, model, sysExt);
      setMsgs(p => [...p, { role: "assistant", text: r, time: tNow() }]);
    } catch (e) {
      setMsgs(p => [...p, { role: "assistant", text: "Erreur: " + e.message, time: tNow() }]);
    }
    setLoading(false);
  };

  // --- Rendu ---
  if (!apiKey) return <div className="content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}><div className="card" style={{ maxWidth: 500, textAlign: "center" }}><div style={{ fontSize: 46, marginBottom: 12 }}>🔑</div><div style={{ fontFamily: "var(--fd)", fontSize: 20, fontWeight: 800, marginBottom: 10 }}>Configure l'IA</div><button className="btn btn-p" onClick={() => setPage("settings")}>⚙️ Paramètres</button></div></div>;

  return (
    <div className="content" style={{ padding: 0, display: "flex", flexDirection: "column", height: "calc(100vh - 52px)" }}>
      {/* Toolbar */}
      <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--bdr)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: "rgba(10,15,30,.5)" }}>
        <button className={`vp-tab ${showKnowledge ? "active" : ""}`} onClick={() => setShowKnowledge(!showKnowledge)}>
          📁 Base de données ({knowledgeFiles.length})
        </button>
        <button className="btn btn-rose" style={{ fontSize: 11, padding: "5px 12px", marginLeft: "auto" }} onClick={clearChat}>🗑️ Nouvelle conv.</button>
      </div>

      {/* Zone Fichiers */}
      {showKnowledge && (
        <div style={{ padding: 12, background: "var(--navy2)", borderBottom: "1px solid var(--bdr)", maxHeight: 200, overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>📚 Fichiers mémorisés</div>
            <label className="btn btn-p" style={{ fontSize: 10, padding: "4px 10px", cursor: "pointer" }}>
              ➕ Ajouter
              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,.pdf,.txt,.md,.csv" />
            </label>
          </div>
          {knowledgeFiles.length === 0 ?
            <div className="mini">Aucun fichier stocké.</div> :
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {knowledgeFiles.map((f, i) => (
                <div key={i} className="pill" style={{ cursor: "pointer" }}>
                  📄 {f.name}
                  <button style={{ marginLeft: 6, background: "none", border: "none", color: "var(--rose)", cursor: "pointer" }} onClick={() => deleteFile(i)}>✕</button>
                </div>
              ))}
            </div>
          }
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ padding: "8px 16px 0", display: "flex", gap: 8, overflowX: "auto" }}>
        <button className="btn btn-g" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => fileInputRef.current.click()}>📎 Analyser un fichier</button>
        {["Résume mes CR", "Email au Dr.", "Planification"].map((q, i) => <button key={i} className="btn btn-g" style={{ fontSize: 10, padding: "4px 10px" }} onClick={() => send(q)} disabled={loading}>{q}</button>)}
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {msgs.map((m, i) => <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}><div style={{ maxWidth: "75%", background: m.role === "user" ? (provider?.color || "#4285f4") : "var(--navy3)", color: m.role === "user" ? "#000" : "var(--t1)", padding: "8px 12px", borderRadius: 12, whiteSpace: "pre-wrap", fontSize: 13 }}>{m.text}<div style={{ fontSize: 10, opacity: .6, marginTop: 6, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div></div></div>)}
        {loading && <div className="pill"><span className="sp" /> Analyse...</div>}
        <div ref={bot} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 10, borderTop: "1px solid var(--bdr)", background: "rgba(10,15,30,0.5)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ cursor: "pointer", padding: "6px", background: "var(--navy3)", borderRadius: 8, border: "1px solid var(--bdr)" }} title="Joindre un fichier">
            📎
            <input type="file" style={{ display: "none" }} onChange={handleFileUpload} accept="image/*,.pdf,.txt,.md,.csv" />
          </label>
          <textarea
            className="fi"
            value={inp}
            onChange={e => setInp(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Pose ta question..."
            style={{ flex: 1, resize: "none", minHeight: 44, maxHeight: 120 }}
          />
          <button className="btn btn-p" onClick={() => send()} disabled={(!inp.trim() && !loading) || loading} style={{ background: provider?.color || "var(--teal)", height: 44, width: 44 }}>{loading ? <span className="sp" /> : "↑"}</button>
        </div>
      </div>
    </div>
  );
}
