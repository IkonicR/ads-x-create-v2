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

### 2. Data Layer (Supabase)
We use Supabase as a Backend-as-a-Service.
*   **Client:** initialized in `services/supabase.ts` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
*   **Abstraction:** `services/storage.ts` wraps all Supabase calls. **Do not call Supabase directly from Views.** Always use `StorageService`.
*   **Sync Strategy:**
    *   Views initialize state from `props` (passed down from `App.tsx`).
    *   Writes go to `StorageService` (Async).
    *   `App.tsx` re-fetches data or updates local state optimistically.

### 3. AI Engine (Vercel AI SDK + Google Gemini)
We use the **Vercel AI SDK** to orchestrate calls to Google Gemini models via secure Serverless Functions.
*   **Frontend Service:** `services/geminiService.ts` fetches from our own API endpoints (`/api/generate-text`, `/api/generate-image`).
*   **Backend Functions:** Located in `api/`. These run on Vercel's Edge/Serverless runtime, securing the `GOOGLE_GENERATIVE_AI_API_KEY`.
*   **Models:**
    *   **Text/Chat:** `gemini-2.5-flash` (Fast) or `gemini-3-pro` (Smart) via `api/generate-text.ts`.
    *   **Images:** `gemini-3-pro-image-preview` (or similar) via `api/generate-image.ts`.
*   **Multi-Modal Context:**
    *   **Brand Logos:** Injected as Base64 data.
    *   **Product Reference:** Injected to ensure visual likeness.
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
*   **Masonry Grid:** Displays generated assets in a pinterest-style layout.
*   **Control Deck:** A fixed "Slab" component at the bottom used to configure generations.
    *   **Subject Selector:** Links generation to a specific `Offering`.
    *   **Preset/Style Selectors:** Dynamic menus populated from Supabase (`presets`, `styles`).

### Admin Dashboard (`views/AdminDashboard.tsx`)
*   **Config Tab:** Dynamic editor for Presets and Styles. Allows uploading thumbnails and editing prompt modifiers live without code deployment.
*   **Roadmap:** Simple internal issue tracker.
*   **Brain Logic:** Editor for system prompts.

## Workflow Guides

### Adding a New Feature
1.  **Define Data:** Update `types.ts` and Supabase Schema.
2.  **Update Storage:** Add methods to `services/storage.ts`.
3.  **Create View:** Build the component in `views/`.
4.  **Route:** Add the enum to `ViewState` and render it in `App.tsx`.
5.  **Nav:** Add the item to `components/Layout.tsx`.

### Modifying the AI Personality (Admin HQ)
The AI logic is governed by a **Fall-through System** managed in `views/AdminDashboard.tsx`:
1.  **Code Defaults:** Defined in `services/prompts.ts`.
2.  **Admin Override:** An Admin can define custom prompts in the **Brain Logic** tab.
3.  **Storage:** Overrides are persisted in the `system_prompts` table.
