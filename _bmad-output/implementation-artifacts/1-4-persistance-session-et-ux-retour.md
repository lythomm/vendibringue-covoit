# Story 1.4: Persistance de Session & UX de Retour

## 1. Context & Purpose
To minimize friction for returning participants during the 48h event. If the phone number and role are already known, we simplify the UI and the steps to reach the map.

## 2. Acceptance Criteria

### 2.1 Persistence (LocalStorage)
- [ ] **Data Storage**: Name, Phone Number, and Chosen Role are saved in `localStorage` upon successful login/selection.
- [ ] **Store Recovery**: On app load, `useAuthStore` initializes state from `localStorage`.

### 2.2 Returning User UX (Auth Gate Optimization)
- [ ] **Conditional UI**: If a `phone` number is found in the local state:
    - [ ] **Hide** the phone input field.
    - [ ] **Hide** the name input field.
    - [ ] **Show** a "Content de te revoir, [Nom]" header.
    - [ ] **Show** only the PIN input field for verification.
- [ ] **Option to "Switch User"**: Provide a small link/button to clear storage if the device needs to be used by someone else.

### 2.3 Direct Navigation
- [ ] **Logic**: If the PIN verification is successful AND `authStore.role` is already set:
    - [ ] Navigate directly to `/dashboard` (Map).
    - [ ] Bypass the Role Selection screen.

## 3. Technical Implementation Tasks

### 3.1 Store Logic (`src/stores/auth.ts`)
- [ ] Implement `persist` plugin or manual `localStorage` sync for the `auth` state.
- [ ] Add a `computed` property `isNewDevice` to drive the UI condition.

### 3.2 View Logic (`src/views/AuthView.vue`)
- [ ] Add conditional rendering (`v-if="!storedPhone"`) for Phone/Name fields.
- [ ] Update the submit logic to handle PIN-only verification for returning users.

---
**Status**: [NEW]
**Epic**: 1. Authentication & Identity
**Priority**: Medium
