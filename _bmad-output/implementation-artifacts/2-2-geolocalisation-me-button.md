# Story 2.2: Géolocalisation & Bouton "Ma Position"

## 1. Context & Purpose
Users need to know where they are relative to the event and available rides. A quick "Find me" button is standard for any map-based mobility app.

## 2. Acceptance Criteria

### 2.1 "Me" Button (FAB)
- [ ] **Visual**: Circular Floating Action Button (FAB) in the bottom right corner (above the bottom sheet).
- [ ] **Icon**: Lucide `Locate` or `Navigation`.
- [ ] **Style**: White background, `shadow-lg`, accent color icon.

### 2.2 Geolocation Logic
- [ ] **Action**: Tapping the button triggers the browser Geolocation API.
- [ ] **Map Behavior**: The map smoothly pans/zooms to the user's current coordinates.
- [ ] **Marker**: A distinct blue pulse/marker identifies the user's position.

## 3. Technical Implementation Tasks

### 3.1 Geolocation Service (`src/services/geo.ts`)
- [ ] Wrapper for `navigator.geolocation.getCurrentPosition`.
- [ ] Handle permission errors with a non-intrusive Toast.

### 3.2 UI Integration
- [ ] Add the FAB to `src/components/MapDashboard.vue`.
- [ ] Bind the `locateMe` method to the Leaflet map state.

---
**Status**: [NEW]
**Epic**: 2. La Carte de Convergence
**Priority**: Medium
