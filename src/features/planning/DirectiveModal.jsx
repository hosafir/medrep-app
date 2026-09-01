import { useState, useMemo } from "react";

// Génère un identifiant hors du rendu React (fonction appelée dans l'initialiseur paresseux du state)
let dirSeq = 0;
function newDirectiveId() { dirSeq += 1; return `dir_${dirSeq}_${performance.now().toString(36).replace(".", "")}`; }

export function DirectiveModal({ directive, onSave, onClose, doctors }) {
  const [form, setForm] = useState(() => directive || {
    id: newDirectiveId(), name: "", isActive: true,
    week: 1, days: [3, 4], startDate: "", endDate: "",
    priority: 5, maxVisits: "",
    cities: [], specialties: [], products: [], potentials: [], excludeIds: []
  });

  const allCities = useMemo(() => [...new Set(doctors.map(d => d.city))].sort(), [doctors]);
  const allSpecialties = useMemo(() => [...new Set(doctors.map(d => d.specialite).filter(Boolean))].sort(), [doctors]);
  const allProducts = useMemo(() => [...new Set(doctors.map(d => d.product).filter(Boolean))].sort(), [doctors]);
  const doctorOptions = useMemo(() => doctors.map(d => ({id: d.id, name: d.name})), [doctors]);

  const toggleDay = (day) => {
    setForm(prev => ({ ...prev, days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day].sort() }));
  };

  const toggleArray = (field, value) => {
    setForm(prev => ({ ...prev, [field]: prev[field].includes(value) ? prev[field].filter(v => v !== value) : [...prev[field], value] }));
  };

  const chipContainer = { display: 'flex', gap: 4, flexWrap: 'wrap', maxHeight: 100, overflowY: 'auto', padding: "4px", background: "var(--navy4)", borderRadius: 6, marginTop: 4 };

  return (
    <div className="vp-overlay" onMouseDown={onClose}>
      <div className="vp-modal" style={{ maxWidth: 700, maxHeight: '90vh' }} onMouseDown={e => e.stopPropagation()}>
        <div className="vp-header">
          <div className="vp-name">{directive ? "Modifier la Règle" : "Nouvelle Règle Intelligente"}</div>
          <div className="vp-sub">Priorité, Limites, et Ciblage.</div>
        </div>
        
        <div className="vp-body" style={{ overflowY: 'auto' }}>
          <div className="fg"><label className="fl">Nom de la règle</label><input className="fi" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Ex: Focus A - Cardiologie"/></div>

          <div className="grid2">
            <div className="fg"><label className="fl">Priorité (1-10)</label><input className="fi" type="number" min="1" max="10" value={form.priority} onChange={e => setForm(p => ({...p, priority: parseInt(e.target.value)}))} /><div className="mini">10 = Urgent</div></div>
            <div className="fg"><label className="fl">Max Visites</label><input className="fi" type="number" placeholder="Illimité" value={form.maxVisits} onChange={e => setForm(p => ({...p, maxVisits: e.target.value}))} /></div>
          </div>

          <div className="sep"/><div className="card-t" style={{fontSize: 12}}>📅 Période & Jours</div>
          <div className="grid2">
             <div className="fg"><label className="fl">Semaine</label><select className="fs" value={form.week} onChange={e => setForm(p => ({...p, week: parseInt(e.target.value)}))}>{[0,1,2,3,4,5].map(w => <option key={w} value={w}>{w === 0 ? "Toutes les semaines" : `Semaine ${w}`}</option>)}</select></div>
             <div className="fg"><label className="fl">Jours</label><div style={{display: 'flex', gap: 4}}>{["Lun", "Mar", "Mer", "Jeu", "Ven"].map((d, i) => (<button key={i} className={`btn ${form.days.includes(i+1) ? "btn-p" : "btn-g"}`} style={{ padding: "4px 8px", fontSize: 10 }} onClick={() => toggleDay(i + 1)}>{d}</button>))}</div></div>
          </div>
          <div className="grid2">
            <div className="fg"><label className="fl">Début validité</label><input className="fi" type="date" value={form.startDate} onChange={e => setForm(p => ({...p, startDate: e.target.value}))} /></div>
            <div className="fg"><label className="fl">Fin validité</label><input className="fi" type="date" value={form.endDate} onChange={e => setForm(p => ({...p, endDate: e.target.value}))} /></div>
          </div>

          <div className="sep"/><div className="card-t" style={{fontSize: 12}}>🎯 Ciblage</div>
          <div className="fg"><label className="fl">Villes</label><div style={chipContainer}>{allCities.map(c => (<button key={c} className={`btn ${form.cities.includes(c) ? "btn-p" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("cities", c)}>{c}</button>))}</div></div>
          <div className="grid2">
            <div className="fg"><label className="fl">Produits</label><div style={chipContainer}>{allProducts.map(p => (<button key={p} className={`btn ${form.products.includes(p) ? "btn-blue" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("products", p)}>{p}</button>))}</div></div>
            <div className="fg"><label className="fl">Potentiel</label><div style={chipContainer}>{['A', 'B', 'C'].map(p => (<button key={p} className={`btn ${form.potentials.includes(p) ? "btn-rose" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("potentials", p)}>{p}</button>))}</div></div>
          </div>
          <div className="fg"><label className="fl">Spécialités</label><div style={chipContainer}>{allSpecialties.map(s => (<button key={s} className={`btn ${form.specialties.includes(s) ? "btn-blue" : "btn-g"}`} style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => toggleArray("specialties", s)}>{s}</button>))}</div></div>
          
          <div className="fg">
            <label className="fl">Exclure des médecins</label>
            <select multiple className="fs" style={{height: 50}} value={form.excludeIds} onChange={e => setForm(p => ({...p, excludeIds: Array.from(e.target.selectedOptions, o => o.value)}))}>
              {doctorOptions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

        </div>

        <div className="vp-footer"><button className="btn btn-g" onClick={onClose}>Annuler</button><button className="btn btn-p" onClick={() => onSave(form)}>💾 Sauvegarder</button></div>
      </div>
    </div>
  );
}
