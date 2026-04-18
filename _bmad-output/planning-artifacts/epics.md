---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
  - stitch-screens/README.md
---

# VendiBringue Covoit' - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for VendiBringue Covoit', decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: A user can access the app by entering their phone number and a 4-digit PIN (unified register/login flow)
FR2: The system stores the user's session locally (LocalStorage) to prevent re-authentication
FR3: A user can only hold one active role per session (driver OR passenger)
FR4: A user can change their role (driver/passenger) after initial selection
FR5: The system can request and access the device's GPS location
FR6: A driver can confirm their departure location via GPS auto-positioning
FR7: A driver can manually set their departure location by tapping on the map (GPS fallback)
FR8: A passenger can have the map auto-centered on their GPS location
FR9: A passenger can manually pan the map to browse rides
FR10: All active rides are displayed as markers on the map
FR11: The map updates automatically (real-time) when rides or seat availability change
FR12: The system visually differentiates full rides from available rides on the map
FR13: A driver can create a new ride (departure point + seat count)
FR14: A driver can view the list of passengers booked in their ride
FR15: A driver can remove a passenger from their ride
FR16: A driver can cancel their entire ride
FR17: A driver can access a contact entry point (WhatsApp/SMS/Insta) for each passenger
FR18: A passenger can view ride details by tapping a marker
FR19: A passenger can book a seat with a single action
FR20: The system enforces a limit of one active booking per session
FR21: The system prevents over-booking beyond declared seat count (server-side check)
FR22: A passenger can cancel their own booking
FR23: A passenger receives contact shortcuts to the driver immediately after booking
FR24: A passenger with an active booking can view status/contact links without re-tapping the map
FR25: The system displays a contextual empty state when no rides are available
FR26: The system generates pre-filled WhatsApp link (`wa.me/`)
FR27: The system generates pre-filled SMS link fallback
FR28: The system provides Instagram DM link shortcut
FR29: Deep-links open native apps directly
FR30: The app is installable as a PWA on iOS/Android (Add to Home Screen)
FR31: The app displays an offline fallback screen
FR32: The app generates Open Graph link previews for Messenger sharing

### NonFunctional Requirements

NFR1: Load Time - Interactive map in < 3s on 4G
NFR2: Real-time Latency - Status updates reflected in < 5s via Supabase Realtime
NFR3: Concurrency - Support up to 50 simultaneous users
NFR4: Uptime - 99.9% availability during the critical event window (48h)
NFR5: Offline Resilience - Informative error screen via Service Worker
NFR6: Data Integrity - All communications via TLS (HTTPS)
NFR7: Minimal Exposure - No SEO indexing; data revealed only for coordination
NFR8: Session Expiry - 7 days session persistence in LocalStorage
NFR9: Accessibility - WCAG 2.1 Level A (min 44x44px touch targets)
NFR10: PWA Experience - No browser address bar in standalone mode
NFR11: Language - Interface entirely in French

### Additional Requirements

AR1: Supabase RLS policies (Phone numbers masked to non-participants by default)
AR2: `Leaflet.markercluster` dependency usage for marker performance
AR3: Vercel deployment (HTTPS mandatory for GPS & PWA features)
AR4: DB Schema: `profiles` (phone, name), `rides` (driver_id, origin, seats), `bookings` (passenger_id, ride_id)
AR5: Vue 3 (Composition API) + Tailwind CSS + Supabase JS client stack

### UX Design Requirements

