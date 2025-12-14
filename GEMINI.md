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
* **AI Logic (Vercel AI Gateway):** 
    * **All AI calls routed through Vercel AI Gateway** for consolidated billing.
    * **Text Generation:** `google/gemini-2.5-flash` via `@ai-sdk/gateway`
    * **Image Generation:** `google/gemini-3-pro-image` via `@ai-sdk/gateway`
    * **Website Parsing:** `deepseek/deepseek-v3.2-thinking` (Firecrawl scrapes → DeepSeek parses)
    * **Caption Generation:** `deepseek/deepseek-v3.2`
    * **Client-side chat:** `services/geminiService.ts` (still uses `@google/genai` directly)
    * **Pipeline:** "Job Ticket" Architecture (`prompts.ts`). Separates Source Data, Creative Copywriting (Gaps), and Visual Execution instructions.
* **Deployment:** Vercel (Static Hosting + Serverless Functions).

## LOCAL DEVELOPMENT

### Quick Start (Frontend + Full API)
```bash
npm install
npm run dev
```
This starts **Vite** (frontend on port 5173) + **Express** (API on port 3000).  
✅ **All features work** including image generation, social posting, captions, etc.  
⚠️ **GHL OAuth only** requires production (hardcoded callback URLs).

---

### Full Stack (Includes Social Media / GHL Features)
```bash
npx vercel dev --yes
```
This starts Vercel's dev server which handles:
- Frontend (Vite)
- ALL serverless API routes (`/api/*`) including social features

> **First time?** If prompted to link project, select `ads-x-create-v2`. Say **No** to overwriting `.env.local`.

---

**Required `.env.local` variables:**
```env
# Client-side (Public)
VITE_SUPABASE_URL=https://afzrfcqidscibmgptkcl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server-side Only (Privileged)
SUPABASE_SECRET_KEY=sb_secret_xxxxxxxxxxxxxxxxxxxx
GHL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
GHL_CLIENT_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# AI (Vercel Gateway - PRIMARY)
AI_GATEWAY_API_KEY=xxxxxxxxxxxxxxxxxxxx  # From Vercel Dashboard > AI Gateway

# AI (Direct APIs - for client-side geminiService.ts)
VITE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx  # Client-side chat only

# Other APIs
VITE_GOOGLE_MAPS_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
FIRECRAWL_API_KEY=fc-xxxxxxxxxxxxxxxxxxxx
```

> **NOTE:** The `SUPABASE_SECRET_KEY` bypasses RLS and should ONLY be used in serverless API routes (`api/*`).

## CLI & DATABASE SETUP (CRITICAL)

### 1. Fixing Supabase CLI (Migration History Mismatch)
If `npx supabase db push` fails, your local history is out of sync with remote.
**Fix:**
```bash
# 1. Link Project (if not linked)
npx supabase link --project-ref afzrfcqidscibmgptkcl
# Enter DB Password when prompted

# 2. Pull Remote History (Sync)
npx supabase db pull update_local_migrations

# 3. Now you can Push new changes
npx supabase db push
```

**Option A: Standard Development (Recommended)**
*   Use for: All development work.
*   Command: `npm run dev`
*   ✅ All API routes work (image gen, social posting, captions, export).
*   ⚠️ GHL OAuth install/callback won't work (hardcoded to production URL).

**Option B: Vercel Dev (Only for OAuth Testing)**
*   Use for: Testing GHL OAuth flow specifically.
*   Command: `npx vercel dev --yes`
*   ⚠️ Still won't work locally due to hardcoded callback URLs.


## Workflow Preferences
- **DEFAULT DEV SERVER: `npm run dev`** — ALWAYS use this for development. This runs Express server (server.ts) which handles ALL features except GHL social media OAuth. NEVER suggest `npx vercel dev` unless specifically working on GHL OAuth flows.
- **NO BROWSER FOR CODE TASKS**: Do NOT use the browser subagent for code inspection, debugging, or UI verification. Use code analysis tools (grep, view_file, etc.) to understand styling and logic issues. The browser tool is slow and unnecessary for coding problems.

