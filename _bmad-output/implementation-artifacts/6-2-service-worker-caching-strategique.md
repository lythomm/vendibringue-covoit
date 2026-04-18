# Story 6.2: Service Worker & Caching Stratégique (Résilience)

## 1. Context & Purpose
Parties often happen in areas with spotty network. Once the user has loaded their ride info, it should remain accessible even if they lose 4G/5G.

## 2. Acceptance Criteria

### 2.1 Asset Caching
- [ ] **Pre-cache**: Inter Font, Logo, Background CSS, and the main App bundle.
- [ ] **Strategy**: "Cache First" for static files to speed up the launch.

### 2.2 Dynamic Caching
- [ ] **Ride Data**: Cache the last known state of `rides` and `bookings` in IndexedDB or JSON cache.
- [ ] **Offline View**: If the network is down, the app shows the last fetched data with an "Offline" badge.

## 3. Technical Implementation Tasks

### 3.1 PWA Engine (`vite.config.ts`)
- [ ] Configure `vite-plugin-pwa` with `workbox` options.
- [ ] Register the service worker in `src/main.ts`.

---
**Status**: [NEW]
**Epic**: 6. Expérience Installable & Résilience (PWA)
**Priority**: High
