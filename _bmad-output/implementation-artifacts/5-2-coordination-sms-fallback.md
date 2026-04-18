# Story 5.2: Coordination par SMS (Fallback Universel)

## 1. Context & Purpose
Not everyone uses WhatsApp. SMS remains the most compatible fallback.

## 2. Acceptance Criteria

### 2.1 The SMS Button
- [ ] **Visual**: Secondary button "SMS" next to the WhatsApp button.
- [ ] **Logic**: Opens the native messaging app.

### 2.2 Device Compatibility
- [ ] **iOS**: Uses `sms:{phone}&body={message}`.
- [ ] **Android**: Uses `sms:{phone}?body={message}`.
- [ ] **Helper**: Detect the user agent to use the correct separator (`?` vs `&`).

## 3. Technical Implementation Tasks

### 3.1 Link Helper (`src/utils/links.ts`)
- [ ] Implement `getSMSLink(phone, message)` with OS detection.

---
**Status**: [NEW]
**Epic**: 5. Mise en Relation & Coordination
**Priority**: Medium
