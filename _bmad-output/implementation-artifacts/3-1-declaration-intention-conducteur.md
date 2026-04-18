# Story 3.1: Déclaration d'Intention (Activer le mode Conducteur)

## 1. Context & Purpose
The user wants to fulfill their role as a driver. We need to clear the screen of passenger noise and focus on the trajectory creation.

## 2. Acceptance Criteria

### 2.1 Interaction
- [ ] **Main CTA**: A large "Proposer un covoit" button accessible from the dashboard.
- [ ] **Mode Sweep**: When clicked, the UI shifts to "Driver Mode". Any open passenger info sheets are closed.

### 2.2 Creation Bottom Sheet
- [ ] **Activation**: A new Bottom Sheet (dedicated to creation) appears from the bottom.
- [ ] **Header**: "Nouveau trajet vers la Bringue".

## 3. Technical Implementation Tasks

### 3.1 UI Actions
- [ ] Implement `openDriverFlow` in the map view.
- [ ] Manage the `uiState` (enum: Browsing, Offering, Booking).

---
**Status**: [NEW]
**Epic**: 3. Proposer un Covoit'
**Priority**: High
