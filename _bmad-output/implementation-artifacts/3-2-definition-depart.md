# Story 3.2: Définition du Départ (GPS ou Manuel)

## 1. Context & Purpose
The driver needs to tell the system where they are starting from. Typing an address is slow; tapping a map is fast.

## 2. Acceptance Criteria

### 2.1 Spatial Capture
- [ ] **GPS Shortcut**: A button "C'est ici" that uses the user's current GPS coordinates (if available).
- [ ] **Map interaction**: While the "Creation Sheet" is open, clicking anywhere on the map drops a temporary "Departure" marker.
- [ ] **Visual Feedback**: A dashed line appears between this "Departure" point and the "Epicenter" (Destination).

### 2.2 Re-centering
- [ ] The map should auto-adjust the zoom to show both the Departure and the Epicenter.

## 3. Technical Implementation Tasks

### 3.1 Leaflet Integration
- [ ] Listen to `map.on('click')` only when `creationState` is active.
- [ ] Add `L.polyline` (dashed) for the trajectory preview.

---
**Status**: [NEW]
**Epic**: 3. Proposer un Covoit'
**Priority**: High
