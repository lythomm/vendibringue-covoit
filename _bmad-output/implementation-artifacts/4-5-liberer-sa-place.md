# Story 4.5: Libérer sa place (Annulation Passager)

## 1. Context & Purpose
Plans change. If a passenger finds another solution or can't come, they must free their seat immediately so someone else can take it.

## 2. Acceptance Criteria

### 2.1 The Action
- [ ] **Button**: A secondary "Annuler ma réservation" button (Red Text/Bouton Discret) in the "Mon Siège" dashboard.
- [ ] **Confirmation**: Shows a confirmation popup: "Veux-tu libérer ta place ?".

### 2.2 System Update
- [ ] **Record**: Deletes the entry from the `bookings` table (or marks as `cancelled`).
- [ ] **Counter**: The `available_seats` for that ride is incremented back.
- [ ] **Real-time**: The marker on the map turns back from Red/Orange to Green/Orange accordingly for everyone.

## 3. Technical Implementation Tasks

### 3.1 Service Interaction
- [ ] Implement `cancelBooking(bookingId)` in the service.
- [ ] Ensure RLS only allows the passenger to delete their own booking.

---
**Status**: [NEW]
**Epic**: 4. Réserver son Siège
**Priority**: Medium
