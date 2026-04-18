---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
classification:
  projectType: Mobile-first Web Application (PWA)
  domain: Événementiel / Social Peer-to-Peer Mobility
  complexity: low-medium
  projectContext: greenfield
inputDocuments:
  - c:\Users\Thomas\workspace\myProjects\vendibringue-covoit\_bmad-output\brainstorming\brainstorming-session-2026-04-17-1337.md
  - c:\Users\Thomas\workspace\myProjects\vendibringue-covoit\_bmad-output\planning-artifacts\product-brief-vendibringue-covoit.md
  - c:\Users\Thomas\workspace\myProjects\vendibringue-covoit\_bmad-output\planning-artifacts\product-brief-vendibringue-covoit-distillate.md
workflowType: "prd"
documentCounts:
  briefCount: 2
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 0
---

# Product Requirements Document - VendiBringue Covoit'

**Author:** Thomas
**Date:** 2026-04-17

---

## Executive Summary

VendiBringue Covoit' is a free, mobile-first web application that eliminates the coordination friction of carpooling between friends at private events. When a group of friends needs to organize rides to a party or gathering, the current reality is painful: a chaotic group chat where "who has a car?" messages get buried, commercial apps like BlaBlaCar that are overkill and awkward among acquaintances, or improvised spreadsheets nobody checks on a Saturday night. VendiBringue Covoit' solves this with a single shareable event URL — posted in a Messenger group — that drops users onto an interactive map. Drivers tap the map to mark where they're starting from; passengers see available rides nearby and claim a seat in one tap. The app then hands off to real-world messaging (WhatsApp, SMS, Instagram) for the actual coordination, rather than reinventing a chat interface nobody asked for.

Target users are groups of friends organizing private events: the host who wants visibility on how everyone is arriving, the driver who wants to signal 3 spare seats without fielding 15 individual messages, and the passenger who wants to find a ride in under 30 seconds. No accounts. No passwords. Phone number + 4-digit PIN, remembered by the browser.

### What Makes This Special

