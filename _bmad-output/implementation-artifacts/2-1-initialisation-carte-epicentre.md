# Story 2.1: Initialisation de la Carte & Épicentre

## 1. Context & Purpose
The map is the theater of coordination. Immediately after identification, the user must see where the "Bringue" is taking place. This visual focal point creates the "convergence" effect.

## 2. Acceptance Criteria

### 2.1 Map Setup
- [ ] **Engine**: Uses **Leaflet.js** with OpenStreetMap tiles.
- [ ] **Scale**: Full-screen view (`h-screen w-full`).
- [ ] **Default View**: Centered on the Epicenter coordinates.
- [ ] **Style**: Minimalist map tiles (e.g., CartoDB Positron) to highlight the markers and maintain the premium beige/green aesthetic.

### 2.2 The Epicenter (The "Maison Bringue")
- [ ] **Coordinates**: `43.518838, 1.829667`.
- [ ] **Marker Visual**: A custom iconic marker (e.g., unique Gold/Green house or party icon).
- [ ] **Tooltip/Popup**: Always visible or appearing on tap saying "La Bringue est ici !".

## 3. Technical Implementation Tasks

### 3.1 Map Component (`src/components/MapDashboard.vue`)
- [ ] Initialize Leaflet map.
- [ ] Define the `epicenter` constant.
- [ ] Add the fixed marker with a custom `L.icon`.

### 3.2 View Integration
- [ ] Add `MapDashboard.vue` to `src/views/DashboardView.vue`.

---
**Status**: [NEW]
**Epic**: 2. La Carte de Convergence
**Priority**: High (Core feature)
