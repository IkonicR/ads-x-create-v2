# Developer Documentation

## System Architecture

### 1. Frontend (React + Vite + Tailwind v4)
The application is a modern SPA using React 19, hosted on Vercel.
*   **Entry Point:** `index.tsx` -> `App.tsx`.
*   **Routing:** Custom state-based routing (`ViewState` enum) managed in `App.tsx`.
*   **Contexts:**
    *   `ThemeContext`: Manages Light/Dark mode classes on the `html` element.
    *   `NavigationContext`: Intercepts navigation to prevent data loss (Dirty State).
    *   `NotificationContext`: Global toast system.
    *   `AuthContext`: Manages user authentication via Supabase.

### 2. Data Layer (Supabase)
We use Supabase as a Backend-as-a-Service.
*   **Client:** initialized in `services/supabase.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
*   **Abstraction:** `services/storage.ts` wraps all Supabase calls. **Do not call Supabase directly from Views.** Always use `StorageService`.
*   **Sync Strategy:**
    *   Views initialize state from `props` (passed down from `App.tsx`).
    *   Writes go to `StorageService` (Async).
    *   `App.tsx` re-fetches data or updates local state optimistically.

## 3. Image Generation Pipeline (Single-Step Smart Injection)

We utilize the advanced **Multimodal Capabilities** of Gemini 3 Pro (and 2.5 Flash Image) to handle context, branding, and creativity in a single, powerful request.

### The "Job Ticket" Architecture
Located in `services/prompts.ts`, we dynamically assemble a structured "Job Ticket" based on the request payload.

**1. The Base:**
*   Business Context (Name, Industry, Tone, Colors).
*   User Request (The core prompt).

**2. The Injectors:**
*   **Ad Preferences:** Injects `promotion`, `benefits`, and `targetAudience` into the context.
*   **Style Injector:** Adds specific keywords and negative constraints based on the user's selected `Style Preset`.
*   **Asset Injector:**
    *   **Preserve Integrity (ON):** Injects the product image and instructs the model to use it *exactly* (blended).
    *   **Preserve Integrity (OFF):** Injects the image but allows the model to *stylize* it.

### The Flow
1.  **Client (`geminiService.ts`):** Packages the `GenerationContext` (User selections + Brand data).
2.  **Prompt Factory (`prompts.ts`):** Constructs the "Job Ticket" system instruction.
3.  **Execution:** Calls Google Gemini API directly from the client.
4.  **Output:** A high-fidelity commercial asset.

---

## 4. Modifying the AI Personality

### Chat & Text Tasks
*   **Location:** Managed via `System Prompts` in the Admin Dashboard (stored in Supabase `system_prompts` table).
*   **Usage:** `services/prompts.ts` fetches these rules dynamically.

### Image Generation
*   **Location:** `services/prompts.ts` (Client-side).
*   **To Modify:** Edit the `createImagePrompt` function.

---

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
    *   **Data:** Name, Price, Description, Image.
    *   **Preserve Product Integrity:** A `preserveLikeness` boolean flag.
        *   **True:** "Use real product image" (blended).
        *   **False:** "Stylize" (creative adaptation).

## Business Model & Pricing

### Credit System
We operate on a high-margin credit model to account for AI costs and operational overhead.
*   **Baseline Value:** 1 Credit ≈ $0.02 USD.
*   **Target Margin:** >80% on all generation tiers.

### Image Generation Tiers
We offer three tiers of image generation quality.

| Tier | Model | Resolution | Cost/Margin |
| :--- | :--- | :--- | :--- |
| **Flash** | `gemini-2.5-flash-image` | Standard | High Margin (Drafts) |
| **Pro** | `gemini-3-pro-image-preview` | High Quality | Balanced (Final Assets) |
| **Ultra** | `gemini-3-pro` (High Res) | 4k | Premium (Upscaled) |

## Key Components

### Visual Ad Studio (`views/Generator.tsx`)
A complex view comprising:
*   **Masonry Grid:** Displays generated assets in a pinterest-style layout. Uses "Shortest-Column First" algorithm.
*   **Infinite Scroll:** Automatically loads more assets as you scroll.
*   **Control Deck:** A fixed "Slab" component at the bottom used to configure generations.
    *   **Subject Selector:** Links generation to a specific `Offering`. Includes "Quick Edit" button.
    *   **Preset/Style Selectors:** Dynamic menus populated from Supabase (`presets`, `styles`).

### Admin Dashboard (`views/AdminDashboard.tsx`)
*   **Config Tab:** Dynamic editor for Presets and Styles. Allows uploading thumbnails and editing prompt modifiers live without code deployment.
*   **Roadmap:** Simple internal issue tracker.
*   **Brain Logic:** Editor for system prompts.
*   **Logs Tab:** A real-time feed of all AI generation requests. Used to inspect the "Mega-Prompt" (Context + Data + Instructions) sent to the model for debugging hallucinations or missing data.

## Workflow Guides

### Adding a New Feature
1.  **Define Data:** Update `types.ts` and Supabase Schema.
2.  **Update Storage:** Add methods to `services/storage.ts`.
3.  **Create View:** Build the component in `views/`.
4.  **Route:** Add the enum to `ViewState` and render it in `App.tsx`.
5.  **Nav:** Add the item to `components/Layout.tsx`.

### Debugging AI Hallucinations
1.  Go to **Admin HQ** -> **Logs**.
2.  Locate the failed generation row.
3.  Inspect the `prompt` column.
    *   Is the data missing? (Code Issue)
    *   Is the data there but ignored? (Prompt Engineering Issue)
4.  Adjust `services/prompts.ts` (or the Brain Logic tab) accordingly.

### Modifying the AI Personality (Admin HQ)
The AI logic is governed by a **Fall-through System** managed in `views/AdminDashboard.tsx`:
1.  **Code Defaults:** Defined in `services/prompts.ts`.
2.  **Admin Override:** An Admin can define custom prompts in the **Brain Logic** tab.
3.  **Storage:** Overrides are persisted in the `system_prompts` table.
