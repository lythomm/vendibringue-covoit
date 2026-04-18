# Story 1.3: Sélection du Rôle (Pilote ou Passager)

## 1. Context & Purpose
Once identified, the user must define their current intent: Are they offering a ride or looking for one? This choice dictates the initial dashboard view (Driver mode vs. Passenger mode).

## 2. Acceptance Criteria

### 2.1 Role Selection Interface
- [ ] **Visual Appearance**: Uses the **Airbnb Premium** cards (`rounded-xl`, `bg-surface`, `shadow`).
- [ ] **Dual Options**:
    - **"Je propose une place"**: Includes a Car icon (Lucide `Car`).
    - **"Je cherche une place"**: Includes a Search or Person icon (Lucide `Search`).
- [ ] **Interactivity**: 
    - Full-width card buttons for easy tapping on mobile.
    - Hover/Active states matching the Forest Green theme.

### 2.2 Redirection Logic
- [ ] **Action**: Clicking a role updates the state and navigates to the Map Dashboard.
- [ ] **Conditional Appearance**: This screen only appears if `authStore.role` is null. If the user is a returning user with a stored role, this screen is bypassed (see Story 1.4).

## 3. Technical Implementation Tasks

### 3.1 UI Component (`src/views/RoleSelection.vue`)
- [ ] Create the layout with two large clickable sections.
- [ ] Apply the beige/green color palette.

### 3.2 State Management
- [ ] Implement the `setRole(role: 'driver' | 'passenger')` action in `authStore`.
- [ ] Trigger navigation to `/dashboard`.

---
**Status**: [NEW]
**Epic**: 1. Authentication & Identity
**Priority**: Medium
