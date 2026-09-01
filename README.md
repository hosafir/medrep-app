# MedRep AI — Assistant Délégué Médical / KAM

Application web (React + Vite) d'aide à la **gestion et au développement du portefeuille clients**
pour un délégué médical / key account manager : portefeuille médecins, planning de tournées,
comptes-rendus de visite analysés par IA, tableaux de bord commerciaux.

> 📄 L'analyse produit complète et la feuille de route sont dans
> [`docs/ANALYSE-ET-ROADMAP.md`](docs/ANALYSE-ET-ROADMAP.md).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de production (+ service worker PWA)
npm run preview
npm run lint       # ESLint — doit rester à 0 erreur
npm test           # Vitest (logique métier)
```

## Fonctionnalités

| Module | Contenu |
|---|---|
| **Dashboard** | Vue d'ensemble, alertes de visites en retard (selon la fréquence A/B/C) |
| **Comptes (KAM)** | Établissements et groupements, contacts avec rôles, matrice influence × soutien, fiche 360°, plan de compte, priorisation et alertes |
| **Commercial** | KPI, objectif mensuel paramétrable, activité 6 mois, freins, opportunités |
| **Dashboard produit** | Segmentation chaud / tiède / froid, score d'adoption, top objections |
| **Planning** | Génération mensuelle, regroupement géographique, règles « directives », drag & drop, persistance par mois |
| **Comptes-rendus** | Saisie texte, dictée, enregistrement audio (IndexedDB), analyse IA structurée |
| **Médecins** | Import Excel/CSV tolérant aux libellés, dédoublonnage, score prédictif |
| **Coach IA** | Chat contextualisé sur le portefeuille (Gemini / OpenAI / Anthropic / Groq / OpenRouter) |

## Architecture

```
src/
├── App.jsx                  Coque applicative (navigation, layout)
├── main.jsx
├── store/
│   ├── DataProvider.jsx     État global : médecins, CR, produits, config IA, synchro
│   └── dataContext.js       Contexte + hook useData()
├── lib/
│   ├── accounts.js          Modèle KAM : comptes, rôles, quadrants, stats, alertes
│   ├── ai.js                Fournisseurs LLM et appels unifiés (callLLM)
│   ├── aiParse.js           Découpage des réponses IA en sections
│   ├── cloud.js             Synchro JSONBin OPTIONNELLE (désactivée par défaut)
│   ├── dates.js             Jours ouvrés, semaines, formats FR
│   ├── frequency.js         Fréquences de visite par potentiel
│   ├── importDoctors.js     Import Excel/CSV (xlsx chargé dynamiquement)
│   ├── insights.js          Extraction d'insights, score prédictif, opportunités
│   ├── normalize.js         Normalisation texte / villes / potentiels
│   ├── storage.js           localStorage + IndexedDB (audio, fichiers) + backup
│   └── toastContext.js
├── components/              Charts, Modal, Toast, panneaux réutilisables
├── features/
│   ├── accounts/            Comptes KAM : liste, fiche 360°, cartographie des parties prenantes
│   ├── assistant/ commercial/ dashboard/ doctors/
│   ├── planning/            PlanningPage + planningEngine.js (moteur pur, testé)
│   ├── product/ reports/ settings/
└── styles/GlobalStyles.jsx  Thème global + responsive + feuille d'impression
```

Principes :
- **Un seul point d'entrée pour les données** (`useData()`), plus de lecture directe de
  `localStorage` dans les composants.
- **Moteur de planning pur** (`planningEngine.js`) : sans effet de bord, donc testable.
- **Modules `lib/` sans React** : réutilisables et couverts par les tests.

## Données et confidentialité

- Par défaut, **100 % local** : `localStorage` (portefeuille, CR, réglages) et `IndexedDB`
  (audio, fichiers de connaissance). Rien ne quitte l'appareil, hors appels IA explicites.
- Sauvegarde / restauration complète depuis **Paramètres → Backup**.
- ⚠️ La synchro cloud JSONBin (`VITE_JSONBIN_KEY`, `VITE_JSONBIN_BIN_ID`) expose la clé dans le
  bundle : à réserver à des données de test. Migration recommandée : Supabase + RLS.
- ⚠️ La clé du fournisseur IA est stockée dans le navigateur et les requêtes partent
  directement du client. À terme, la passer derrière un proxy serveur.

## PWA

L'application est installable et fonctionne hors connexion (précache des assets).
Les appels aux fournisseurs IA ne sont jamais mis en cache.

## Tests

```bash
npm test
```
Couvre : normalisation et import de portefeuille, dates et jours ouvrés, extraction
d'insights IA, score prédictif, moteur de planning (quotas, clusters, directives, backlog),
et un test de fumée du rendu de l'application.
