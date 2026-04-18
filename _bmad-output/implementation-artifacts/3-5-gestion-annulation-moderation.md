# Story 3.5: Gestion de son Trajet (Annulation & Modération)

## 1. Context & Purpose
The driver is the owner of their car space. They need to be able to cancel the trip if their plans change, or remove a passenger if there is a mistake/conflict.

## 2. Acceptance Criteria

### 2.1 Driver Dashboard
- [ ] **Access**: When a driver already has an active ride, clicking the main FAB (or a "Mon Trajet" button) opens their management sheet.
- [ ] **Passenger List**: Displays the names of all passengers who have booked a seat in this ride.

### 2.2 Annulment
- [ ] **Full Cancellation**: A red "Annuler mon trajet" button.
    - [ ] Asks for confirmation.
    - [ ] Sets ride status to `cancelled` and frees all links.
    - [ ] Marker disappears from the map.

### 2.3 Passenger Removal
- [ ] **Moderation**: A "Retirer" button next to each passenger.
    - [ ] Frees the seat specifically for that passenger.
    - [ ] Real-time update for the passenger (who sees their booking cancelled).

## 3. Technical Implementation Tasks

### 3.1 Logic
- [ ] Implement `cancelRide(id)` and `removePassenger(rideId, userId)` in the ride service.
- [ ] Ensure only the `driver_id` can perform these actions (Supabase RLS).

---
**Status**: [NEW]
**Epic**: 3. Proposer un Covoit'
**Priority**: Medium
