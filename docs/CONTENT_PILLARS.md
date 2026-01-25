# Content Pillars — "The Pulse"

> **Status:** Planning Phase  
> **Last Updated:** 2026-01-24

---

## Vision

Content Pillars transform x Create from a **tool** (user pushes button, gets ad) into an **operation** (system runs the business). 

A pillar is a **Standing Order** for the Digital Brain: *"Every Tuesday, look at my Brand Kit, look at my Products, and build me a specific type of post."*

**Core Problem Solved:** Decision Fatigue. Users don't want to decide *which* product to feature next Friday. They just want to know that *a* product is being featured.

---

## Core Concepts

### 1. Pillar = Recurring Content Order
Each pillar defines:
- **Schedule** — Day of week (or month)
- **Theme** — What type of content (Motivation, Product Spotlight, Behind the Scenes, etc.)
- **Subject** — What to feature (specific offering, rotate through offerings, team member, location)
- **Style** — Visual preset to use for image generation

### 2. Smart Rotation 🧠
Instead of static "always post X" rules, pillars can rotate through data:
- **Offering Rotation:** Week 1 = Product A, Week 2 = Product B, etc.
- **Team Rotation:** Cycle through team members for "Meet the Team" posts
- **Location Rotation:** For multi-location businesses

### 3. Draft → Approve → Schedule
Content is **never** auto-posted without consent:
1. Cron job generates draft (caption + optional image)
2. Draft sits in approval queue
3. User reviews and approves (or refines)
4. Only then does it get scheduled

---

## User Experience

### Cold Start: Smart Presets
When a user first opens Pillars, they see **Starter Packs** based on their business type:
- **Retail Pack:** New Arrival Tuesday, Testimonial Thursday, Sunday Vibes
- **Service Pack:** Tip Tuesday, Client Win Wednesday, Behind-the-Scenes Friday
- **E-com Pack:** Product Monday, Promo Wednesday, User Content Friday

One-click activation creates all pillars instantly.

### The Weekly Drop (Approval Ritual)
- Notification: *"Your content for next week is ready."*
- **Review Mode:** Horizontal card stack of next week's drafts
- Actions:
  - ✅ **Approve All** — Power move
  - ✏️ **Refine** — Quick edit caption or regenerate image
  - ⏭️ **Skip** — "Not this week"

### Missed Content = Archived (Not Lost)
If scheduled day passes without approval:
- Draft moves to "Missed Opportunities" archive
- User notified: "You missed Tuesday's post! Reschedule?"
- **Never auto-post unapproved content** (hallucination risk)

---

## Pillar Schema (Proposed)

```typescript
interface ContentPillar {
  id: string;
  businessId: string;
  
  // Identity
  name: string;           // "Motivation Monday"
  theme: PillarTheme;     // 'motivation' | 'product' | 'team' | 'testimonial' | 'educational' | 'custom'
  
  // Schedule
  scheduleType: 'weekly' | 'monthly';
  dayOfWeek?: number;     // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;    // 1-31
  
  // Content Source
  subjectMode: 'static' | 'rotate_offerings' | 'rotate_team' | 'rotate_locations';
  staticSubjectId?: string;  // Specific offering/team member ID
  
  // Style
  stylePresetId?: string;
  promptTemplate?: string;  // Custom instructions for AI
  
  // Options
  generateImage: boolean;
  platforms: string[];    // Which platforms to post to
  isActive: boolean;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt?: string;
}
```

---

## Draft Schema (Proposed)

```typescript
interface PillarDraft {
  id: string;
  pillarId: string;
  businessId: string;
  
  // Generated Content
  caption: string;
  imageAssetId?: string;  // Link to generated asset
  imageUrl?: string;
  
  // Target
  scheduledFor: string;   // The date this was meant for
  platforms: string[];
  
  // Status
  status: 'pending' | 'approved' | 'skipped' | 'posted' | 'expired';
  approvedAt?: string;
  postedAt?: string;
  
  // Subject used (for tracking rotation)
  subjectType?: 'offering' | 'team' | 'location';
  subjectId?: string;
  
  createdAt: string;
}
```

---

## Phases

### Phase 1: Foundation
- [ ] Create `content_pillars` table
- [ ] Create `pillar_drafts` table  
- [ ] Basic CRUD service
- [ ] UI: Pillars list view (in Social or Planner)

### Phase 2: Generation Engine
- [ ] Cron job: Check pillars, generate drafts
- [ ] Caption AI generation per pillar theme
- [ ] Smart rotation logic (offerings/team/locations)

### Phase 3: Approval Flow
- [ ] Draft queue UI
- [ ] Approve/Refine/Skip actions
- [ ] Notification system ("Your content is ready")

### Phase 4: Image Generation
- [ ] Auto-generate images using Generator pipeline
- [ ] Reuse existing assets when applicable
- [ ] Link drafts to assets table

### Phase 5: Polish & Extras
- [ ] Starter Pack presets
- [ ] "Weekly Vibe" context injection
- [ ] Feed Forecast (Instagram grid preview)
- [ ] Chat integration ("Set up a Team Friday pillar")

---

## Future Ideas 🚀

- **Context Injection:** "Focus on Summer Sale this week" → injects into all pillars
- **Style Enforcement:** Each pillar uses a specific visual style preset
- **Feed Forecast:** Preview how Instagram grid will look if approved
- **A/B Testing:** Generate 2 caption variants, pick best performer
- **Analytics:** Track engagement by pillar type

---

## Tech Considerations

- **New API needed:** You mentioned replacing GHL — design pillar system independently of posting mechanism
- **Cron:** Supabase Edge Function or Vercel Cron (pattern exists in `api/cron/task-reminders.ts`)
- **Caption AI:** Can reuse existing caption generation from AssetViewer
- **Image AI:** Same `prompts.ts` V3.2 architecture

---

## Open Questions

1. ~~Where should Pillars UI live?~~ → **Confirmed: Tab inside Planner page**
2. How often to run cron? Daily at midnight? Weekly on Sunday?
3. Default image generation on/off? (Cost consideration)
4. Team member access — can editors create pillars?
5. Sidebar naming — rename "Planner" to something more fitting? (Strategy, Content Hub, Command Center?)
