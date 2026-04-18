# Story 2.3: Marqueurs Véhicules Interactifs

## 1. Context & Purpose
This is the core "inventory" of the app. Passengers must see at a glance where rides are starting from and if they have space.

## 2. Acceptance Criteria

### 2.1 Marker Visualization
- [ ] **Data Source**: Fetched from the `rides` table in Supabase.
- [ ] **Dynamic Icon**:
    - **Green Pin**: 2 or more seats available.
    - **Orange Pin**: Only 1 seat left.
    - **Red/Grey Pin**: Full (0 seats).
- [ ] **Badging**: A small circle on top of the icon shows the number of available seats (e.g., "3").

### 2.2 Real-time Sync
- [ ] **Updates**: Markers appear/disappear/change color in real-time as drivers add rides or seats are booked (Supabase Realtime).

## 3. Technical Implementation Tasks

### 3.1 Data Flow
- [ ] Implement `fetchRides` and `subscribeToRides` in a `rideStore` or service.
- [ ] Map the database records to Leaflet `L.marker` objects.

### 3.2 Marker Component Logic
- [ ] Create a utility to generate custom `DivIcon` for Leaflet based on seat count.

---
**Status**: [NEW]
**Epic**: 2. La Carte de Convergence
**Priority**: High
