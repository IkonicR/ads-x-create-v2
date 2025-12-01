# 🎨 Design Spec: The Orbital Dock ("Celestial Neumorphism")

> **Selected Concept:** Option A - The Floating Capsule.
> **Core Vibe:** Weightless, Physical, Precision Tooling.

## 🏗️ Architecture: The "Capsule"
The navigation is no longer a sidebar. It is a **Floating Dock**.
*   **Shape:** Vertical Pill / Capsule.
*   **Position:** Fixed Left, vertically centered (or slightly offset to top).
*   **Margin:** Floating ~24px from the left edge.
*   **Dimensions:** ~80px wide (Collapsed/Icon Mode) -> ~260px wide (Expanded/Hover Mode).
*   **Material:** Opaque Neumorphic Base (White/Dark Grey) with deep soft shadows to lift it off the canvas.

---

## 🧩 The Zones

### Zone 1: The Bridge (Top) 🛸
*   **Logo:** Minimal "A" logo.
*   **The "Fuel Cell" (Credits):**
    *   *Proposal:* A glowing "Ring" surrounding the Logo.
    *   *Behavior:* The ring is a progress bar (360 degrees). As you spend credits, the ring un-fills counter-clockwise.
    *   *Color:* Gradient Cyan-to-Purple. turns Red when low.

### Zone 2: The Control Deck (Middle) 🎛️
*   **The Keys:**
    *   Not standard list items. These are **Squircles** (Square + Circle).
    *   **Inactive:** Floating *up* (Out shadow).
    *   **Active:** Pressed *in* (In shadow). The icon glows brand color.
    *   **Hover:** The key lifts higher.
*   **Grouping:**
    *   *Creation:* Generator, Chat. (These get special prominence?)
    *   *Management:* Dashboard, Library, Tasks.

### Zone 3: The Engine (Bottom) 🔋
*   **Business Cartridge:**
    *   A slot at the bottom showing the active Brand's Initials.
    *   Clicking it "ejects" the menu to switch businesses.
*   **Theme Toggle:** A discrete toggle integrated into the bottom curve.

---

## 💫 Micro-Interactions
*   **The "Dock Expand":** Does the whole dock widen when you hover? Or just when you click a "Expand" trigger? (Recommendation: Click-to-expand or "Intelligent Hover").
*   **Route Transition:** When clicking a link, the active indentation should "slide" to the new position (Morphing effect) rather than just disappearing and reappearing.

---

## 🛠️ Implementation Plan
1.  Create `components/OrbitalDock/DockContainer.tsx`
2.  Create `components/OrbitalDock/DockKey.tsx` (The buttons)
3.  Create `components/OrbitalDock/FuelRing.tsx` (The credit system)
4.  Replace `Layout.tsx` sidebar with `<OrbitalDock />`.
