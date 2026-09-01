/**
 * Synchronisation cloud OPTIONNELLE (JSONBin).
 *
 * ⚠️ AVERTISSEMENT DE SÉCURITÉ
 * La clé `VITE_JSONBIN_KEY` est embarquée dans le bundle JavaScript : elle est
 * donc lisible par n'importe qui ouvre l'application. Ne l'activez que sur un
 * bin de test, sans données patients/médecins réelles.
 * → Migration recommandée : Supabase (Auth + RLS) ou un proxy serveur.
 *
 * Par défaut (aucune variable d'environnement définie) l'application fonctionne
 * 100 % en local (localStorage + IndexedDB) et ces fonctions sont inertes.
 */
export const JSONBIN_MASTER_KEY = import.meta.env.VITE_JSONBIN_KEY;
export const JSONBIN_BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID || null;
export const IS_CLOUD_CONFIGURED = !!JSONBIN_MASTER_KEY;

if (IS_CLOUD_CONFIGURED && import.meta.env.DEV) {
  console.warn(
    "[MedRep] Sync cloud JSONBin activée : la clé API est exposée côté client. " +
    "À réserver aux données de test."
  );
}

export async function loadCloudData() {
  if (!IS_CLOUD_CONFIGURED || !JSONBIN_BIN_ID) return null;
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`, {
      headers: { "X-Master-Key": JSONBIN_MASTER_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.record;
  } catch (e) {
    console.error("Erreur Cloud Load:", e);
    return null;
  }
}

/** @returns {Promise<boolean|null>} true = sauvegardé, false = échec, null = cloud désactivé */
export async function saveCloudData(data) {
  if (!IS_CLOUD_CONFIGURED) return null;
  try {
    if (JSONBIN_BIN_ID) {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Master-Key": JSONBIN_MASTER_KEY },
        body: JSON.stringify(data),
      });
      return res.ok;
    }
    const res = await fetch("https://api.jsonbin.io/v3/b", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": JSONBIN_MASTER_KEY,
        "X-Bin-Name": "MedRep-Data",
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.metadata?.id) {
      console.info(`[MedRep] Bin créé. Renseignez VITE_JSONBIN_BIN_ID = ${result.metadata.id}`);
    }
    return res.ok;
  } catch (e) {
    console.error("Erreur Cloud Save:", e);
    return false;
  }
}
