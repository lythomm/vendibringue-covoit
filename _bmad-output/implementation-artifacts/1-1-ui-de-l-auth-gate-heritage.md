# Story 1.1: UI de l'Auth Gate "Heritage"

## 1. Context & Purpose
This is the entry portal to the **VendiBringue Covoit'** application. It serves as a security gate that prevents any unauthenticated access to the map or trajet details. It combines registration and login into a single, high-trust flow using Name, Phone, and a 4-digit PIN.

## 2. Acceptance Criteria

### 2.1 Visual Identity (Airbnb Premium Style)
- [ ] **Background**: Soft beige/off-white surface (`#fcf9f8`).
- [ ] **Typography**: Use **Inter** (modern, legible).
- [ ] **Colors**: 
    - Primary Action: Deep Forest Green (`#004f33`).
    - Text: Dark Charcoal (`#1b1c1c`).
- [ ] **Responsive Layout**:
    - **Desktop**: Centered card (`max-w-[568px]`) with subtle rounded borders (`rounded-xl`) and a soft shadow.
    - **Mobile**: Full-width container with a sticky header "Connexion ou inscription".
- [ ] **Decorative Elements**: Implement the blurred background color blobs (blooms) in the corners to give a premium "Editorial" feel.

### 2.2 Functional Elements
- [ ] **Identification Fields**:
    - **Name**: Text input for the user's first name.
    - **Phone**: Composite field with a Country Selector (default France +33) and a numeric input.
    - **PIN**: 4-digit numeric input field.
- [ ] **Primary Action**: Large, pill-shaped button (`h-[52px]`) labeled **"Rejoindre la Bringue"**.
    - [ ] **Shimmer Effect**: Add a subtle periodic light sweep animation across the button.
    - [ ] **Visual States**: Disable button until all fields reach minimum length requirements.
- [ ] **Privacy Note**: Small legal disclaimer at the bottom explaining that data is used for coordination only.

## 3. Technical Implementation Tasks

### 3.1 UI & Styling
- [ ] Setup the `AuthGate.vue` component.
- [ ] Configure Tailwind custom theme mapping:
  - `primary`: `#004f33`
  - `background`: `#fcf9f8`
- [ ] Implement the card structure using `bg-surface-container-lowest` and matching classes from the Stitch mockup.

### 3.2 Form Handling
- [ ] Use `type="tel"` and `inputmode="numeric"` for phone and PIN fields to trigger the numeric keypad on mobile.
- [ ] Implement basic validation (Name > 2 chars, Phone == 10 chars, PIN == 4 chars).

### 3.3 Assets
- [ ] Generate a placeholder logo or title text using the **Outfit** or **Plus Jakarta Sans** font for the header.

## 4. Design Reference
> [!TIP]
> Refer to `stitch-screens/auth-gate-airbnb-premium.html` for exact CSS classes and layout ratios.

---
**Status**: [NEW]
**Epic**: 1. Authentication & Identity
**Priority**: High
