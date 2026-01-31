# Comprehensive App Architecture: Ads x Create V2

**Date:** February 2025
**Version:** 2.0.0
**Status:** Live / Beta

This document provides a complete architectural overview of the Ads x Create V2 application. It covers the tech stack, routing structure, page-by-page breakdown, data flow, and key operational workflows.

---

## 1. High-Level Architecture

### Tech Stack
*   **Frontend:** React 19, Vite, Tailwind v4
*   **Backend / Database:** Supabase (BaaS) - Auth, Database, Storage, Realtime
*   **AI:** Google Gemini 3 Pro (Image & Text) via Vercel AI SDK
*   **Styling:** Celestial Neumorphism (Custom Tailwind config)
*   **State Management:** React Context API (Multi-provider pattern)
*   **Animation:** Framer Motion

### Key Services
*   `StorageService`: Abstraction layer for Supabase DB/Storage operations (Business, User, Assets).
*   `TeamService`: Manages team memberships, invitations, and role-based access.
*   `geminiService`: Handles AI generation requests (Images, Text, Chat).
*   `chatService`: Manages chat sessions, messages, and attachments with local caching and realtime sync.
*   `extractionService`: Handles website scraping and business profile extraction.

### Core Contexts (Providers)
*   `AuthContext`: User authentication (Google OAuth), profile management.
*   `ThemeContext`: Dark/Light mode toggle (`neu-dark` / `neu-light`).
*   `NavigationContext`: Dirty state tracking, save handlers, global navigation.
*   `AssetContext`: Manages generated assets (images/text) with pagination.
*   `SocialContext`: Connected accounts, post management, calendar sync.
*   `PillarContext`: Content pillars for automated social strategy.
*   `JobContext`: Background job tracking for AI generation (polling status).
*   `TaskContext`: Kanban board task management (Workspace level).
*   `SubscriptionContext`: Plan limits, credit balance management.

---

## 2. Navigation & Routing Structure

### Authentication Flow (Gates)
1.  **Public Routes:**
    *   `/login`: Login Page (Google OAuth).
    *   `/invite/:token`: Accept Team Invitation.
    *   `/print/:token`: Public printer download page.
    *   `/` (Root): Landing Page (if not authenticated).

2.  **Access Gates (Protected):**
    *   **Gate 1 (Auth):** User must be signed in via Supabase Auth.
    *   **Gate 2 (Profile):** User must have a profile row in `public.profiles`. If missing -> `AccessGate`.
    *   **Gate 3 (Subscription/Team):** User must have an active subscription OR be a member of a team. If missing -> `SubscriptionGate` (Invite Code Entry).
    *   **Gate 4 (Onboarding):** User must have completed onboarding (`profile.onboarding_completed`). If false -> `Onboarding` flow.

3.  **App Layout (`MainLayout`):**
    *   Wraps all protected routes.
    *   **Desktop:** `OrbitalDock` (Left Floating Sidebar).
    *   **Mobile:** `MobileDock` (Bottom Bar + "The Vault" Sheet).
    *   **Business Switcher:** Part of Layout, allows switching context between workspaces.

### Route Map (`App.tsx`)

