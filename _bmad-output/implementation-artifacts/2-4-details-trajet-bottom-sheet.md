# Story 2.4: Détails Trajet & Interaction (Bottom Sheet)

## 1. Context & Purpose
When a user is interested in a ride, they need more info (Driver Name, Departure City) and a clear CTA to book. The Bottom Sheet is the standard mobile-first pattern for this.

## 2. Acceptance Criteria

### 2.1 Interaction
- [ ] **Trigger**: Tapping a vehicle marker (Story 2.3) opens the Bottom Sheet.
- [ ] **Dismissal**: Tapping the map background or swiping down closes the sheet.

### 2.2 Visual Layout (The "Card")
- [ ] **Header**: Rounded top corners (3xl), Beige background (`bg-brand-beige`).
- [ ] **Content**:
    - [ ] Driver's Name (Large).
    - [ ] Departure Point/City name.
    - [ ] "Seats Available" count display.
- [ ] **Primary Action**: Huge "Réserver ma place" button (Vert Action).

### 2.3 State Management
- [ ] The `selectedRide` is reactive. The Bottom Sheet displays data for the currently selected marker.

## 3. Technical Implementation Tasks

### 3.1 Component (`src/components/RideDetailsSheet.vue`)
- [ ] Implement the sliding drawer logic (use a library or custom CSS transitions).
- [ ] Add the "Réserver" button with a loading state (`isBooking`).

### 3.2 Integration
- [ ] Listen to Leaflet `click` events on markers to update the state.

---
**Status**: [NEW]
**Epic**: 2. La Carte de Convergence
**Priority**: High
