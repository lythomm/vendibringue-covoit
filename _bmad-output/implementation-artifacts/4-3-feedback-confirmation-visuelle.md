# Story 4.3: Confirmation visuelle & Feedback (Effet Wouahou)

## 1. Context & Purpose
Booking a seat to go to a party should feel like an event in itself. Emotional design increases user engagement.

## 2. Acceptance Criteria

### 2.1 Visual Celebration
- [ ] **Action**: Upon successful booking, trigger a short confetti burst or a pulse animation on the vehicle marker.
- [ ] **Banner**: A success toast appears at the top: "C'est bon ! Tu montes avec [Nom du Conducteur]".

### 2.2 Transition
- [ ] The "Réserver" button changes to "C'est ma place" (Grey/Green disabled or informative state).
- [ ] The Bottom Sheet stays open for 2 seconds then updates the view mode to "My Seat Dashboard".

## 3. Technical Implementation Tasks

### 3.1 UX Elements
- [ ] Integrate a lightweight confetti library (like `canvas-confetti`) or a simple CSS animation.
- [ ] Trigger a success Toast.

---
**Status**: [NEW]
**Epic**: 4. Réserver son Siège
**Priority**: Medium
