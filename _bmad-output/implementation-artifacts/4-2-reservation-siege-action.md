# Story 4.2: Réservation d'un siège (Action Express)

## 1. Context & Purpose
The faster a passenger can book, the better. We avoid complex carts or flows. One click is enough because the user is already identified.

## 2. Acceptance Criteria

### 2.1 The "Réserver" Button
- [ ] **Visibility**: Only appears if seats are > 0 and the user hasn't already booked another ride.
- [ ] **Action**: One-tap triggers the booking process.
- [ ] **Pre-validation**: Check on server/Supabase side if a seat is still available at the exact moment of the click.

### 2.2 Transactional Integrity
- [ ] **Rule**: A user can only have ONE active booking (or be a driver of one ride) at a time.
- [ ] **Record**: Insertion in the `bookings` table with `passenger_id` and `ride_id`.

## 3. Technical Implementation Tasks

### 3.1 Supabase Service (`src/services/booking.ts`)
- [ ] Implement `createBooking` function.
- [ ] Use a database function or trigger to update the `available_seats` count in the `rides` table synchronously.

---
**Status**: [NEW]
**Epic**: 4. Réserver son Siège
**Priority**: High
