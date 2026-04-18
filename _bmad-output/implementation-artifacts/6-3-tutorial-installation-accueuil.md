# Story 6.3: Tutorial "Ajouter à l'écran d'accueil"

## 1. Context & Purpose
Many users don't know how to install a PWA, especially on iOS. We need a non-intrusive guide to help them "App-ify" the experience.

## 2. Acceptance Criteria

### 2.1 Installation Banner
- [ ] **Detection**: Detect if the app is already running in `standalone` mode.
- [ ] **Visibility**: Show a small banner or "Nudge" at the bottom of the Auth Gate or Dashboard if not installed.

### 2.2 Device-Specific Guidance
- [ ] **iOS**: Show a mini-popup showing the "Share" icon + "Add to Home Screen" text.
- [ ] **Android**: Trigger the native `beforeinstallprompt` event.

## 3. Technical Implementation Tasks

### 3.1 PWA Handler (`src/composables/usePWA.ts`)
- [ ] Implement detection logic for installation status.
- [ ] Create a UI component for the nudge.

---
**Status**: [NEW]
**Epic**: 6. Expérience Installable & Résilience (PWA)
**Priority**: Medium
