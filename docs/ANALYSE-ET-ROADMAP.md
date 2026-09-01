# MedRep AI — Analyse complète & Roadmap produit
### Assistant pour Délégué Médical / Key Account Manager (gestion & développement du portefeuille clients)

_Audit réalisé le 2026-09-01 sur la branche `arena/01a05c9c-medrep-app` (commit de base `797ffa3`)._

---

## 1. Ce qui existe aujourd'hui (état des lieux)

### 1.1 Stack technique
| Élément | Détail |
|---|---|
| Front | React 19 + Vite 7, JavaScript (pas de TypeScript) |
| Style | CSS-in-JS global injecté (`GS()`), thème "navy/teal" sombre |
| Données | `localStorage` (JSON) + `IndexedDB` (audio, fichiers de connaissance) |
| Cloud | JSONBin.io (clé master en variable Vite → **exposée côté client**) |
| Auth | Composant `Auth()` Supabase présent mais **jamais monté ni importé** (code mort → erreur lint `supabase is not defined`) |
| IA | Multi-provider : Gemini, OpenAI, Anthropic, Groq, OpenRouter (clé stockée en clair dans `localStorage`) |
| Libs | `xlsx` (import Excel/CSV), `framer-motion`, `lucide-react`, `react-window`, `@supabase/supabase-js` (installées mais **inutilisées** sauf xlsx) |
| Taille | **1 seul fichier `src/App.jsx` de 2 546 lignes** contenant ~30 composants |

### 1.2 Fonctionnalités déjà en place
- **Dashboard** vue d'ensemble + alertes terrain (`FieldAlertsPanel` : visites en retard selon fréquence A/B/C).
- **Dashboard Commercial** : KPI (visites, prescripteurs, à convertir, taux de conversion), activité 6 mois, score par ville, top freins, objectif mensuel (valeur en dur dans `localStorage`), export via `window.print()`.
- **Dashboard Produit (Fumetil)** : segmentation chaud/tiède/froid par score d'adoption IA, jauge, donut, top objections, top 5 à prioriser.
- **Médecins** : liste, import Excel/CSV avec mapping intelligent de colonnes + alias de villes + dédoublonnage, filtres, potentiel A/B/C, fréquence de visite.
- **Planning mensuel** : génération automatique par jours ouvrés, regroupement géographique, système de **directives** (ciblage ville/spécialité/potentiel + jours), drag & drop.
- **Comptes-rendus** : saisie texte, **enregistrement audio** (MediaRecorder + IndexedDB), analyse IA structurée (score /100, freins, leviers, argumentaire, objectif next visit), extraction automatique vers la fiche médecin.
- **Coach IA** : chat avec contexte portefeuille, pièces jointes, historique.
- **Préparation de visite** (`VisitPrepModal`) : stade, probabilité de prescription, température, sentiment, générateur de messages.
- **Priorisation IA hebdomadaire**, détection d'opportunités, score prédictif maison.
- **Multi-produits** (sélecteur global) + sauvegarde/restauration de backup.

### 1.3 Verdict global
Le produit a **déjà une vraie valeur métier** pour un délégué médical solo : le trio *import portefeuille → planning → CR analysé par IA* fonctionne et se différencie bien d'un CRM classique.

