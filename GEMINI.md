# PROJECT: Ads x Create
**Mission:** The "Business Operating System" for inconsistent branding.
**Vibe:** "Celestial Neumorphism". Soft, physical UI. Magic.
**Stack:** React 19, Vite, Tailwind v4, Supabase.
**Legacy Context:** This is a **V2 / Reboot** of a previously built application. We are simplifying the architecture (moving from multi-step chains to single-step multimodal injection) while aiming to retain the sophisticated prompt engineering logic of the original.

## DESIGN SYSTEM
* **Components:** Use `NeuCard`, `NeuButton`, `NeuInput` (from `components/NeuComponents.tsx`).
* **Theme:** Light (`#F9FAFB`) / Dark (`#0F1115`).
* **Shadows:** High-contrast standard (White Highlight + Dark Shadow).
* **Special:** `GalaxyCanvas` for "Magic/Waiting" states.

## INFRASTRUCTURE
* **Supabase Project:** afzrfcqidscibmgptkcl
* **AI Logic:** 
    * **The Engine:** Client-side `services/geminiService.ts` (Direct to Google Gemini API).
    * **Pipeline:** "Job Ticket" Architecture (`prompts.ts`). Separates Source Data, Creative Copywriting (Gaps), and Visual Execution instructions.
    * **Context Injection:** Injects User Request + Brand Identity + Ad Preferences (Promotion, Benefits, Audience).
    * **Preserve Product Integrity:** 
        *   **Enabled:** "Use real product image (blended)" (Exact Geometry).
        *   **Disabled:** "Stylize" (Creative Adaptation).
    *   **Flexibility:** AI adapts output format (Infographic, List, Chart) based on user intent.
* **Deployment:** Vercel (Static Hosting).

## ARCHITECTURAL PATTERNS
* **Single-Step Smart Injection:**
    * Instead of a separate "Planner" AI, we rely on the multimodal capabilities of Gemini 2.5 Flash (Text) & 3.0 Pro (Images).
    * We inject the full Brand Context, Style Rules, and Assets directly into the System Instructions for the image model.
* **Split Components:** Complex states (Generating vs Finished) MUST be separate components (`GeneratorCard` vs `AssetCard`).
*   **Smart Masonry:** `MasonryGrid` uses a "Shortest-Column First" algorithm for optimal packing. No CSS columns.
*   **Infinite Scroll:** Generator feed uses `IntersectionObserver` for seamless loading.
*   **Deep Linking:** "Quick Edit" uses `localStorage` (`pending_edit_id`) to navigate from Chat -> Offerings Edit Form.
*   **Memoization:** `MasonryGrid` and children lists must be memoized.
*   **Lazy Loading:** Admin Dashboard tabs MUST load data on-click, not on-mount.
*   **Safety:** Supabase client MUST have a 10s timeout. No infinite retry loops.
*   **State Flow:**
    * `generating` -> Galaxy Portal (Waiting).
    * `loading_image` -> Asset Card (Skeleton/Loading).
    * `complete` -> Asset Card (Image).

## DATABASE SCHEMA
* `businesses`: Core profile, brand colors, voice.
* `offerings`: Products/Services. Includes `additionalImages`, `preserveLikeness` (Strict Mode), and Marketing Context (`promotion`, `benefits`, `targetAudience`).
* `assets`: Generated content (`content` = URL).
* `tasks`, `admin_notes`: Workflow.
*   `profiles`: User authentication data.
*   `generation_logs`: Auditing table for all AI prompts and model responses (Debugging).
*   **Indices:** Foreign keys (`owner_id`, `business_id`) MUST be indexed to prevent Disk IO exhaustion.

## CURRENT STATUS
* **Core System:** Initialized.
* **Design System:** Implemented (`NeuComponents`).
* **Auth:** Implemented (`AuthContext`, `Login`).
* **Views:** Dashboard, Generator, Library, BrandKit structure in place.
