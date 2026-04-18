# Story 4.1: Consultation des détails d'un trajet (Vue Passager)

## 1. Context & Purpose
When a passenger looks for a ride, they need to know if it's the right one for them. The Bottom Sheet is the central information hub.

## 2. Acceptance Criteria

### 2.1 Information Display
- [ ] **Driver Identity**: Displays the first name and avatar (if any) of the driver.
- [ ] **Departure Point**: Shows the name of the departure city/area clearly.
- [ ] **Real-time Seats**: Displays "X places restantes" in a large, highlighted badge.
- [ ] **Status Badge**: Show "COMPLET" if no seats are left.

### 2.2 Navigation Integration
- [ ] Clicking the marker on the map smoothly centers the view and slides up the details sheet.

## 3. Technical Implementation Tasks

### 3.1 Component (`src/components/RideDetailsSheet.vue`)
- [ ] Bind component props to the `selectedRide` from the store.
- [ ] Add conditional styling for the "Full" state.

---
**Status**: [NEW]
**Epic**: 4. Réserver son Siège
**Priority**: High
