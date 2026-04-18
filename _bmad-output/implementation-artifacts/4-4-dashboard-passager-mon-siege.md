# Story 4.4: Vue "Mon Siège" (Dashboard Passager)

## 1. Context & Purpose
Once booked, the passenger needs a stable place to find the driver's info and coordinate the departure.

## 2. Acceptance Criteria

### 2.1 The Dashboard Card
- [ ] **Access**: A specific "Mon Trajet" button or automatically opening bottom sheet when the user revisits the app.
- [ ] **Driver Details**: Full name and phone number (now revealed since booking is confirmed).
- [ ] **Coordinate Button**: Primary CTA to "Contacter [Nom]" which triggers the deep-links (Epic 5).

### 2.2 Map Focus
- [ ] The map highlights the ride marker the user is currently booked into (e.g., a "glow" effect).

## 3. Technical Implementation Tasks

### 3.1 State Persistence
- [ ] Fetch the active booking for the current user in `onMounted`.
- [ ] Set `currentBooking` in the store.

---
**Status**: [NEW]
**Epic**: 4. Réserver son Siège
**Priority**: High
