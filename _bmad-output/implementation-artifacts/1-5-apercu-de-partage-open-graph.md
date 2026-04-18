# Story 1.5: Aperçu de partage (Open Graph)

## 1. Context & Purpose
The success of the carpooling system depends on its visibility. When organizers share the link on WhatsApp, Messenger, or Instagram DMs, it must look professional and inviting to encourage participation.

## 2. Acceptance Criteria

### 2.1 Rich Metadata
- [ ] **Configured Tags**:
    - `og:title`: "VendiBringue Covoit' - Ensemble vers la Bringue"
    - `og:description`: "Recompose ta team, propose tes places ou trouve ton covoit' pour le weekend."
    - `og:type`: "website"
- [ ] **Banner Image**:
    - [ ] A dedicated image `public/og-banner.png` (1200x630px).
    - [ ] Visual: High-quality "Heritage/Event" aesthetic with the project logo.

### 2.2 Sharing Validation
- [ ] **WhatsApp/Messenger**: The link preview displays the title, description, and image correctly.

## 3. Technical Implementation Tasks

### 3.1 Metadata Integration (`index.html`)
- [ ] Add `<meta>` tags in the `<head>` section.
- [ ] Ensure the URL to the OG image is absolute (relative to the domain).

### 3.2 Asset Creation
- [ ] Generate or designate a hero image for the banner that matches the beige/green Airbnb premium theme.

---
**Status**: [NEW]
**Epic**: 1. Authentication & Identity
**Priority**: Low (Polishing)