| Path | View Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/dashboard` | `Dashboard` | Member+ | Main landing, metrics, smart greeting. |
| `/generator` | `Generator` | Member+ | AI Image Studio (Ad Creator). |
| `/chat` | `ChatInterface` | Member+ | "Creative Director" AI Chat. |
| `/planner` | `Planner` | Member+ | Social Media Calendar & Pillars. |
| `/library` | `Library` | Member+ | Asset Gallery (Images/Text). |
| `/tasks` | `Tasks` | Member+ | Kanban Task Board. |
| `/brand-kit` | `BrandKit` | Member+ | Brand identity, logos, colors, voice. |
| `/offerings` | `Offerings` | Member+ | Products/Services management. |
| `/profile` | `BusinessProfile` | Member+ | Business settings, contact hub, ad prefs. |
| `/social` | `Social` | Member+ | Social account connections & settings. |
| `/account` | `UserProfile` | User | User settings, theme, plan info. |
| `/team` | `TeamSettings` | Owner/Admin | Team member management. |
| `/business-manager` | `BusinessManager` | User | Create/Delete/Switch businesses. |
| `/admin` | `AdminDashboard` | Super Admin | System config, logs, roadmap (Restricted). |
| `/design-lab` | `DesignLab` | Internal | Component library & shader tests. |

---

## 3. View / Page Detail

### Dashboard (`views/Dashboard.tsx`)
*   **Purpose:** Operational overview and "Start Here" point.
*   **Key Features:**
    *   **Smart Header:** Context-aware greeting based on time, day, backlog, or recent activity.
    *   **Metrics Cards:** Credits remaining, Active Tasks, Generation Activity (Chart).
    *   **Recent Generations:** Grid of last 4 assets.
    *   **Priority Tasks:** List of high-priority tasks.

### Business Profile (`views/BusinessProfile.tsx`)
*   **Purpose:** Configuration of the business entity.
*   **Tabs:**
    1.  **Profile & Contact:**
        *   Google Maps Import.
        *   Operating Model (Storefront/Service/Online/Appointment).
        *   Dynamic fields based on model (e.g., Service Area vs. Address).
        *   **Contact Hub:** Manage Phone, Email, Website, WhatsApp (Supports multiple).
    2.  **Ad Preferences:**
        *   "Snapshot Card": Visual summary of active ad configuration.
        *   Controls for displaying/hiding location, hours, and contacts in generated ads.
        *   **Holiday Mode:** Temporary override for hours/slogans.

### Brand Kit (`views/BrandKit.tsx`)
*   **Purpose:** The "Brain" of the brand's visual and verbal identity.
*   **Tabs:**
    1.  **Brand Core:** Mission Statement, USPs, Archetype Selector.
    2.  **Visuals:**
        *   **Color Palette:** Primary, Secondary, Accent (with GalaxyColorPicker).
        *   **Logo System:** Primary Logo & Wordmark upload (Auto SVG->PNG conversion).
        *   **Typography:** Font selection.
        *   **Brand Signatures:** Visual motifs (e.g., "Minimalist", "Neon").
    3.  **Voice & Tone:** Tone pills (e.g., "Professional", "Witty") & Ban List (Negative keywords).
    4.  **Audience:** Demographics, Psychographics, Pain Points, Competitors.

### Offerings Studio (`views/Offerings.tsx`)
*   **Purpose:** Management of Products, Services, Team Profiles, and Business Gallery.
*   **Tabs:**
    1.  **Offerings:**
        *   CRUD for Products/Services.
        *   **AI Enhancement:** "Magic Wand" to auto-generate descriptions and benefits.
        *   Fields: Price, Category, Target Audience, Benefits, Features, Promotion.
    2.  **Team:** Roster of team members (used for "Meet the Team" content).
    3.  **Gallery:** Storefront/Interior photos (used as context for generations).

### Generator (`views/Generator.tsx`)
*   **Purpose:** The core AI image creation tool.
*   **Key Components:**
    *   **Masonry Grid:** Feed of generated assets (Pending & Completed).
    *   **Generator Card:** Live status (Warmup -> Cruise -> Deceleration), Progress bar, Cancel button.
    *   **Control Deck:** Bottom bar for Prompt, Style, Ratio, Subject, and Model Tier (Flash/Pro/Ultra).
    *   **Ultra Confirm Modal:** Gate for high-cost 4K generations.
*   **Logic:**
    *   Uses `JobContext` for polling status.
    *   Filters jobs by `businessId` and `type=generator`.

### Chat Interface (`views/ChatInterface.tsx`)
*   **Purpose:** "Creative Director" AI Agent.
*   **Key Features:**
    *   **Persona:** Acts as a strategic partner, not just a tool.
    *   **Sessions:** Multi-turn conversations with history support.
    *   **Attachments:** Can generate images directly in chat (Single or Batch).
    *   **Creative Controls:** Sidebar to force specific Subjects or "Freedom Mode".
    *   **Realtime Sync:** Uses Supabase Realtime for cross-device chat updates.

### Planner (`views/Planner.tsx`)
*   **Purpose:** Social Media Calendar & Strategy.
*   **Tabs:**
    1.  **Calendar:** Month/Week/Day views of scheduled posts. Drag-and-drop support.
    2.  **Pillars:** Content Pillar management (Recurring themes).
*   **Features:**
    *   **The Drop:** Batch approval interface for AI-drafted content.
    *   **Sync:** Integration with GoHighLevel (GHL) for scheduling.

### Library (`views/Library.tsx`)
*   **Purpose:** Digital Asset Management (DAM).
*   **Key Features:**
    *   Masonry Grid layout.
    *   Infinite Scroll (Intersection Observer).
    *   Filtering by Type (Image/Text) and Style.
    *   Download / Copy / Reuse actions.

### Tasks (`views/Tasks.tsx`)
*   **Purpose:** Kanban board for marketing workflow.
*   **Columns:** To Do, In Progress, Blocked, Done.
*   **Features:**
    *   Drag-and-drop (dnd-kit).
    *   Task Details: Description, Due Date, Priority, Assignee.
    *   Workspace-level (shared across team).

### Social (`views/Social.tsx`)
*   **Purpose:** Connection hub for social platforms.
*   **Key Features:**
    *   **Connected Accounts:** List of linked GHL accounts/pages.
    *   **Hashtag Settings:** AI Mode vs. Brand Tags vs. Hybrid.
    *   **Defaults:** First comment strategy, default platforms.

### Team Settings (`views/TeamSettings.tsx`)
*   **Purpose:** Member management.
*   **Features:**
    *   List members with Roles (Owner, Admin, Editor, Viewer).
    *   **Invite Flow:** Generate shareable link or email invite.
    *   **Role Management:** Update roles or remove members.

### Business Manager (`views/BusinessManager.tsx`)
*   **Purpose:** Account-level business CRUD.
*   **Features:**
    *   List all businesses user owns or is part of.
    *   Create New Business (Launches Onboarding).
    *   Quick Edit (Logo, Name).
    *   **Strict Delete:** "Type name to confirm" deletion.

### Admin Dashboard (`views/AdminDashboard.tsx`)
*   **Purpose:** Super Admin control panel.
*   **Tabs:**
    *   **Roadmap:** Internal todo/idea list.
    *   **Brain:** System prompt configuration.
    *   **Config:** Global style presets.
    *   **Subscriptions:** User plan management.
    *   **Logs:** AI generation logs.
    *   **Invites:** Generate/Manage beta invite codes.

---

## 4. Key Workflows

### Onboarding Flow
**Component:** `views/Onboarding.tsx`
1.  **Type:** Select Retail / E-Commerce / Service.
2.  **Method:** "Import from Website" or "Start from Scratch".
3.  **Extraction (if Import):**
    *   User enters URL.
    *   `extractWebsite` crawls site.
    *   **Select Pages:** User chooses specifically which pages to scrape.
    *   **Preview:** User confirms extracted Brand Colors, Logo, and Description.
4.  **Completion:** Creates Business record + Initial Offerings.

### Asset Generation Flow
1.  **Trigger:** User clicks "Generate" (Generator) or asks in Chat.
2.  **Credit Check:** Client-side pre-check + Server-side deduction (`SubscriptionContext`).
3.  **Submission:** `geminiService` sends prompt + business context to API.
4.  **Job Tracking:**
    *   API returns `jobId`.
    *   `JobContext` adds job to local state.
    *   `JobContext` polls `/api/job/:id` every 2s.
5.  **Completion:**
    *   Status becomes `completed`.
    *   Image displayed in UI (Warmup -> Reveal animation).
    *   Asset saved to `assets` table via `StorageService`.

### Cross-Tab Synchronization
*   **Mechanism:** `StorageEvent` listener in `App.tsx`.
*   **Trigger:** `localStorage.setItem('lastBusinessId', ...)`
*   **Action:** When one tab changes business, all other open tabs detect the change and auto-switch to the new business ID to prevent data inconsistency.

### Design System (Celestial Neumorphism)
*   **Philosophy:** Soft shadows, physical feel, dark/light mode support.
*   **Components:** `NeuCard`, `NeuButton`, `NeuInput` (located in `components/NeuComponents.tsx`).
*   **Playground:** `views/DesignLab.tsx` showcases all components and experimental shaders.

---

## 5. Data Models (Simplified)

*   **Business:** `id`, `name`, `type`, `industry`, `colors`, `voice`, `adPreferences`, `credits`.
*   **Asset:** `id`, `businessId`, `type` (image/text), `content` (url/text), `prompt`, `stylePreset`.
*   **Offering:** `id`, `businessId`, `name`, `price`, `description`, `benefits`, `targetAudience`.
*   **SocialPost:** `id`, `businessId`, `caption`, `scheduledAt`, `status`, `imageAssetId`.
*   **TeamMember:** `userId`, `businessId`, `role` (owner/admin/editor/viewer).
*   **ChatMessage:** `id`, `sessionId`, `role` (user/ai), `text`, `attachments`.

---

This architecture document reflects the state of the codebase as of the latest analysis. It is intended to guide future enhancements and maintenance.
