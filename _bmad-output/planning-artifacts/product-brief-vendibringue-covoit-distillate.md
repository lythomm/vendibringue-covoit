---
title: "Product Brief Distillate: VendiBringue Covoit'"
type: llm-distillate
source: "product-brief-vendibringue-covoit.md"
created: "2026-04-17T15:02:00+02:00"
purpose: "Token-efficient context for downstream PRD creation"
---

## Requirements Hints
*   **Unified Account Schema:** A single identity per user (Phone Number + PIN), completely neutralizing the traditional "Driver Profile" vs "Passenger Profile" rigid splits.
*   **Auth Flow (Frictionless):** Prompt for phone number. Prompt for 4-digit PIN. If phone exists, validate PIN. If it's a new phone, auto-register the account with that PIN. Zero email verification.
*   **State Persistence:** Authenticated session MUST be preserved aggressively in browser `LocalStorage` (e.g., 7 days or more) to prevent users from reconnecting repeatedly during the event.
*   **Anti-Spam Constraint:** Strictly enforce a limit of 1 booked/offered seat or action per device/storage to prevent trolls from booking an entire car.
*   **Ride Management:** A Driver must have a mechanism to remove a Passenger from their car. A Passenger must have a mechanism to cancel their own booking, immediately freeing the graphical seat on the map.

## Privacy & Security Context
*   **Phone Visibility (V1):** The phone number serves as the primary key and will be VISIBLE to other participants who open the map. There is no complex privacy masking in V1.
*   **Event Boundary:** The unique URL of the event acts as the only access barrier. The assumption is a trusted circle of friends. No strict "event passwords" needed for now.

## Technical & Stack Context
*   **Frontend Ecosystem:** Vue 3 (Composition API), optimizing for reactivity and quick logic.
*   **Backend & Real-time:** Supabase (for database, Auth mapping if custom, and real-time socket updates to the map as people book seats).
*   **Mapping:** Leaflet with OpenStreetMap (chosen specifically to avoid Mapbox credit card friction / token limits).
*   **Hosting:** Vercel for zero-config CI/CD.
*   **Messaging Integration:** Heavy reliance on Deep-Links. Formats like `https://wa.me/{phone_number}` or `sms:{phone_number}` to push the chat outward.

## Rejected Ideas
*   **In-app Chat System:** Rejected decisively due to high complexity and low value among friends. Deep-links are considered "magical" enough.
*   **Standard Registration Forms:** Replaced by the Phone+PIN combo and localized cookies.
*   **Search/Filter Lists:** Replaced by Map Geolocation/Radar logic.

## Scope Signals
*   **MVP:** 1 URL = 1 Event scope. No multi-event dashboards connecting different parties. 
