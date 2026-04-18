# Story 3.4: Finalisation & Publication du Trajet

## 1. Context & Purpose
The driver has picked their spot and seats. Now they need to commit the data to the community.

## 2. Acceptance Criteria

### 2.1 Validation
- [ ] **Check**: The "Publish" button is only active if a Departure point has been selected and seats > 0.
- [ ] **Data**: Captures Driver Profile ID, Latitude, Longitude, Total Seats, and Status = 'active'.

### 2.2 Persistence
- [ ] **Action**: Record is inserted into the Supabase `rides` table.
- [ ] **Feedback**: A satisfying success state (e.g., a short "Confetti" or the creation sheet closing smoothly).

### 2.3 Post-Publication
- [ ] The driver marker (Story 2.3) appears instantly for all other users on the map.

## 3. Technical Implementation Tasks

### 3.1 Supabase Integration
- [ ] Implement `createRide` in `src/services/ride.ts`.
- [ ] Handle potential errors (e.g., network failure) with a retry Toast.

---
**Status**: [NEW]
**Epic**: 3. Proposer un Covoit'
**Priority**: High