> [!CAUTION]
> ## ⛔ NEVER TOUCH GIT WITHOUT EXPLICIT PERMISSION
> **DO NOT** run any git commands (`git checkout`, `git reset`, `git stash`, `git revert`, etc.) unless the user **explicitly asks you to**.
> Running `git checkout -- <file>` destroys uncommitted work permanently. This has caused data loss before.
> If you need to revert YOUR changes, ask the user first — they may have uncommitted work in the same files.

## Gemini Added Memories

## ARCHITECTURAL PATTERNS
* **Vercel AI Gateway:**
    * All server-side AI calls use `@ai-sdk/gateway` with `generateText()` function.
    * Models: `google/gemini-2.5-flash`, `google/gemini-3-pro-image`, `deepseek/deepseek-v3.2`, `deepseek/deepseek-v3.2-thinking`
    * Consolidated billing under Vercel account.
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

### API Routes
| Route | Purpose |
|-------|---------|
| `/api/social/install` | Initiates GHL OAuth (redirect to GHL) |
| `/api/social/callback` | Handles OAuth callback, stores tokens |
| `/api/social/accounts` | Lists connected social accounts |
| `/api/social/post` | Creates/schedules posts |
| `/api/social/social-oauth` | Proxies individual platform OAuth |

### ⚠️ Critical Notes
* **Hardcoded URLs:** `install.ts` and `callback.ts` use hardcoded `https://ads-x-create-v2.vercel.app` because GHL requires exact URL matching. When moving to a custom domain, update both files AND GHL Marketplace settings.
* **Token Storage:** `ghl_integrations` table stores tokens. Includes `user_id` which is required for posting.
* **Post Payload:** GHL expects `userId`, `accountIds`, `summary`, and `media` (array of `{url, type: 'image/jpeg'}`). Do NOT include `locationId` in body—it's in the URL path.

### Required GHL Scopes (Per Sub-Account)
| Scope | Purpose |
|-------|---------|
| `socialplanner/post.write` | Create/edit/delete posts |
| `socialplanner/account.readonly` | List connected social accounts |
| `socialplanner/account.write` | Trigger OAuth connections |

### Supported Platforms
Facebook, Instagram, LinkedIn, Google Business, Pinterest, Threads, Bluesky

### Key Files
* `api/social/*` — All serverless API routes
* `components/ConnectedAccountsCard.tsx` — UI for connecting accounts
* `components/AssetViewer.tsx` — UI for scheduling posts (Social tab)

### Data Architecture (New V2.1)
*   **Problem:** GHL API is slow (~2-3s).
*   **Solution:** Local Cache First Pattern using `SocialContext`.
*   **Components:**
    *   `services/socialService.ts`: Hybrid service.
        *   `getLocalPosts()`: Fetches from `social_posts` table (Instant).
        *   `api/social/sync`: Background job fetches GHL -> Upserts to `social_posts`.
    *   `context/SocialContext.tsx`:
        *   Loads from `localStorage` immediately (0ms).
        *   Then loads from `social_posts` table (50ms).
        *   Background syncs with GHL (Async).
*   **Database:**
    *   `social_posts`: Local mirror of GHL posts.
    *   `ghl_integrations`: Stores Auth tokens.



## PRINT EXPORT ARCHITECTURE (V4.1)

### Overview
Professional-grade Asset Export. No paid APIs. Uses `sharp` + `pdf-lib`.

### Features
- **Formats:** PNG, JPEG, WebP, PDF
- **Print-Ready:** CMYK, DPI (72-600), Bleed (0-5mm+), Crop Marks
- **Paper Sizes:** A4, Letter, Instagram Square/Story
- **Fit Modes:** Fit / Fill / Stretch (when aspect differs)
- **Presets:** Save/load configs per-business (`businesses.export_presets`)

### Smart Footer
When Export Panel opens, "Reuse Everything" and secondary actions collapse (AnimatePresence).

### Key Files
- `components/ExportPanel.tsx` — Full export UI
- `api/export-print.ts` — Server processing (registered in `server.ts` for local dev)
