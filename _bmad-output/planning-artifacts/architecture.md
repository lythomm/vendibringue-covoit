---
stepsCompleted: [1]
inputDocuments: [
  'prd.md',
  'product-brief-vendibringue-covoit.md',
  'ux-design-specification.md',
  'brainstorming-session-2026-04-17-1337.md'
]
workflowType: 'architecture'
project_name: 'vendibringue-covoit'
user_name: 'Thomas'
date: '2026-04-17'
---

# Architecture Decision Document

## 1. Project Context Analysis

### 1.1 Requirements Summary
**VendiBringue Covoit'** est une PWA de covoiturage social pour événements privés.
- **Identité** : Phone + 4-digit PIN (unified flow), session persistante (LocalStorage).
- **Mise en relation** : Carte Leaflet (OSM) interactive, 1 place par passager, redirection vers messagerie native (WhatsApp/SMS/Insta).
- **Temps Réel** : Latence < 5s pour les mises à jour de places et de marqueurs.

### 1.2 Scale & Complexity
- **Users** : ~50 concurrents (MVP).
- **Complexité** : Moyenne (Géo-sync temps réel, robustesse PWA sur Safari/iOS).

---

## 2. Refined Architectural Decisions (Expert Feedback)

Suite au **Party Mode**, voici les décisions critiques intégrées :

### 2.1 Security & Privacy (RLS Strategy)
- **Problem** : Exposition des numéros de téléphone à tous les utilisateurs sur la carte.
- **Decision** : Implémenter des **Supabase RLS Policies** strictes. 
    - Les numéros de téléphone sont `null` par défaut lors de la navigation sur la carte.
    - Le numéro n'est révélé au client que via une fonction RPC ou une vue sécurisée **après** que la réservation (booking) soit confirmée par le système.

### 2.2 Visualization & Performance
- **Problem** : Chevauchement des voitures (Clustering zones denses) et latence 4G.
- **Decision** : 
    - Utilisation de `Leaflet.markercluster` pour la lisibilité sur les points de départ communs.
    - Mise en cache agressive des tuiles (CDN) et lazy-loading du module Map pour atteindre un `LCP` < 3s.

### 2.3 UX & Deep-links
- **Problem** : Instagram ne supporte pas nativement les liens de pré-remplissage de message (`wa.me` style).
- **Decision** : 
    - **Action Primaire** : WhatsApp (90% coverage) / SMS.
    - **Appui Secondaire** : Lien vers le profil Instagram pour coordination manuelle si les deux premiers échouent.

---

## 3. Technology Stack & Ecosystem

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Vue 3 (Composition API) | Expertise de l'utilisateur, réactivité fine, écosystème Vite. |
| **Styling** | Tailwind CSS | Rapidité d'exécution, design "Heritage Bringue" via tokens. |
| **Map Engine** | Leaflet.js | Open source, léger, extensible, compatible PWA. |
| **Backend / DB** | Supabase | Auth simplified (Phone), Realtime out-of-the-box, PostgreSQL. |
| **Deployment** | Vercel | CI/CD natif pour Vite/Vue, excellentes performances Edge. |

---

## 4. Draft Data Schema (PostgreSQL)

### Table `profiles`
- `id` (uuid, pk)
- `phone` (text, unique)
- `pin` (text, hashed)
- `name` (text)
- `created_at`

### Table `rides`
- `id` (uuid, pk)
- `driver_id` (uuid, fk -> profiles)
- `departure_city` (text)
- `departure_point` (geometry/lat-lng)
- `total_seats` (int)
- `available_seats` (int) - Computed or Triggered
- `status` (active, cancelled, completed)

### Table `bookings`
- `id` (uuid, pk)
- `ride_id` (uuid, fk -> rides)
- `passenger_id` (uuid, fk -> profiles)
- `status` (booked, cancelled)
- `created_at`

---

## 5. Implementation Roadmap
1. **Setup** : Vite + Vue 3 Core + Tailwind config.
2. **Supabase** : Schéma SQL + RLS Policies + Auth Logic.
3. **Core UI** : Auth Gate (PIN) + Map Shell.
4. **Realtime Logic** : Listen to `bookings` and `rides` to update markers.
5. **Polishing** : PWA Manifest, Desktop layout, Shimmer effect buttons.
