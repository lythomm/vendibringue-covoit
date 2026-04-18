# Story 5.1: Raccourci de contact WhatsApp (Priorité)

## 1. Context & Purpose
WhatsApp is the de facto standard for group coordination. We want to bridge the "Map discovery" and "Chat coordination" gap in one single tap.

## 2. Acceptance Criteria

### 2.1 The WhatsApp Button
- [ ] **Visual**: Large Green button with the WhatsApp icon.
- [ ] **UX Context**: Appears once a booking is confirmed (Passenger side) or when clicking a passenger in the list (Driver side).

### 2.2 Deep-Link Logic
- [ ] **URL**: `https://wa.me/{phone}?text={message}`.
- [ ] **Message Content**:
    - For Passenger: "Hello ! C'est [Nom], j'ai réservé une place dans ton covoit via VendiBringue 🚗 On s'organise ?"
    - For Driver: "Salut [Nom] ! C'est [Conducteur] de VendiBringue, je te confirme ta place pour la Bringue !"

## 3. Technical Implementation Tasks

### 3.1 Link Helper (`src/utils/links.ts`)
- [ ] Implement `getWhatsAppLink(phone, message)` with URL encoding.
- [ ] Ensure non-French phone numbers (if any) are handled (international format required for `wa.me`).

---
**Status**: [NEW]
**Epic**: 5. Mise en Relation & Coordination
**Priority**: High
