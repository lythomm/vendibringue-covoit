# Story 3.3: Le Compteur de Places "Huge Spot"

## 1. Context & Purpose
Selecting the number of seats should be a delightful, tactile experience. No dropdowns, no keyboards. Just a giant +/- interaction.

## 2. Acceptance Criteria

### 2.1 The Component
- [ ] **Numeric display**: A massive, bold number in the center of the bottom sheet.
- [ ] **Tap targets**: Two large circular buttons (`-` and `+`) at least 64x64px.
- [ ] **Constraints**:
    - Minimum: 1 seat.
    - Maximum: 8 seats (SUV/Van limit).

### 2.2 Visual Feedback
- [ ] **Animations**: A subtle scaling effect or "rolling counter" animation when the number changes.
- [ ] **Haptics**: (Optional but recommended for mobile) A slight vibration on click.

## 3. Technical Implementation Tasks

### 3.1 Component (`src/components/ui/HugeCounter.vue`)
- [ ] Implement the logic for increment/decrement with clamping.
- [ ] Style with Tailwind for a premium "Toss/Lydia" look.

---
**Status**: [NEW]
**Epic**: 3. Proposer un Covoit'
**Priority**: Medium (UX/Joy)
