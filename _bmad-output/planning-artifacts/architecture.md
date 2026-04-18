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

## 4. Data Schema (PostgreSQL)

> **Note** : Le PIN à 4 chiffres est le mot de passe personnel de l'utilisateur
> (stocké dans Supabase Auth, pas en clair). Il n'est **pas** lié à un événement.

### Table `events`
- `id` (uuid, pk, default `gen_random_uuid()`)
- `name` (text)
- `short_code` (text, unique) — code de partage (ex: `BRINGUE2026`)
- `center_lat` (float8)
- `center_lng` (float8)
- `address` (text, nullable)
- `starts_at` (timestamptz, nullable)
- `created_at` (timestamptz, default `now()`)

### Table `profiles`
- `id` (uuid, pk, fk -> auth.users)
- `first_name` (text)
- `phone` (text, unique, nullable)
- `instagram_id` (text, nullable)
- `avatar_url` (text, nullable)
- `updated_at` (timestamptz, default `now()`)

### Table `rides`
- `id` (uuid, pk, default `gen_random_uuid()`)
- `event_id` (uuid, fk -> events)
- `driver_id` (uuid, fk -> profiles)
- `origin_name` (text)
- `origin_lat` (float8)
- `origin_lng` (float8)
- `total_seats` (int, check 1–10)
- `description` (text, nullable)
- `departure_time` (timestamptz)
- `status` (text: active | cancelled | completed, default `active`)
- `created_at` (timestamptz, default `now()`)

### Table `bookings`
- `id` (uuid, pk, default `gen_random_uuid()`)
- `ride_id` (uuid, fk -> rides)
- `passenger_id` (uuid, fk -> profiles)
- `status` (text: confirmed | cancelled, default `confirmed`)
- `created_at` (timestamptz, default `now()`)

---

## 5. Implementation Roadmap
1. **Setup** : Vite + Vue 3 Core + Tailwind config.
2. **Supabase** : Schéma SQL + RLS Policies + Auth Logic.
3. **Core UI** : Auth Gate (PIN) + Map Shell.
4. **Realtime Logic** : Listen to `bookings` and `rides` to update markers.
5. **Polishing** : PWA Manifest, Desktop layout, Shimmer effect buttons.