**Mais** il n'est aujourd'hui **pas un outil de KAM** : il ne gère que des **médecins individuels**, pas des **comptes** (hôpital, clinique, pharmacie, groupement, centrale d'achat), pas de **chiffre d'affaires / sell-in / sell-out**, pas de **plan de compte**, pas de **cartographie des décideurs**. C'est le cœur du gap à combler.

---

## 2. Audit technique — problèmes à corriger

### 2.1 Bloquants / sécurité (P0)
| # | Problème | Impact | Correctif proposé |
|---|---|---|---|
| S1 | `VITE_JSONBIN_KEY` (clé **master** JSONBin) embarquée dans le bundle JS | N'importe qui peut lire/écrire/supprimer **toutes** les données clients | Migrer vers Supabase (déjà en dépendance) avec RLS, ou au minimum une Access Key restreinte + proxy serveur |
| S2 | Clé API LLM en clair dans `localStorage`, appels directs navigateur → provider | Vol de clé (XSS, poste partagé), coût non maîtrisé | Edge Function / route serveur qui détient la clé ; l'app n'envoie que le prompt |
| S3 | Données de santé + données personnelles médecins **non chiffrées**, sans authentification | Risque RGPD / loi 09-08 (Maroc) : identité, téléphone, e-mail, notes comportementales | Auth obligatoire, chiffrement au repos, journal d'accès, politique de rétention, page consentement/mentions |
| S4 | Le composant `Auth()` Supabase est **mort** (variable `supabase` non définie) | Appli sans aucun contrôle d'accès | Créer `src/lib/supabase.js`, monter `<Auth/>` tant que `session === null` |
| S5 | Sync JSONBin = **"last write wins"** sur tout le blob, debounce 3 s | Perte de données silencieuse en multi-appareil / multi-onglet | Sync par entité + `updated_at`, résolution de conflit, indicateur d'état de synchro |

### 2.2 Qualité de code (P1)
- `npm run lint` → **37 erreurs, 1 warning**. Notamment :
  - `regenerate` **utilisé avant déclaration** dans un `useEffect` (`PlanningPage`, l. 1782) → bug latent de régénération du planning.
  - Mutation d'objets d'état (règle `react-hooks/immutability`) dans le générateur de planning.
  - Nombreux `catch {}` vides → erreurs invisibles pour l'utilisateur.
  - Variables inutilisées (`useToast`, `dropDay`, …).
- **Monolithe de 2 546 lignes** : impossible à faire évoluer à plusieurs, pas de tests, pas de découpage par domaine.
- **Aucun test** (ni unitaire, ni e2e) alors que la logique de scoring/planning est le cœur de valeur.
- `reports` relu via `loadJSON` dans plusieurs composants avec `useMemo(...,[])` → **désynchronisation** de l'UI après ajout d'un CR.
- Bundle : `xlsx` = 429 kB (142 kB gzip) chargé en dur → devrait être en import dynamique.
- Pas de PWA / offline alors que l'usage est 100 % terrain, souvent en mobilité et sans réseau.
- `alert()` / `confirm()` natifs alors qu'un `ToastProvider` existe déjà.

### 2.3 Ergonomie
- Le mobile est partiellement traité (menu burger `display:none` en dur dans le style inline du bouton).
- Pas d'écran de saisie rapide "sur le parking après la visite" (le cas d'usage n°1 d'un délégué).
- Export PDF = `window.print()` sans feuille de style print dédiée.

---

## 3. Gap analysis : de "délégué médical" à "KAM"

Ce que le métier de **Key Account Manager pharma** exige et qui **manque totalement** :

| Domaine KAM | Présent ? | Ce qu'il faut construire |
|---|---|---|
| **Comptes** (hôpital, clinique, pharmacie, groupement, GPO) | ❌ | Entité `Account` avec hiérarchie parent/enfant, et rattachement des contacts |
| **Cartographie des parties prenantes** | ❌ | Rôles (prescripteur, pharmacien hospitalier, chef de service, acheteur, DAF, KOL), influence/soutien, org-chart visuel |
| **Plan de compte (Account Plan)** | ❌ | Objectifs annuels, analyse SWOT, stratégie, plan d'actions, revue trimestrielle |
| **Chiffre d'affaires / sell-in & sell-out** | ❌ | Import ventes par compte/produit/mois, réalisé vs objectif, évolution, part de marché |
| **Objectifs & quotas** | Partiel (nb de visites) | Objectifs CA, unités, couverture, fréquence, mix produits — par période |
| **Pipeline d'opportunités** | Partiel (score IA) | Opportunités avec valeur €, étape, probabilité, date de clôture, next step |
| **Appels d'offres / référencement / formulaire hospitalier** | ❌ | Suivi des tenders : deadline, statut, concurrents, prix, décision |
| **Concurrence** | ❌ | Produits concurrents par compte, parts de voix, arguments de contre-attaque |
| **Stocks & commandes pharmacie** | ❌ | Suivi stock, ruptures, réassort, commandes |
| **Contrats & remises** | ❌ | Conditions commerciales, échéances, renouvellements |
| **Segmentation & ciblage** | Partiel (A/B/C manuel) | Matrice potentiel × adoption, recalcul automatique, historique de segment |
| **Multi-utilisateur / management** | ❌ | Rôles délégué / KAM / manager régional, vue équipe, coaching, consolidation |
| **Conformité (compliance)** | ❌ | Traçabilité échantillons, invitations congrès, transferts de valeur (Sunshine-like), validation manager |
| **Activités hors visite** | ❌ | Staffs, réunions, congrès, ateliers, e-détailing, appels, e-mails |
| **Géolocalisation / tournées** | Partiel (regroupement ville) | Carte, optimisation d'itinéraire réelle, check-in GPS |

---

## 4. Roadmap proposée

### Phase 0 — Assainissement (1 semaine) — *prérequis à tout le reste*
1. **Découper `App.jsx`** en `src/features/{dashboard,doctors,planning,reports,assistant,settings}` + `src/lib`, `src/components`, `src/hooks`.
2. **Sécuriser** : brancher Supabase (auth + Postgres + RLS), retirer JSONBin, déplacer les appels LLM derrière une Edge Function.
3. **Zéro erreur lint** + corriger le bug `regenerate` du planning.
4. Store centralisé (Zustand ou Context + reducer) pour `doctors` / `reports` / `planning` → fin des désynchronisations.
5. Tests unitaires Vitest sur : scoring, génération de planning, import Excel, parsing des sections IA.
6. PWA (installable, offline-first, file d'attente de synchronisation).

### Phase 1 — Socle KAM (2–3 semaines)
7. **Modèle "Compte"** : hôpitaux, cliniques, pharmacies, groupements ; hiérarchie ; rattachement des médecins/contacts.
8. **Contacts & rôles** avec matrice **influence × soutien** (visuel 2×2) et org-chart.
9. **Ventes / performance** : import Excel des ventes (sell-in, sell-out), CA réalisé vs objectif par compte, produit, période, avec courbes et YoY.
10. **Objectifs multi-dimensions** (CA, unités, visites, couverture, fréquence) définis par produit/période, suivi automatique.
11. **Fiche Compte 360°** : contacts, historique visites, ventes, opportunités, contrats, documents, prochaines actions.

### Phase 2 — Développement client (2–3 semaines)
12. **Account Plan** guidé (SWOT + objectifs + actions + revue trimestrielle), avec **génération IA du plan** à partir des données du compte.
13. **Pipeline d'opportunités** (kanban : identifiée → qualifiée → proposée → référencée → gagnée/perdue) avec valeur et probabilité.
14. **Appels d'offres / référencement** : deadlines, pièces, concurrents, résultat.
15. **Veille concurrentielle** par compte, extraction automatique depuis les CR ("le médecin utilise X").
16. **Matrice de segmentation dynamique** potentiel × adoption avec repositionnement automatique et alertes de déclassement.

### Phase 3 — Intelligence & exécution terrain (2 semaines)
17. **Transcription audio réelle** (Whisper / Gemini audio) — aujourd'hui l'audio est stocké mais pas transcrit automatiquement.
18. **Optimisation d'itinéraire** réelle (carte Leaflet + géocodage + TSP approché) et check-in GPS.
19. **Next Best Action** : moteur de recommandation quotidien (qui voir, quoi dire, quel support).
20. **Rapports & exports pro** : PDF mensuel de tournée, export Excel management, rapport de compte.
21. **Rappels & notifications** (visites en retard, échéances contrats, anniversaires de référencement).

### Phase 4 — Équipe & conformité (2 semaines)
22. **Multi-utilisateur** : rôles délégué / KAM / manager, partage de portefeuille, vue consolidée région.
23. **Coaching manager** : accompagnement terrain, grille d'évaluation de visite, feedback.
24. **Compliance** : échantillons, invitations, transferts de valeur, piste d'audit, export réglementaire.
25. **Bibliothèque de contenus** : supports visuels, études, e-détailing avec suivi de ce qui a été présenté.

---

## 5. Modèle de données cible (Supabase / Postgres)

```
users(id, email, role, territory_id)
territories(id, name, manager_id)
accounts(id, name, type[hopital|clinique|pharmacie|cabinet|groupement],
         parent_id, city, sector, address, geo_lat, geo_lng, tier[A|B|C], owner_id)
contacts(id, account_id, name, specialty, role[prescripteur|pharmacien|acheteur|chef_service|KOL],
         influence[1-5], support[1-5], phone, email, potential, visit_frequency)
products(id, name, brand, therapeutic_area, price)
visits(id, contact_id, account_id, user_id, date, type[visite|staff|congres|appel|e-detail],
       duration, products[], objective, outcome, audio_url, transcript, ai_analysis jsonb)
sales(id, account_id, product_id, period, units, revenue, channel[sell_in|sell_out])
objectives(id, scope[user|account|product], target_type[ca|units|visits|coverage], period, value)
opportunities(id, account_id, product_id, stage, value, probability, expected_close, next_step)
tenders(id, account_id, deadline, status, competitors jsonb, price, result)
account_plans(id, account_id, year, swot jsonb, objectives jsonb, actions jsonb, review jsonb)
competitors(id, account_id, product_id, competitor_name, share_estimate, notes)
activities(id, user_id, type, date, payload jsonb)   -- journal & audit
```

Politique RLS : chaque utilisateur ne voit que son territoire ; les managers voient leurs équipes.

---

## 6. Quick wins (< 1 jour chacun, fort effet perçu)

1. **Corriger le bug `regenerate`** du planning + purger les 37 erreurs de lint.
2. **Objectif mensuel paramétrable** depuis les Paramètres (aujourd'hui codé à 60 dans `localStorage`).
3. **Recherche globale** (⌘K) médecins / comptes-rendus.
4. **Saisie CR express** : 3 champs (médecin, ressenti, next step) + bouton micro, accessible en 2 taps depuis le mobile.
5. **Feuille de style `@media print`** pour un vrai export PDF présentable.
6. **Import dynamique de `xlsx`** → −140 kB gzip au chargement.
7. Remplacer `alert()`/`confirm()` par le `ToastProvider` + modale de confirmation existants.
8. **Badge d'état de synchro** (synchronisé / en attente / hors-ligne) dans la topbar.
9. **Export Excel du portefeuille** (complément de l'import déjà présent).
10. **Bouton "Appeler / WhatsApp / Itinéraire"** sur chaque fiche médecin (liens `tel:`, `wa.me`, `maps`).

---

## 7. Priorisation recommandée (matrice valeur / effort)

| Priorité | Chantier | Valeur | Effort |
|---|---|---|---|
| 🥇 1 | Sécurité + Auth Supabase + refactor modulaire | Très haute | Moyen |
| 🥇 2 | Entité **Compte** + contacts/rôles (socle KAM) | Très haute | Moyen |
| 🥈 3 | **Ventes & objectifs** (CA vs target) | Très haute | Moyen |
| 🥈 4 | Quick wins UX (liste §6) | Haute | Faible |
| 🥉 5 | Account Plan + pipeline d'opportunités | Haute | Moyen |
| 🥉 6 | Transcription audio automatique | Haute | Faible |
| 7 | Carte & optimisation de tournée | Moyenne | Moyen |
| 8 | Multi-utilisateur & vue manager | Moyenne | Élevé |
| 9 | Compliance & audit | Moyenne | Moyen |

---

## 8. Recommandations transverses

- **Passer en TypeScript** progressivement (`allowJs`) : le domaine métier est riche, les erreurs de forme de données sont le principal risque.
- **Un seul provider IA par défaut** (Gemini Flash) côté serveur, les autres en option → simplifie le support et le coût.
- **Journaliser les coûts IA** (tokens/appel) pour l'utilisateur.
- **Mode démo** avec jeu de données fictif pour présenter l'outil sans exposer de vraies données.
- **Internationalisation** FR/AR/EN si l'usage dépasse le Maroc.
