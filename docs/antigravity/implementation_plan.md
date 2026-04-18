# Implementation Plan - Frontend VendiBringue Covoit'

Ce plan détaille la transformation du projet Vite/Vue actuel en une Progressive Web App (PWA) premium, sécurisée et fonctionnelle.

## User Review Required

> [!IMPORTANT]
> **Le Hack Authentification** : Nous allons utiliser un système d'alias email `${phone}@vbcovoit.app` pour permettre la connexion par numéro de téléphone + PIN sans payer de service de SMS. 

> [!TIP]
> **Design "Heritage Bringue"** : Palette de Beige (#F5F2EA) et Vert Émeraude Sombre (#1A2F1A) avec des typographies modernes (Sora/Inter).

---

## Proposed Changes

### 🎨 Design System & Styles
Configuration de Tailwind 4 pour injecter l'esthétique premium dès le départ.

#### `src/styles/main.css`
- Définition des tokens de couleur : `--color-brand-primary` (Ocre/Beige), `--color-brand-secondary` (Vert Bringue).

---

### 🔐 Phase 2 : Identité & Portail d'Accès
Mise en place de la sécurité et du flux de connexion.

#### `src/stores/auth.ts`
- Logique `login(phone, pin, firstName)` :
  - Tentative de `signIn` avec email fictif.
  - Si erreur 400, exécution d'un `signUp`.
  - Mise à jour automatique de la table `profiles`.

#### `src/views/AuthView.vue`
- Ajout d'une étape de validation du "Code de la Soirée" (`BRINGUE2026`).
- Refonte visuelle complète.

---

### 🗺️ Phase 3 : La Carte Interactive
L'expérience centrale de l'application.

#### `src/views/HomeView.vue`
- Initialisation de **Leaflet.js** centrée sur "L'Épicentre" (Lille).
- Abonnement au flux **Realtime** de Supabase sur les tables `rides` et `bookings`.

#### `src/components/RideDetails.vue`
- Bottom Sheet interactive affichant les détails du trajet sélectionné.
- Bouton de réservation immédiate.
