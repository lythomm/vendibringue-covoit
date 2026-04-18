# Story 5.3: Coordination par Instagram (Liaison Profil)

## 1. Context & Purpose
For many young users, coordination through Instagram Stories or DMs is common. Having a direct link to the profile adds a layer of social trust.

## 2. Acceptance Criteria

### 2.1 Profile Integration
- [ ] **Condition**: If the user (driver or passenger) has filled their "Instagram Handle" during registration (optional field).
- [ ] **Button**: Small Instagram icon button appears in the contact row.

### 2.2 Navigation
- [ ] Opens `https://instagram.com/{handle}` in a new tab.

## 3. Technical Implementation Tasks

### 3.1 Profile Logic
- [ ] Add `instagram_handle` to the `src/stores/auth.ts` and the Supabase `profiles` table.

---
**Status**: [NEW]
**Epic**: 5. Mise en Relation & Coordination
**Priority**: Low