The core insight is that friction in friend-group carpooling is not about trust (everyone knows each other) or payment (it's free between friends) — it's about **visual coordination**. Nobody can see who is departing from where. A map solves this immediately. Every design decision flows from one principle: be a coordinator, not a platform. Rather than building a messaging system inside the app, VendiBringue uses OS-level deep links (`wa.me/`, `sms:`, `instagram.com/`) to redirect users into the channels they already live in. This makes the app feel lightweight and native, not like another inbox to check. The phone number + PIN identity system is specifically designed to be "throwaway-friendly" — strong enough to prevent seat squatting, light enough that users never feel they're creating an account.

Competitors in the event carpooling space (Caroster, Togetzer, CoviEvent) reduce friction. VendiBringue removes it from the communication layer entirely.

## Project Classification

| Field               | Value                                          |
| ------------------- | ---------------------------------------------- |
| **Project Type**    | Mobile-first Web Application (PWA)             |
| **Domain**          | Social / Event Mobility — Peer-to-Peer         |
| **Complexity**      | Low-to-Medium                                  |
| **Project Context** | Greenfield                                     |
| **Tech Stack**      | Vue 3, Supabase, Leaflet/OpenStreetMap, Vercel |

---

## Success Criteria

### User Success

The definitive "aha" moment is when a user opens the event URL and immediately sees the map populated with departure points from other attendees. Success is achieved when a user can go from opening the link to either posting a ride or booking a seat — without asking anyone for help, without reading instructions, in under 60 seconds.

- 80%+ of users who open the link complete a meaningful action (post or book a ride)
- Zero support requests or "how do I use this?" messages in the Messenger group
- The map is the first thing visible — no splash screen, no onboarding flow required

### Business Success

As a free, single-event side-project, traditional business metrics don't apply. Success is defined by social proof within the target circle:

- All participants of the event use the app vs. falling back to the group chat
- The host reports that ride coordination felt effortless compared to previous events

### Technical Success

- **Map initial load:** < 2-3 seconds on a standard 4G mobile connection
- **Real-time updates (cancellations, new rides):** Reflected on the map within a few seconds — near-real-time, not instant; acceptable given the small concurrent user count (< 50 users simultaneously)
- **Auth flow:** Phone + PIN entry to active session in under 10 seconds
- **Deep-link generation:** WhatsApp/SMS/Instagram redirect fires immediately on booking confirmation

### Measurable Outcomes

- Map rendered and interactive within 3 seconds of page load
- 0 crashes or data loss events during a single event lifecycle
- Every booked ride results in a successful deep-link redirect to a native messaging app

---

## Product Scope

### MVP — Minimum Viable Product

- **Single fixed app URL** (deployed Vercel URL shared manually in Messenger — one active event at a time)
- Bimodal entry: Driver mode / Passenger mode split at launch screen
- Phone + 4-digit PIN authentication, session persisted in LocalStorage
- **GPS geolocation** to auto-position drivers on the map and help passengers find nearby available rides
- Map tap/long-press as fallback if GPS permission is denied by the user
- Seat creation by driver (with available seat count)
- Single-seat booking by passenger (strictly 1 booking per device enforced)
- Driver can remove a passenger from their ride
- Passenger can self-cancel their booking (immediately frees the seat on the map)
- Deep-link generation on booking: redirect to WhatsApp, SMS, or Instagram

### Growth Features (Post-MVP)

- **Dynamic event URL generation** (unique URL per event, e.g. `vendibringue.app/soiree-kevin`)
- Phone number privacy masking (revealed only at booking confirmation)
- Multi-event dashboard for organizers
- Return trip coordination (outbound + return ride management)
- Ride capacity indicator visible on map markers (e.g. "2 seats left")

### Vision (Future)

- Open-source, self-hostable template: any friend group deploys their own instance in 5 minutes
- Zero platform ambitions — remains an anti-app by design

---

## User Journeys

### Journey 1 — Lucas, The Driver ("Le Sam")

Lucas owns a Peugeot 5008 and lives in Bordeaux-Caudéran. At 6pm, he receives the party link shared by Théo in the Messenger group. He opens it on his phone — the map loads centered on Bordeaux. He taps "I'm driving." The app requests GPS access. He accepts; his departure point appears instantly on the map as a car icon. He sets 3 available seats. In under 45 seconds, his ride is visible to all his friends. That evening, he receives no "do you have room?" messages — his friends see his availability directly on the map. Two of them book via the app → his WhatsApp receives their messages.

**"Aha" moment:** Seeing his own pin appear on the map among the other drivers' pins.

**Capabilities revealed:** GPS geolocation, ride creation, seat count selection, real-time map, Phone+PIN auth.

---

### Journey 2 — Camille, The Passenger

Camille lives in Mérignac and has no car. She clicks the link at 7pm. The map opens centered on her GPS position. She immediately sees 4 available rides, including one departing 500m from her home. She taps it. A ride card appears: "Lucas — 3 seats — departure 9pm." She taps "Join" → WhatsApp opens automatically with a pre-filled message: "Hey Lucas, I'm booking a seat for the party!" Zero number searching, zero copy-paste.

**"Aha" moment:** The "Join" tap that opens WhatsApp instantly — the social friction vanishes.

**Capabilities revealed:** Map centered on passenger GPS, ride card detail view, 1-tap booking, deep-link generation (WhatsApp/SMS/Instagram), 1-booking-per-device enforcement.

---

### Journey 3 — Théo, The Organizer (Read-Only Observer)

Théo organized the party. He already shared the link and just wants peace of mind. He opens the app occasionally as a read-only observer to check the state of all rides. He sees 2 drivers have offered seats, 5 people have booked, and 2 attendees have no visible transport. He sends them a Messenger message to encourage them to post their location.

**"Aha" moment:** The map gives him an instant visual of "who has a ride, who doesn't" — no interrogation required.

**Capabilities revealed:** Read-only map view for non-participating users (no separate "organizer mode" needed in MVP — the map IS the dashboard).

---

### Journey 4 — Manon, Edge Case: Passenger Cancellation

Manon booked Lucas's ride but can no longer make it. She reopens the app on her phone, finds her active booking, and taps "Cancel." Her seat frees up on the map immediately. Lucas sees the update within a few seconds.

**Alternate path:** Manon doesn't cancel. Lucas, suspicious, opens his ride's passenger list in the app and removes her manually. The seat frees up on the map.

**"Aha" moment:** The map updates visually and quickly — no stale data, no "ghost bookings."

**Capabilities revealed:** Passenger self-cancellation, driver manual removal of passenger, near-real-time Supabase map sync, passenger list view on driver's ride card.

---

### Journey Requirements Summary

| Journey              | Core Capabilities Required                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Lucas (Driver)       | GPS auto-position, ride creation, seat count, real-time map, Phone+PIN auth                  |
| Camille (Passenger)  | Passenger GPS centering, ride card, 1-tap booking, deep-link redirect, 1-booking enforcement |
| Théo (Organizer)     | Read-only map view — no dedicated mode needed in MVP                                         |
| Manon (Cancellation) | Self-cancellation, driver removal, near-real-time Supabase sync, passenger list view         |

---

## Web App (PWA) Specific Requirements

### Project-Type Overview

VendiBringue Covoit' is a mobile-first Single Page Application (SPA) built as a Progressive Web App (PWA). It is designed primarily for direct URL access via Messenger on smartphones, with no SEO indexing required and no desktop-first considerations.

### Browser Support Matrix

| Browser                 | Priority        | Notes                                       |
| ----------------------- | --------------- | ------------------------------------------- |
| Safari Mobile (iOS)     | **Critical**    | Primary target — iPhone users via Messenger |
| Chrome Mobile (Android) | **Critical**    | Primary target — Android users              |
| Chrome Desktop          | Supported       | Secondary — developer/testing use           |
| Firefox Mobile          | Best-effort     | Not a primary concern                       |
| Safari Desktop          | Best-effort     | Not a primary concern                       |
| IE / Legacy browsers    | ❌ Out of scope |                                             |

### Responsive Design

- **Mobile-first breakpoints only** — no desktop layout optimization required in MVP
- Minimum supported screen width: 375px (iPhone SE)
- Touch-optimized UI throughout: minimum tap target 44×44px
- No hover-dependent interactions (touch environment)

### PWA & Installability

- **`manifest.json`** configured with app name, icons, theme color, `display: standalone`
- **Service Worker** with basic offline fallback (cached shell) — graceful degradation if network lost
- **"Add to Home Screen" prompt** enabled for MVP: users on Safari (iOS) and Chrome (Android) can install the app to their home screen for a native-feel experience
- App icon and splash screen assets required

### Performance Targets

- Map rendered and interactive: **< 3 seconds** on 4G mobile
- Time to interactive (full app shell): **< 2 seconds**
- Leaflet + OpenStreetMap tile loading: progressive (tiles load as needed, map usable before all tiles load)

### Real-Time Requirements

- Supabase Realtime subscriptions for:
  - New ride appeared on map
  - Ride cancelled / removed
  - Seat count change
- Update latency target: **< 5 seconds** (acceptable for this use case)
- Graceful handling of connection drops (reconnect silently)

### Accessibility Level

- **WCAG 2.1 Level A** as baseline — basic best practices only
- Sufficient color contrast on all text/map elements
- All interactive elements reachable and tappable without precision
- No full WCAG AA audit required for MVP

### SEO Strategy

- **None** — app is not publicly indexed
- Single `<title>` and minimal meta for link previews in Messenger (Open Graph tags: title, description, image)

### Implementation Considerations

- Vue 3 Composition API + Vue Router (hash mode or HTML5 history)
- Leaflet.js for map rendering (no Google Maps API key dependency)
- Supabase JS client for auth, DB, and realtime
- Vite as build tool (fast HMR, excellent PWA plugin support via `vite-plugin-pwa`)
- Deployed on Vercel (automatic HTTPS required for PWA and GPS geolocation APIs)

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — the goal is to deliver the single core "aha" moment: opening the app and seeing the map populated with friends' departure points. Every feature that doesn't serve this moment is deferred.

**Resource Requirements:** Solo developer, ~3 months, side-project cadence (weekends/evenings). Vue 3 already known; Supabase and Geolocation API are learning discoveries within this project.

**Definition of "shipped":** The app is live on Vercel, the event URL is shared in Messenger, and at least one driver and one passenger complete the full flow in a real test scenario.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:** All 4 journeys (Lucas Driver, Camille Passenger, Théo Observer, Manon Cancellation)

**Must-Have Capabilities:**

- Phone + 4-digit PIN auth, session persisted in LocalStorage
- Bimodal entry screen (Driver / Passenger)
- GPS geolocation for driver departure positioning and passenger map centering
- Manual map tap as GPS fallback (critical given API unfamiliarity — fallback always implemented first)
- Ride creation with available seat count
- 1-tap booking with deep-link redirect to WhatsApp / SMS / Instagram
- 1-booking-per-device enforcement
- Driver can remove a passenger; passenger can self-cancel their booking
- Near-real-time map updates via Supabase Realtime (< 5 sec latency)
- PWA manifest + Add-to-Home-Screen installability

### Post-MVP Features

**Phase 2 (Growth):**

- Dynamic per-event URL generation (unique URL per event, e.g. `vendibringue.app/soiree-kevin`)
- Phone number privacy masking (revealed only at booking confirmation)
- Return trip module (same event, going-back rides)
- Seat count displayed directly on map markers

**Phase 3 (Expansion):**

- Multi-event organizer dashboard
- Open-source / self-hostable packaging

### Risk Mitigation Strategy

**Technical Risk — Geolocation API (HIGH for this developer):**

- GPS permission denial or position inaccuracy is common on Safari iOS
- _Mitigation:_ Always implement map-tap fallback first; GPS is an enhancement, not a dependency. Prototype the GPS flow in Week 1 to surface Safari-specific quirks early before building dependent features.

**Technical Risk — Supabase Realtime (MEDIUM):**

- Free plan has connection and message limits; unfamiliar API can produce subtle bugs (channels not cleaning up, duplicate subscriptions stacking)
- _Mitigation:_ Start with standard Supabase data fetching (polling) before introducing Realtime. Add Realtime only once core CRUD flows are stable. Monitor Supabase dashboard for quota usage during test events.

**Resource Risk:**

- Solo developer — if learning curve for Supabase or Geolocation exceeds estimates, first feature to cut is PWA installability (app still fully functional as a browser tab). Core map + booking flow is never cut.

---

## Functional Requirements

> ⚠️ This is the capability contract for the entire product. UX designers will only design what is listed here. Architects will only support what is listed here. Epics will only implement what is listed here.

### Identity & Session Management

- **FR1:** A user can access the app by entering their phone number and a 4-digit PIN; the system creates the account on first use (unified register/login flow)
- **FR2:** The system stores the user's session locally so they are not prompted to authenticate again on the same device
- **FR3:** A user can only hold one active role per session (driver OR passenger — not both simultaneously)
- **FR4:** A user can change their role after their initial selection within the same session

### Map & Geolocation

- **FR5:** The system can request and access the device's GPS location with the user's permission
- **FR6:** A driver can confirm their departure location via GPS auto-positioning on the map
- **FR7:** A driver can manually set their departure location by tapping on the map (GPS fallback, always available)
- **FR8:** A passenger can have the map auto-centered on their GPS location when opening the app
- **FR9:** A passenger can manually pan the map to browse rides in any area
- **FR10:** All active rides are displayed as markers on the map
- **FR11:** The map updates automatically when a ride is added, removed, or its seat availability changes — without requiring a page refresh
- **FR12:** The system visually differentiates rides with no remaining seats from rides with available seats directly on the map

### Ride Management (Driver)

- **FR13:** A driver can create a new ride by specifying their departure point and the number of available seats
- **FR14:** A driver can view the list of passengers currently booked in their ride
- **FR15:** A driver can remove a passenger from their ride
- **FR16:** A driver can cancel their entire ride, which frees all reserved seats
- **FR17:** A driver can access a contact entry point for each of their passengers

### Booking (Passenger)

- **FR18:** A passenger can view the details of a ride by tapping its marker on the map
- **FR19:** A passenger can book a seat in a ride with a single action
- **FR20:** The system enforces a limit of one active booking per session (identified via LocalStorage session token)
- **FR21:** The system prevents a ride from being over-booked beyond its declared seat count (enforced server-side)
- **FR22:** A passenger can cancel their own booking
- **FR23:** A passenger receives a contact shortcut to the driver immediately after booking
- **FR24:** A passenger with an active booking can view their booking status and driver contact links at any time without re-tapping the map marker

### Empty & Feedback States

- **FR25:** The system displays a contextual empty state message when no rides are currently available on the map

### Communication Deep-Links

- **FR26:** The system generates a pre-filled WhatsApp message link directed to the driver's phone number upon booking
- **FR27:** The system generates a pre-filled SMS link directed to the driver's phone number as a fallback contact
- **FR28:** The system provides an Instagram direct message link to the driver as an additional contact option
- **FR29:** Deep-links open the target native messaging app directly, without requiring copy-paste of the phone number

### Progressive Web App

- **FR30:** The application is installable on iOS (Safari) and Android (Chrome) via the "Add to Home Screen" mechanism
- **FR31:** The application displays a basic offline fallback screen when network connectivity is lost
- **FR32:** The application generates link previews (title, description, image) when its URL is shared in Messenger or other messaging apps

---

## Non-Functional Requirements

### Performance

- **NFR1 (Load Time):** L'interface de la carte interactive doit être totalement opérationnelle (fond de carte chargé + marqueurs affichés) en moins de **3 secondes** sur une connexion 4G standard.
- **NFR2 (Real-time Latency):** Les mises à jour de statut (nouveau trajet, réservation de siège) doivent être reflétées sur les écrans des autres utilisateurs en moins de **5 secondes** via Supabase Realtime.
- **NFR3 (Concurrency):** Le système doit gérer jusqu'à **50 utilisateurs simultanés** sans dégradation de performance notable (latence < 500ms pour les requêtes API).

### Reliability & Availability

- **NFR4 (Uptime):** L'application doit viser un taux de disponibilité de 99.9% pendant la fenêtre critique de l'événement (période de 48h entourant la soirée).
- **NFR5 (Offline Resilience):** En cas de perte de réseau (zone blanche), l'application doit afficher un écran d'erreur informatif clair plutôt qu'une erreur navigateur générique (via Service Worker PWA).

### Security & Privacy

- **NFR6 (Data Integrity):** Toutes les communications entre le client et Supabase doivent être chiffrées via TLS (HTTPS).
- **NFR7 (Minimal Exposure):** Bien que les numéros de téléphone soient visibles pour la coordination, aucune donnée utilisateur ne doit être indexable par les moteurs de recherche (balise `noindex` et absence de compte public).
- **NFR8 (Session Expiry):** La session utilisateur dans le LocalStorage doit rester active au moins 7 jours pour couvrir la préparation et l'après-soirée sans reconnexion forcée.

### Accessibility & UX

- **NFR9 (Compliance):** L'interface doit respecter les critères de base de l'accessibilité web (**WCAG 2.1 Level A**) : contrastes de couleurs lisibles, cibles tactiles de taille suffisante (min 44x44px), et navigation clavier fonctionnelle.
- **NFR10 (PWA Experience):** Le manifeste PWA doit être correctement configuré pour permettre l'installation sans barre d'adresse navigateur, offrant une expérience "App-like" fluide.

### Localization

- **NFR11 (Language):** L'intégralité de l'interface utilisateur (labels, messages d'erreur, placeholders) doit être en **Français**.
