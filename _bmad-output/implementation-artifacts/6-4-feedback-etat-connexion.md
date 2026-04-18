# Story 6.4: Feedback d'État de Connexion

## 1. Context & Purpose
In a collaborative app, users must know if they are "online" to avoid false hope (e.g., thinking they booked a seat when the request never left the device).

## 2. Acceptance Criteria

### 2.1 Online/Offline Status
- [ ] **Indicator**: A subtle "Mode Hors-ligne" badge appears at the top if the browser reports `navigator.onLine === false`.
- [ ] **Locking**: Interactive buttons that require server confirmation (Publish Ride, Book Seat) are visually disabled and greyed out.

### 2.2 Re-connection
- [ ] **Toast**: When connection is restored, show a brief success toast: "De retour en ligne !".

## 3. Technical Implementation Tasks

### 3.1 Global State
- [ ] Manage `isOffline` boolean in the root store.
- [ ] Add event listeners for `online` and `offline` browser events.

---
**Status**: [NEW]
**Epic**: 6. Expérience Installable & Résilience (PWA)
**Priority**: Medium
