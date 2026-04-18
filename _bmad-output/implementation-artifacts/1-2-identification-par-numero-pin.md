# Story 1.2: Identification par Numéro & PIN

## 1. Context & Purpose
To provide a smooth, "unified" experience where the user doesn't have to choose between "Register" and "Login". The logic identifies the user based on their phone number and validates access via a 4-digit PIN.

## 2. Acceptance Criteria

### 2.1 Unified Identification Flow
- [ ] **Discovery**: When the user submits the form, the system checks if a record with the given `phone` already exists in the `profiles` table.
- [ ] **Case: New User**:
    - [ ] Create a new record in `profiles` with `name`, `phone`, and a **hashed** version of the `pin`.
    - [ ] Log the user in immediately.
- [ ] **Case: Returning User**:
    - [ ] Compare the **hash** of the provided `pin` with the stored `pin` hash.
    - [ ] If match: Grant access.
    - [ ] If mismatch: Show a clear error message "Code PIN incorrect".

### 2.2 Security (Small Layer of Protection)
- [ ] **PIN Hashing**: The PIN must *never* be stored as plaintext in Supabase.
- [ ] **Implementation**: Use the native `crypto.subtle` API to generate a **SHA-256** hash of the PIN before sending it to the database.

### 2.3 Error Handling
- [ ] **Network Errors**: Show a "Erreur de connexion" toast if Supabase is unreachable.
- [ ] **Validation**: Ensure the PIN is exactly 4 digits and the Phone follows a valid format before calling the service.

## 3. Technical Implementation Tasks

### 3.1 Auth Service (`src/lib/auth-service.ts`)
- [ ] Create a `hashPin(pin: string): Promise<string>` utility using `crypto.subtle`.
- [ ] Create an `identifyUser(name, phone, pin)` function that handles the lookup and conditional insert/validation.

### 3.2 Pinia Integration (`src/stores/auth.ts`)
- [ ] Add an `identify(name, phone, pin)` action to `useAuthStore`.
- [ ] Save the resulting user profile in the `user` state and persist it to `localStorage` for session recovery.

---
**Status**: [NEW]
**Epic**: 1. Authentication & Identity
**Priority**: High