UX-DR1: **Heritage Bringue Palette**: Beige (#F5F2EA) light mode, Forest Green/Rustic Green text, Bright Green action buttons.
UX-DR2: **Auth Gate Design**: Airbnb-style centered card (Glass/Soft UI) for Prénom, Tél, PIN.
UX-DR3: **Map Convergence**: Visual focus and orientation towards the "Epicenter" (event location).
UX-DR4: **Bottom Sheet Layer**: Mobile drawer for all ride interactions (details, booking, management).
UX-DR5: **Standardized Touch targets**: 48x48px min, 56x56px preferred for main actions.
UX-DR6: **Huge Spot Counter**: Large numeric digit with massive +/- buttons (64x64px) and organic spring animation.
UX-DR7: **Dynamic Car Markers**: Avatar-based markers with visual seat badges (e.g. "3/4" or "PLEIN").
UX-DR8: **Feedback Micro-interactions**: Shimmer effects on buttons during load, rolling number counters for seats.
UX-DR9: **Airbnb Aesthetics**: Clean layout, soft shadows, rounded-3xl (24px) corners as seen in `stitch-screens`.

### FR Coverage Map

FR1: Epic 1 - Access via Phone+PIN
FR2: Epic 1 - Session LocalStorage persistence
FR3: Epic 1 - Single active role enforcement
FR4: Epic 1 - Role switching
FR5: Epic 2 - GPS location request
FR6: Epic 3 - Departure point auto-positioning
FR7: Epic 3 - Manual map selection for departure
FR8: Epic 2 - Passenger auto-centering
FR9: Epic 2 - Manual map panning
FR10: Epic 2 - Displaying all active rides
FR11: Epic 2 - Real-time map updates (Supabase)
FR12: Epic 2 - Visual distinction (Full vs Available)
FR13: Epic 3 - Ride creation (Origin + Seats)
FR14: Epic 3 - Passenger list visibility
FR15: Epic 3 - Passenger removal
FR16: Epic 3 - Ride cancellation
FR17: Epic 3 - Contact entry point for passengers
FR18: Epic 4 - Ride details view
FR19: Epic 4 - One-click booking
FR20: Epic 4 - Single active booking enforcement
FR21: Epic 4 - Server-side over-booking check
FR22: Epic 4 - Booking cancellation
FR23: Epic 5 - Contact shortcuts delivery after booking
FR24: Epic 4 - Active booking status visibility
FR25: Epic 2 - Empty state display
FR26: Epic 5 - WhatsApp link generation
FR27: Epic 5 - SMS link generation (fallback)
FR28: Epic 5 - Instagram DM shortcut
FR29: Epic 5 - Native deep-link triggers
FR30: Epic 6 - PWA manifest & installation
FR31: Epic 6 - Offline shell display
FR32: Epic 1 - Open Graph metadata for link sharing

## Epic List

### Epic 1: Portail d'Accès & Identité (La Porte de la Bringue)
Cet Epic permet aux utilisateurs de s'identifier et d'accéder pour la première fois à l'application de manière sécurisée mais fluide.
**FRs covered:** FR1, FR2, FR3, FR4, FR32.

### Epic 2: La Carte de Convergence (Exploration Spatiale)
Le cœur visuel du projet : afficher la carte centrée sur l'épicentre de l'événement avec les voitures disponibles.
**FRs covered:** FR5, FR8, FR9, FR10, FR11, FR12, FR25.

### Epic 3: Proposer un Covoit' (Le Rôle du Conducteur)
Toutes les fonctionnalités dédiées aux conducteurs pour mettre à disposition leurs places libres.
**FRs covered:** FR6, FR7, FR13, FR14, FR15, FR16, FR17.

### Epic 4: Réserver son Siège (Le Parcours Passager)
Permet aux passagers de choisir une voiture, de réserver leur place et de confirmer leur trajet.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR24.

### Epic 5: Mise en Relation & Coordination (Le Lien Social)
Le pont entre l'application et les outils de communication réels des utilisateurs.
**FRs covered:** FR23, FR26, FR27, FR28, FR29.

### Epic 6: Expérience Installable & Résilience (PWA)
Faire de la web app une véritable application mobile installable et robuste.
**FRs covered:** FR30, FR31.

---

## Epic 1: Portail d'Accès & Identité (La Porte de la Bringue)

### Story 1.1: UI de l'Auth Gate "Heritage"
**As a** visiteur,
**I want** voir une interface d'accueil chaleureuse et premium,
**So that** je me sente immédiatement dans l'ambiance de la Bringue avant même de me connecter.

**Acceptance Criteria:**
- **Given** le visiteur arrive sur l'URL racine.
- **When** la page est chargée.
- **Then** l'utilisateur voit une carte centrale flottante (Airbnb style) sur un fond Beige (#F5F2EA).
- **And** les textes utilisent le Vert Forêt et la typographie premium définie.

### Story 1.2: Identification par Numéro & PIN
**As a** participant,
**I want** saisir mon prénom, mon numéro et un PIN à 4 chiffres,
**So that** je puisse créer mon compte ou me reconnecter en une seule étape (Unified Flow).

**Acceptance Criteria:**
- **Given** l'utilisateur est sur l'Auth Gate.
- **When** il saisit ses infos et valide.
- **Then** le système vérifie si le profil existe dans Supabase (table `profiles`).
- **And** crée le profil s'il est nouveau ou valide l'accès si le PIN correspond.

### Story 1.3: Sélection du Rôle (Pilote ou Passager)
**As a** utilisateur identifié,
**I want** choisir si je cherche une place ou si j'en propose une,
**So that** l'application adapte mon expérience de navigation initiale.

**Acceptance Criteria:**
- **Given** l'utilisateur vient de se connecter avec succès.
- **When** il voit l'écran de choix de rôle.
- **Then** il peut cliquer sur "Je propose une place" ou "Je cherche une place".
- **And** son choix est enregistré dans l'état local de l'application.

### Story 1.4: Persistance de Session Locale
**As a** utilisateur régulier,
**I want** que l'application se souvienne de moi,
**So that** je n'aie pas à ressaisir mon PIN à chaque ouverture pendant l'événement.

**Acceptance Criteria:**
- **Given** l'utilisateur a déjà réussi une connexion.
- **When** il rafraîchit la page ou revient plus tard.
- **Then** le système récupère le token de session depuis le LocalStorage.
- **And** le redirige directement vers la carte (Epic 2) sans passer par l'Auth Gate.

### Story 1.5: Aperçu de partage (Open Graph)
**As a** organisateur,
**I want** que le lien de l'application soit beau quand je le partage sur WhatsApp,
**So that** mes amis aient envie de cliquer.

**Acceptance Criteria:**
- **Given** un lien vers l'app est collé dans WhatsApp ou Messenger.
- **When** l'aperçu (preview) est généré.
- **Then** on voit une image bannière "Heritage Bringue" avec le titre "VendiBringue Covoit'".

---

## Epic 2: La Carte de Convergence (Exploration Spatiale)

### Story 2.1: Initialisation de la Carte & Épicentre
**As a** visiteur,
**I want** voir une carte centrée sur le lieu de la Bringue,
**So that** je comprenne immédiatement où tout le monde converge.

**Acceptance Criteria:**
- **Given** l'application est chargée.
- **When** la carte s'affiche.
- **Then** elle est centrée sur les coordonnées de la Bringue (l'épicentre).
- **And** les tuiles de la carte utilisent un style épuré cohérent avec la palette Beige/Vert.

### Story 2.2: Géolocalisation & Auto-centrage
**As a** passager,
**I want** voir ma propre position sur la carte,
**So that** je sache à quelle distance je me trouve des covoiturages disponibles.

**Acceptance Criteria:**
- **Given** l'utilisateur a autorisé la géolocalisation.
- **When** il clique sur le bouton "Ma position".
- **Then** la carte se centre sur ses coordonnées GPS.
- **And** un marqueur distinctif affiche sa position.

### Story 2.3: Rendu des Marqueurs "Voiture" Dynamiques
**As a** passager,
**I want** voir les voitures disponibles sous forme d'avatars avec un badge de places,
**So that** je puisse identifier visuellement un conducteur que je connais et le nombre de sièges restants.

**Acceptance Criteria:**
- **Given** des trajets existent dans la base Supabase.
- **When** la carte les affiche.
- **Then** chaque trajet est représenté par l'avatar du conducteur.
- **And** un badge numérique (ex: "3/4") ou un code couleur (Plein vs Libre) est visible sur le marqueur.

### Story 2.4: Flux en Temps Réel des Trajets
**As a** utilisateur,
**I want** que les marqueurs sur la carte apparaissent ou disparaissent instantanément,
**So that** je ne tente pas de réserver un trajet qui vient d'être annulé.

**Acceptance Criteria:**
- **Given** la carte est ouverte.
- **When** une modification (création/suppression) survient dans Supabase.
- **Then** l'application reçoit le changement via Supabase Realtime.
- **And** le marqueur correspondant est mis à jour sur la carte sans rafraîchir la page.

### Story 2.5: État Vide & Feedback de Recherche
**As a** passager,
**I want** être informé si aucune voiture n'est disponible,
**So that** je ne pense pas que l'application est en panne.

**Acceptance Criteria:**
- **Given** aucun trajet n'est actif dans la base.
- **When** la carte est chargée.
- **Then** un message d'état vide (Empty State) élégant s'affiche ("Aucun conducteur pour le moment...").


---

## Epic 3: Proposer un Covoit' (Le Rôle du Conducteur)

### Story 3.1: Déclaration d'Intention (Activer le mode Conducteur)
**As a** conducteur potentiel,
**I want** cliquer sur un bouton "Je propose une place",
**So that** l'application me guide à travers le processus de création de trajet.

**Acceptance Criteria:**
- **Given** l'utilisateur est sur l'interface principale.
- **When** il clique sur "Je propose une place".
- **Then** le mode "Passager" est désactivé pro-activement pour sa session.
- **And** un tiroir (Bottom Sheet) dédié à la création de trajet s'ouvre.

### Story 3.2: Définition du Départ (GPS ou Manuel)
**As a** conducteur,
**I want** confirmer mon lieu de départ par GPS ou en tapant sur la carte,
**So that** mes passagers sachent exactement où me rejoindre.

**Acceptance Criteria:**
- **Given** le conducteur est en train de créer son trajet.
- **When** il utilise le bouton GPS ou tape sur un point de la carte.
- **Then** un marqueur "ORIGINE" s'affiche visuellement sur la map.
- **And** les coordonnées sont capturées pour le futur trajet.

### Story 3.3: Le Compteur de Places "Huge Spot"
**As a** conducteur,
**I want** ajuster rapidement le nombre de places disponibles avec de gros boutons +/- ,
**So that** je puisse le faire même si j'ai les mains occupées.

**Acceptance Criteria:**
- **Given** l'utilisateur est sur l'écran de configuration du trajet.
- **When** il appuie sur les boutons géants (UX-DR6).
- **Then** le chiffre central s'incrémente ou se décrémente avec une animation fluide (rolling counter).
- **And** la valeur est limitée entre 1 et 8 places.

### Story 3.4: Publication du Trajet & Activation
**As a** conducteur,
**I want** valider ma proposition de covoiturage,
**So that** mon icône devienne visible sur la carte pour tout le monde.

**Acceptance Criteria:**
- **Given** les détails (origine, places) sont saisis.
- **When** il clique sur "Publier mon trajet".
- **Then** une entrée est créée dans Supabase (table `rides`).
- **And** l'utilisateur bascule sur sa vue "Tableau de Bord Conducteur".

### Story 3.5: Suivi des Réservations (Dashboard Conducteur)
**As a** conducteur actif,
**I want** voir en temps réel qui a réservé dans ma voiture,
**So that** je n'oublie personne au moment du départ.

**Acceptance Criteria:**
- **Given** le conducteur a un trajet publié.
- **When** des passagers cliquent sur "Réserver".
- **Then** leurs prénoms apparaissent dans la liste de son trajet.
- **And** il peut accéder à leurs raccourcis de contact (Insta/SMS) en un clic.

### Story 3.6: Modération & Annulation du Trajet
**As a** conducteur,
**I want** pouvoir retirer un passager ou annuler mon trajet entier,
**So that** je garde le contrôle final sur l'organisation de mon véhicule.

**Acceptance Criteria:**
- **Given** le conducteur consulte la liste de ses passagers.
- **When** il clique sur "Retirer" ou "Annuler le covoit'".
- **Then** les réservations concernées sont supprimées et les passagers notifiés par le changement d'UI.

---

## Epic 4: Réserver son Siège (Le Parcours Passager)

### Story 4.1: Consultation des détails d'un trajet
**As a** passager,
**I want** cliquer sur un marqueur de voiture pour voir les détails (conducteur, places),
**So that** je puisse décider si ce trajet me convient.

**Acceptance Criteria:**
- **Given** l'utilisateur clique sur un marqueur de trajet sur la carte.
- **When** le tiroir (Bottom Sheet) s'ouvre.
- **Then** il affiche l'avatar et le prénom du conducteur.
- **And** il montre le nombre de places restantes de manière lisible.

### Story 4.2: Réservation d'un siège (Action Express)
**As a** passager,
**I want** réserver ma place en un seul clic ("Réserver"),
**So that** l'expérience soit la plus fluide possible.

**Acceptance Criteria:**
- **Given** l'utilisateur consulte les détails d'un trajet avec au moins une place libre.
- **When** il clique sur le bouton "Réserver".
- **Then** une ligne est ajoutée dans la table `bookings` de Supabase.
- **And** le bouton se transforme instantanément en "Réservé ✅".

### Story 4.3: Règle du trajet unique
**As a** organisateur,
**I want** empêcher un passager de réserver plusieurs voitures en même temps,
**So that** les places ne soient pas bloquées inutilement.

**Acceptance Criteria:**
- **Given** l'utilisateur a déjà une réservation active.
- **When** il tente de réserver un second trajet.
- **Then** le bouton de réservation est désactivé ou affiche un message d'erreur explicatif.

### Story 4.4: Prévention du sur-booking (Sécurité Serveur)
**As a** passager,
**I want** être sûr que ma réservation est valide,
**So that** je ne me retrouve pas sans place à cause d'un décalage réseau.

**Acceptance Criteria:**
- **Given** deux utilisateurs cliquent sur la dernière place quasiment en même temps.
- **When** Supabase traite les requêtes.
- **Then** le système vérifie le quota de places réel (`seats` vs `count(bookings)`) avant de confirmer.
- **And** seul le premier est confirmé, le second reçoit un message "Désolé, c'est plein !".

### Story 4.5: Gestion de sa propre réservation
**As a** passager,
**I want** pouvoir annuler ma réservation si je change d'avis,
**So that** la place soit libérée pour quelqu'un d'autre.

**Acceptance Criteria:**
- **Given** l'utilisateur a une réservation active.
- **When** il clique sur "Annuler ma place" dans son interface.
- **Then** sa réservation est supprimée de Supabase.
- **And** le trajet redevient disponible sur la carte pour les autres usagers.

### Story 4.6: Accès persistant au trajet actuel
**As a** passager ayant réservé,
**I want** voir un raccourci vers mon trajet en cours directement sur l'écran principal,
**So that** je n'aie pas à re-chercher le marqueur sur la carte pour contacter mon conducteur.

**Acceptance Criteria:**
- **Given** l'utilisateur a une réservation active.
- **When** il ouvre l'application.
- **Then** un bandeau ou un bouton flottant "Mon trajet" est visible.
- **And** un clic dessus ouvre directement les infos et raccourcis de contact du conducteur.

---

## Epic 5: Mise en Relation & Coordination (Le Lien Social)

### Story 5.1: Raccourci de contact WhatsApp (Priorité)
**As a** utilisateur (conducteur ou passager),
**I want** cliquer sur un bouton WhatsApp pour ouvrir une conversation pré-remplie,
**So that** je n'aie pas à copier-coller manuellement le numéro de mon ami.

**Acceptance Criteria:**
- **Given** l'utilisateur a accès aux infos de contact de son binôme.
- **When** il clique sur l'icône WhatsApp.
- **Then** le système génère un lien `https://wa.me/[phone]?text=[message_pre-rempli]`.
- **And** le lien s'ouvre dans l'application native WhatsApp.

### Story 5.2: Solution de secours par SMS
**As a** utilisateur,
**I want** pouvoir envoyer un SMS classique si WhatsApp n'est pas disponible,
**So that** la communication soit garantie même en cas de faible réseau.

**Acceptance Criteria:**
- **Given** l'interface de contact est ouverte.
- **When** il clique sur "SMS".
- **Then** le lien natif `sms:[phone]?body=[message]` est déclenché.

### Story 5.3: Lien direct Instagram
**As a** utilisateur,
**I want** pouvoir accéder au profil Instagram ou envoyer un DM Instagram,
**So that** je puisse coordonner le trajet via mon réseau social préféré.

**Acceptance Criteria:**
- **Given** le profil de l'autre utilisateur contient un identifiant Instagram.
- **When** il clique sur l'icône Instagram.
- **Then** l'application s'ouvre sur le profil ou la messagerie Instagram correspondante.

### Story 5.4: Hub de Coordination post-réservation
**As a** passager,
**I want** voir tous les moyens de contact centralisés dès que ma réservation est confirmée,
**So that** je sache immédiatement comment joindre mon conducteur.

**Acceptance Criteria:**
- **Given** la confirmation de réservation s'affiche dans le Bottom Sheet.
- **When** l'utilisateur regarde ses options de contact.
- **Then** les boutons WhatsApp, SMS et Instagram sont alignés et respectent les zones tactiles d'au moins 48x48px (UX-DR5).

### Story 5.5: Fluidité des Deep-links (Intégration Native)
**As a** utilisateur mobile,
**I want** que les liens ouvrent directement les applications installées sur mon téléphone,
**So that** je ne perde pas de temps dans le navigateur.

**Acceptance Criteria:**
- **Given** l'utilisateur est sur iOS ou Android.
- **When** il clique sur un raccourci de contact.
- **Then** l'application native correspondante est invoquée.

---

## Epic 6: Expérience Installable & Résilience (PWA)

### Story 6.1: Configuration du Manifeste & Icônes
**As a** utilisateur,
**I want** que l'application soit reconnue comme installable par mon téléphone,
**So that** je puisse l'ajouter à mon écran d'accueil avec une icône élégante.

**Acceptance Criteria:**
- **Given** le fichier `manifest.json` et les icônes sont configurés.
- **When** je visite le site sur mobile.
- **Then** le navigateur propose "Ajouter à l'écran d'accueil".
- **And** l'application s'ouvre sans barre d'adresse (mode `standalone`).

### Story 6.2: Support du Service Worker & Mise en cache
**As a** organisateur,
**I want** que les fichiers de base de l'application soient mis en cache localement,
**So that** l'interface s'affiche instantanément même si le réseau est lent.

**Acceptance Criteria:**
- **Given** le Service Worker est enregistré.
- **When** l'application est chargée pour la deuxième fois.
- **Then** les ressources statiques (CSS, JS, logos) sont servies depuis le cache.

### Story 6.3: Message d'erreur "Pas de connexion"
**As a** utilisateur,
**I want** être clairement informé par un message d'erreur si je n'ai plus d'Internet,
**So that** je comprenne pourquoi les trajets ne s'actualisent plus sans être induit en erreur par un "mode hors-ligne" fictif.

**Acceptance Criteria:**
- **Given** le téléphone perd la connexion internet.
- **When** j'essaie de naviguer ou de réserver.
- **Then** un bandeau ou un popup "Connexion perdue 📵" s'affiche de manière non-intrusive mais visible.
- **And** le système me demande de vérifier ma connexion pour continuer.

### Story 6.4: Optimisation UI "Native-Feel"
**As a** utilisateur mobile,
**I want** que l'application occupe tout l'écran et réagisse comme une app native,
**So that** l'immersion soit totale.

**Acceptance Criteria:**
- **Given** l'application est lancée depuis l'écran d'accueil.
- **When** je l'utilise.
- **Then** les "overscroll bounces" sont maîtrisés et la barre de statut iOS/Android s'intègre au design Beige.



