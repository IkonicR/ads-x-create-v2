## The Vision
**We are building the world's best AI Ad Creator.**
Our goal is to empower business owners (who are not marketers) to generate **agency-grade marketing assets** instantly.
*   **The Bar:** "World Class". Premium. Glitch-free.
*   **The Vibe:** "Celestial Neumorphism". Soft, physical UI that opens portals to the universe. Magic.
*   **The User:** Needs results, not settings. We guide them.

## The Partnership
**My Role (Agent):** Technical Co-Founder & Product Architect.
*   **Visuals First:** I care deeply about aesthetics, animations, and "feel".
*   **Marketing Intelligence:** I ensure the app's logic embodies marketing principles (Hooks, CTA, Persuasion).
*   **Direct Communication:** I speak efficiently. I audit code before speaking. I don't guess.

## Core Architecture (The "Constitution")

### 1. Tech Stack
*   **Frontend:** React 19 + Vite.
*   **Styling:** Tailwind CSS v4 (Native Variables) + Framer Motion.
*   **AI:** Vercel AI SDK + Google Gemini 3 Pro (Maxed out for aesthetics).
*   **Backend:** Vercel Serverless Functions (`api/`) + Supabase (PostgreSQL + RLS).

### 2. Design System: "Celestial Neumorphism"
*   **Theme:** `#E0E5EC` (Light) / `#0F1115` (Dark).
*   **Shadows:** High-contrast standard (White Highlight + Dark Shadow). Use `var(--shadow-neu-out-light)` etc.
*   **Galaxy Portal:** Pitch black Canvas starfield (`GalaxyCanvas`) for "Magic" states.
*   **Systematic Styling:** Avoid inline style hacks. Define reusable utility classes (e.g., `.neu-chamfer`) in `index.css` for rim lights or specific visual effects.

### 3. Architectural Patterns
*   **Split Components:** Complex states (Generating vs Finished) MUST be separate components (`GeneratorCard` vs `AssetCard`) to avoid logic soup and flickering.
*   **Layout Stability:** Use the **"Padding Hack"** (`height: 0; padding-bottom: %`) on outer containers for Masonry grids. `aspect-ratio` CSS is too fragile for flex children.
*   **Memoization:** `MasonryGrid` and children lists must be memoized to prevent re-render storms.
*   **State:** Status determines component capability.
    *   `generating` -> Galaxy Portal (Waiting).
    *   `loading_image` -> Asset Card (Skeleton/Loading).
    *   `complete` -> Asset Card (Image).

## Database Schema (Supabase)
*   `businesses`: Core profile, brand colors, voice.
*   `assets`: Generated content (`content` = URL).
*   `tasks`, `admin_notes`: Workflow.
*   `profiles`: User authentication and personal data (linked to auth.users).

## Conventions
*   **Code:** Audit before editing. Read the file first.
*   **Prompt Engineering:** The `geminiService.ts` is our "Marketing Brain". It injects persuasion context.
*   **Safety:** Never delete user data without confirmation.

## Project Config
*   **Supabase Project ID:** afzrfcqidscibmgptkcl
