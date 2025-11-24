# Developer Documentation

## System Architecture

### 1. Frontend (React + Vite + Tailwind v4)
The application is a modern SPA using React 19.
*   **Entry Point:** `index.tsx` -> `App.tsx`.
*   **Routing:** Custom state-based routing (`ViewState` enum) managed in `App.tsx`.
*   **Contexts:**
    *   `ThemeContext`: Manages Light/Dark mode classes on the `html` element.
    *   `NavigationContext`: Intercepts navigation to prevent data loss (Dirty State).
    *   `NotificationContext`: Global toast system.

### 2. Data Layer (Supabase)
We use Supabase as a Backend-as-a-Service.
*   **Client:** initialized in `services/supabase.ts`.
*   **Abstraction:** `services/storage.ts` wraps all Supabase calls. **Do not call Supabase directly from Views.** Always use `StorageService`.
*   **Sync Strategy:**
    *   Views initialize state from `props` (passed down from `App.tsx`).
    *   Writes go to `StorageService` (Async).
    *   `App.tsx` re-fetches data or updates local state optimistically.

### 3. AI Engine (Gemini)
*   **Client:** `services/geminiService.ts`.
*   **Models:**
    *   `gemini-3-pro-image-preview`: Used for the **Visual Ad Studio**. Supports Aspect Ratio, high fidelity, and **Multi-Modal Input** (Text + Image).
    *   `gemini-2.5-flash`: Used for Chat, Copywriting, and logic tasks.
*   **Multi-Modal Context:**
    *   **Brand Logos:** Injected as `inlineData` to prompt the AI to include branding.
    *   **Product Reference:** Offering images (from the **Offerings** tab) are injected to ensure strict visual likeness (if the `preserveLikeness` flag is set).
*   **Context Injection:** We construct "Super Prompts" by appending Business Context (Brand Voice, Product Details, Price) to the user's raw input.

### 4. File Storage (Supabase)
*   **Bucket:** `business-assets` (Public Access enabled).
*   **Service:** `StorageService.uploadBusinessAsset` handles file uploads.
*   **Usage:** 
    *   `logos/`: Brand logos.
    *   `products/`: Reference images for offerings.
    *   `system_assets/`: Admin-uploaded thumbnails for Presets/Styles.

### 5. Business Profile Logic (`views/BusinessProfile.tsx`)
The profile is the "Source of Truth" for the AI. We use intelligent UI patterns to capture structured data.

*   **Offerings (Products/Services):**
    *   **Data:** Name, Price, Description, Image.
    *   **Strict Mode:** A `preserveLikeness` boolean flag. If true, the prompt explicitly forbids the AI from hallucinating visual changes to the product.

## Business Model & Pricing

### Credit System
We operate on a high-margin credit model to account for AI costs and operational overhead.
*   **Baseline Value:** 1 Credit ≈ $0.02 USD (Based on a $20/mo subscription providing 1,000 credits).
*   **Target Margin:** >80% on all generation tiers.

### Image Generation Tiers
We offer three tiers of image generation quality, priced to incentivize "Drafting" while securing high margins on "Final" assets.

| Tier | Model | Resolution | API Cost (Est.) | Price (Credits) | Price ($) | Margin |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Flash 2.5** | `gemini-2.5-flash-image` | 1024x1024 | ~$0.04 | **10** | $0.20 | **80%** |
| **Gemini Pro** | `gemini-3-pro-image-preview` | ~1024x1024 (HQ) | ~$0.13 | **40** | $0.80 | **83%** |
| **Ultra 4K** | `gemini-3-pro` (High Res) | 4096x4096 | ~$0.24 | **80** | $1.60 | **85%** |

## Key Components

### Visual Ad Studio (`views/Generator.tsx`)
A complex view comprising:
*   **Masonry Grid:** Displays generated assets in a pinterest-style layout.
*   **Control Deck:** A fixed "Slab" component at the bottom used to configure generations.
    *   **Subject Selector:** Links generation to a specific `Offering`. Passing the offering passes its **Price, Description, and Reference Image** to the AI.
    *   **Preset/Style Selectors:** Dynamic menus populated from Supabase (`presets`, `styles`).

### Admin Dashboard (`views/AdminDashboard.tsx`)
*   **Config Tab:** Dynamic editor for Presets and Styles. Allows uploading thumbnails and editing prompt modifiers live without code deployment.
*   **Roadmap:** Simple internal issue tracker.
*   **Brain Logic:** Editor for system prompts.

### Neumorphic Design System
We use a custom Tailwind setup.
*   **Shadows:** Defined in `index.css` as CSS variables (`--shadow-neu-out-light`, etc.).
*   **Usage:** `NeuCard`, `NeuButton`, `NeuInput`, `NeuImageUploader`.

## Workflow Guides

### Adding a New Feature
1.  **Define Data:** Update `types.ts` and Supabase Schema (if needed).
2.  **Update Storage:** Add methods to `services/storage.ts`.
3.  **Create View:** Build the component in `views/`.
4.  **Route:** Add the enum to `ViewState` and render it in `App.tsx`.
5.  **Nav:** Add the item to `components/Layout.tsx`.

### Modifying the AI Personality (Admin HQ)
The AI logic is governed by a **Fall-through System** managed in `views/AdminDashboard.tsx`:
1.  **Code Defaults:** Defined as constants (`DEFAULT_IMAGE_PROMPT`, etc.) in `services/prompts.ts`. These are the "Factory Settings".
2.  **Admin Override:** An Admin can define custom prompts in the **Brain Logic** tab of the Dashboard.
3.  **Logic:**
    *   If the Override is **Empty**: The system uses the Code Default. (Updates to code apply automatically).
    *   If the Override has **Content**: The system uses the Override exclusively.
4.  **Storage:** Overrides are persisted in the `system_prompts` table in Supabase.