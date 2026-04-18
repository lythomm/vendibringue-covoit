# Story 5.4: Visibilité Identité Sécurisée (Privacy by Design)

## 1. Context & Purpose
Phone numbers are sensitive. We want to avoid mass scraping of the guest list while allowing coordination between relevant parties.

## 2. Acceptance Criteria

### 2.1 Reveal Logic
- [ ] **Drivers**: Their phone number is ONLY visible to the passengers who have a CONFIRMED booking in their ride.
- [ ] **Passengers**: Their phone number is ONLY visible to the driver of the ride they have booked.
- [ ] **Stranger View**: A user browsing the map sees "Prénom" only, and no phone number.

### 2.2 Technical Enforcement
- [ ] Use Supabase **Row Level Security (RLS)** to return the `phone` field as `null` or `hidden` if the relation doesn't exist.
- [ ] *Fallback implementation*: A specific RPC `get_ride_details(ride_id)` that only returns sensitive contact info if the criteria are met.

## 3. Technical Implementation Tasks

### 3.1 Supabase RLS / RPC
- [ ] Define the policy: `SELECT (phone) where exists (select 1 from bookings where ride_id = ...)` (Simplified logic).

---
**Status**: [NEW]
**Epic**: 5. Mise en Relation & Coordination
**Priority**: High (Privacy)
