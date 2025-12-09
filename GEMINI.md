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
* **Supabase Project:** `afzrfcqidscibmgptkcl`
* **AI Logic:** 
    * **The Engine:** Client-side `services/geminiService.ts` (Direct to Google Gemini API).
    * **Pipeline:** "Job Ticket" Architecture (`prompts.ts`). Separates Source Data, Creative Copywriting (Gaps), and Visual Execution instructions.
    * **Context Injection:** Injects User Request + Brand Identity + Ad Preferences (Promotion, Benefits, Audience).
    * **Preserve Product Integrity:** 
        *   **Enabled:** "Use real product image (blended)" (Exact Geometry).
        *   **Disabled:** "Stylize" (Creative Adaptation).
    *   **Flexibility:** AI adapts output format (Infographic, List, Chart) based on user intent.
* **Deployment:** Vercel (Static Hosting).

## LOCAL DEVELOPMENT
```bash
npm install
npm run dev
```
**Required `.env.local` variables:**
```env
# Client-side (Public)
VITE_SUPABASE_URL=https://afzrfcqidscibmgptkcl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmenJmY3FpZHNjaWJtZ3B0a2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MDEzMzYsImV4cCI6MjA3OTM3NzMzNn0.ESSxfwK045eFKgbStvO044RZkpvFKhx822TWNx6C3Gg

# Server-side Only (Privileged)
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx
GHL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
GHL_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# AI & APIs
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
VITE_GOOGLE_MAPS_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxxxxxx
```

> **NOTE:** The `SUPABASE_SECRET_KEY` is a modern replacement for the service role key. It bypasses RLS and should ONLY be used in serverless API routes (`api/ghl/*`).

*Use `npx vercel dev` only when testing serverless API routes (e.g., `/api/extract-website`).*

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

### Tables
| Table | Purpose |
|-------|---------|
| `businesses` | Core profile, brand colors, voice. Contains JSONB columns for nested data. |
| `assets` | Generated content (`content` = URL). |
| `profiles` | User authentication data (links to Supabase Auth). |
| `presets` | Campaign preset configurations (flash_sale, awareness, etc.). |
| `styles` | Visual style presets with V2 God-Tier configs. |
| `generation_logs` | Auditing table for all AI prompts and responses (debugging). |
| `tasks` | Workflow management. |
| `admin_notes` | Internal roadmap and notes. |
| `system_prompts` | AI persona overrides (Chat, Image Gen, Tasks). |

### JSONB Columns in `businesses`
*These are NOT separate tables — they live inside `businesses`:*
* `offerings` — Products/Services array with `preserveLikeness`, `additionalImages`, marketing context.
* `team_members` — Team array with name, role, imageUrl.
* `locations` — Location array with name, description, images.
* `colors`, `voice`, `profile`, `ad_preferences` — Structured brand/preference data.

### Important Indices
* Foreign keys (`owner_id`, `business_id`) MUST be indexed to prevent Disk IO exhaustion.

## CURRENT STATUS

### Implemented Features ✅
* **Auth:** Full Supabase auth with `AuthContext`, protected routes.
* **Design System:** `NeuComponents` (Card, Button, Input, Dropdown, etc.).
* **Business Profile:** Core profile editing, brand colors, voice settings.
* **Brand Kit:** Typography, archetype, visual motifs management.
* **Offerings Management:** Products, Team Members, Locations with CRUD + image uploads.
* **Generator (Ad Studio):** Masonry feed, infinite scroll, multi-model support.
* **Strategy Sidebar:** Campaign presets, framing controls, trust stack.
* **Style System:** V2 God-Tier Production Presets with `ConfigWeaver`.
* **Admin Dashboard:** Config, Logs, Roadmap, Brain Logic tabs.
* **Website Extraction:** AI-powered onboarding from URL (`/api/extract-website`).

### Image Generation (V3.2 Architecture)
*   **Location:** `services/prompts.ts` (Client-side).
*   **Template:** 5-Section Modular Structure:
    1. **Brand Identity** — Archetype, Palette, Typography
    2. **Strategy** — Goal, Audience, Subject Context, Pain Point
    3. **Copywriting** — Headline, Body, CTA, Mandatory Elements
    4. **Visual Production** — V2 God-Tier SDL or style directive
    5. **Technical Mandates** — Diegetic text, Asset handling, Composition
*   **Key Features:**
    *   `ConfigWeaver` translates V2 Production Preset JSON → natural language SDL
    *   Dynamic blocks (`buildSloganBlock`, `buildSubjectContextBlock`, etc.)
    *   Currency-formatted prices (ZAR, USD, EUR, GBP)
    *   Multi-image style reference support
    *   Contact Hub only (no legacy fallback)
*   **To Modify:** 
    *   **Option A (Code):** Edit `createImagePrompt` in `services/prompts.ts`.
    *   **Option B (Admin):** Go to **Admin HQ > Brain Logic > Image Generator**.
        *   ⚠️ **Warning:** If you set an override, it uses the OLD template and ignores V3.2 code changes.
        *   Use "Reset to Default" to revert to the V3.2 codebase version.

## GOHIGHLEVEL (GHL) INTEGRATION

### Overview
Social media scheduling powered by GoHighLevel API v2. White-labeled—users never see GHL.

### Credentials
* **GHL Marketplace Login:** `hartmanrijn@gmail.com` / `Iw2g2M@rs!n2030`
* **Marketplace App Name:** `ADS-X-CREATE`
* **App Type:** Private, White-Label
* **Client ID:** `693810a3890d023eb434ed2e-miyjrfk3`
* **Client Secret:** `bc77b6d9-4564-409b-a4bc-5aec3c0f19f9`

### Architecture (Private Marketplace App)
* **OAuth Flow:** Users install the app once per sub-account, then connect social accounts via OAuth popup.
* **Backend Proxy:** Required because `/oauth/start` returns 302 redirect that needs header capture.
* **Storage:** `ghl_integrations` table stores `access_token`, `refresh_token`, `location_id`, `expires_at`.
* **White-Label Domain:** `leadconnectorhq.com` (not `gohighlevel.com`).

### Required GHL Scopes (Per Sub-Account)
| Scope | Purpose |
|-------|---------|
| `socialplanner/post.readonly` | View scheduled posts |
| `socialplanner/post.write` | Create/edit/delete posts |
| `socialplanner/account.readonly` | List connected social accounts |
| `socialplanner/account.write` | Trigger OAuth connections |
| `socialplanner/csv.readonly` | Export posts as CSV |
| `socialplanner/csv.write` | Import posts from CSV |
| `socialplanner/category.readonly` | View post categories |
| `socialplanner/category.write` | Create/edit categories |
| `socialplanner/tag.readonly` | View hashtag tags |
| `socialplanner/tag.write` | Create/edit tags |
| `socialplanner/statistics.readonly` | View analytics/stats |

### Supported Platforms (Image only)
* Facebook (Pages, Groups)
* Instagram (Posts, Stories)
* LinkedIn (Personal, Business)
* Pinterest
* Google Business Profile
* Threads
* Bluesky

### Key Files
* `views/admin/AccountsTab.tsx` — Admin social config modal
* `services/socialService.ts` — GHL API wrapper (TODO)
* `types.ts` — `Business.socialConfig` interface
