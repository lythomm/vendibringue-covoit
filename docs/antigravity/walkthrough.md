# Walkthrough - Infrastructure Backend (Supabase)

La fondation de données pour l'application **VendiBringue Covoit'** est déployée et sécurisée.

## Ce qui a été réalisé

### 1. Schéma PostgreSQL 🐘
Quatre tables principales gèrent le cycle de vie du covoiturage :
- `events` : Stocke l'Épicentre et le code d'accès (`BRINGUE2026`).
- `profiles` : Profils simplifiés (Prénom, Phone, Instagram). Les numéros sont isolés.
- `rides` : Les offres de trajets avec coordonnées de départ et places totales.
- `bookings` : Les réservations passagers avec contrainte d'unicité.

### 2. Sécurité & RLS (Row Level Security) 🛡️
- **Confidentialité** : Les numéros de téléphone ne sont visibles que par les personnes impliquées dans le trajet (Conducteur <-> Passagers). Les marqueurs sur la carte ne diffusent que le prénom et l'avatar.
- **Intégrité** : Un utilisateur ne peut modifier que ses propres données.

### 3. Logique Métier SQL ⚡
- **Vue `ride_details`** : Calcule en temps réel les places disponibles sans logique complexe côté Frontend.
- **Trigger `check_ride_capacity`** : Empêche techniquement toute réservation si le véhicule est plein.

## État de la Base de Données
Le projet Supabase est prêt. L'événement par défaut a été inséré :
- **Nom** : Vendibringue 2026
- **Code d'accès** : `BRINGUE2026`
- **Lieu** : Lille, France (Épicentre)

---

## Instructions pour le prochain agent (Dév Frontend)
1. Consommer la Vue `public.ride_details` pour afficher les marqueurs sur la carte.
2. Utiliser le système d'auth "Email Alias" : `phone + pin` -> `${phone}@vbcovoit.app`.
3. S'abonner aux changements `INSERT/UPDATE` sur `rides` et `bookings` via Supabase Realtime.
