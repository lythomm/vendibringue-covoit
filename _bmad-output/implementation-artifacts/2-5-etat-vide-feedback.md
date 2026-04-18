# Story 2.5: État Vide & Feedback de Recherche

## 1. Context & Purpose
When no one has proposed a ride yet, the map shouldn't feel "broken" or empty. We need to encourage those who have a car to start the movement.

## 2. Acceptance Criteria

### 2.1 Visual Feedback
- [ ] **Empty State**: If the `rides` array is empty, show a discrete but visible card/overlay on top of the map.
- [ ] **Copy**: "Il n'y a personne sur la route pour le moment... Sois le premier à proposer des places !"
- [ ] **Call to Action**: A button "C'est moi le Sam" which triggers the driver flow (Story 3.1).

### 2.2 Smooth Transition
- [ ] **Hiding**: The empty state message automatically disappears as soon as one ride marker is added to the map.

## 3. Technical Implementation Tasks

### 3.1 Component (`src/components/EmptyMapState.vue`)
- [ ] Create a simple UI card with the message and CTA.
- [ ] Conditional rendering based on `rideStore.allRides.length === 0`.

---
**Status**: [NEW]
**Epic**: 2. La Carte de Convergence
**Priority**: Low (Polishing)
