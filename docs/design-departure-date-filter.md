# Spécification Technique : Choix et Filtrage du Jour de Départ des Covoiturages

## 1. Résumé du besoin
Permettre aux conducteurs de proposer un départ jusqu'à 3 jours avant la date de l'événement (`starts_at`), et aux passagers de filtrer les trajets (liste et carte) par jour de départ.

## 2. Hypothèses & Contraintes
- **Événement référent** : La date de l'événement est définie par `starts_at`.
- **Plage de dates autorisées** : [J-3, J-2, J-1, Jour J].
- **Stockage** : Utilisation du champ ISO `departure_time` existant dans la table Supabase `rides`. Pas de migration de base de données requise.

## 3. Decision Log
| Décision | Alternative considérée | Raison du choix |
| :--- | :--- | :--- |
| Calcul JS + champ `departure_time` ISO | Ajout d'une colonne `day_offset` SQL | Évite toute migration DB, 100% rétrocompatible |
| 4 jours relatifs (J-3 à Jour J) | Datepicker libre | Correspond exactement au besoin des festivals/événements sur plusieurs jours |
| Filtre par défaut = "Tous" | Filtre par défaut = "Jour J" | Évite d'isoler des trajets au premier chargement |

## 4. Spécifications du Design

### A. Création d'Annonce (Conducteur)
1. Calcul des 4 options de dates relatives à `event.starts_at` (ou date du jour en fallback) :
   - `J-3` (ex: Mercredi DD/MM)
   - `J-2` (ex: Jeudi DD/MM)
   - `J-1` (ex: Vendredi DD/MM)
   - `Jour J` (ex: Samedi DD/MM)
2. Interface :
   - Un sélecteur de jour de départ (liste déroulante ou boutons radio).
   - Un sélecteur d'heure (`HH:mm`).
3. Enregistrement :
   - Fusion du jour sélectionné et de l'heure en un objet `Date`.
   - Sauvegarde dans Supabase `rides.departure_time` au format ISO.

### B. Filtrage Passager (Carte & Liste)
1. Composant Filtre :
   - Barre de chips/onglets au-dessus de la carte : `[Tous les jours]`, `[Mer. 18]`, `[Jeu. 19]`, `[Ven. 20]`, `[Sam. 21]`.
2. Calcul réactif (`filteredRides`) :
   - Comparaison du jour `YYYY-MM-DD` de chaque trajet avec le jour sélectionné.
3. Mise à jour de la carte :
   - Re-rendu réactif des marqueurs Leaflet basé sur `filteredRides`.

## 5. Plan de Recette / Tests
- [ ] Créer une offre le jour J-2 avec heure 18:00 et vérifier le format stocké en DB.
- [ ] Sélectionner le filtre "J-2" et vérifier que seul ce trajet apparaît sur la carte et dans la liste.
- [ ] Sélectionner "Tous les jours" et vérifier l'affichage global.
