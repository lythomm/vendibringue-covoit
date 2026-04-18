# VendiBringue Covoit' - Tasks

## Phase 1 : Infrastructure & Base de Données (Supabase)
- [x] Vérifier la connexion au projet Supabase
- [x] Créer les tables de base (profiles, events, rides, bookings)
- [x] Configurer les politiques de sécurité (RLS)
- [x] Activer Supabase Realtime sur les tables `rides` et `bookings`
- [x] Créer la Vue SQL `remaining_seats` et la fonction `get_ride_occupancy`

## Phase 2 : Identité & Authentification
- [ ] Mettre en place le "Hack" Auth (Phone + PIN -> Email alias) `[ ]`
- [ ] Créer l'écran de connexion "Heritage" `[ ]`
- [ ] Gérer la persistance de session (LocalStorage) `[ ]`

## Phase 3 : La Carte & Géolocalisation
- [ ] Initialiser Leaflet avec l'Épicentre `[ ]`
- [ ] Implémenter le rendu des marqueurs dynamiques (Avatars + Places) `[ ]`
- [ ] Ajouter la géolocalisation et l'auto-centrage `[ ]`

## Phase 4 : Flux de Covoiturage (Conducteur & Passager)
- [ ] Créer le flux "Proposer un trajet" (Bottom Sheet + Huge Spot Counter) `[ ]`
- [ ] Créer le flux "Réserver un siège" (Details + One-click booking) `[ ]`
- [ ] Ajouter les raccourcis de contact (WhatsApp, SMS, Instagram) `[ ]`

## Phase 5 : Polissage & PWA
- [ ] Configurer le manifest PWA et le Service Worker `[ ]`
- [ ] Ajouter les Open Graph previews `[ ]`
- [ ] Tests finaux et déploiement Vercel `[ ]`
