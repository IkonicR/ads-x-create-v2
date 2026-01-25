
export interface UserProfile {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  onboarding_completed: boolean;
  // Onboarding data
  role?: string;           // 'marketer' | 'founder' | 'agency' | 'creative' | 'developer'
  company_size?: string;   // 'solo' | '2-10' | '11-50' | '50+'
  primary_goal?: string;   // 'generate_ads' | 'schedule_posts' | 'build_brand' | 'other'
  referral_source?: string; // 'google' | 'social' | 'friend' | 'other'
  invite_code_used?: string;
  is_admin?: boolean;
}

export type BusinessType = 'Retail' | 'E-Commerce' | 'Service' | 'Other';

export interface Business {
  id: string;
  owner_id?: string; // <--- NEW: Links business to user
  name: string;
  type: BusinessType;
  industry: string;
  description: string;
  website: string;
  currency: string; // e.g. "USD", "EUR", "GBP"
  credits: number;
  role: 'Owner' | 'Editor' | 'Viewer';

  // --- SOCIAL MEDIA INTEGRATION (GHL) ---
  socialConfig?: {
    ghlLocationId?: string;      // GHL Sub-account Location ID
    ghlAccessToken?: string;     // Private Integration Token (per sub-account)
    onboardingStatus: 'pending' | 'connected' | 'failed';
    connectedAccounts?: {        // Cached from GHL API
      platform: string;          // 'facebook', 'instagram', etc.
      name: string;              // '@businessname' or 'Page Name'
      accountId: string;         // GHL account ID
      connectedAt?: string;
    }[];
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  voice: {
    // Deprecated: Sliders (Keep for backward compat or migration)
    sliders: {
      identity: number;
      style: number;
      emotion: number;
    };
    // New Voice System
    archetype: BrandArchetype; // <--- NEW
    tonePills: string[];       // <--- NEW: "Witty", "Professional", etc.
    keywords: string[];
    slogan: string;
    negativeKeywords: string[];
    tone?: string;
  };
  profile: BusinessProfile;
  adPreferences: AdPreferences;
  offerings: Offering[];
  teamMembers: TeamMember[];
  businessImages: BusinessImage[];
  inspirationImages: string[];

  // Brand Identity
  logoUrl: string;
  logoVariants?: { // <--- NEW
    dark?: string;
    light?: string;
    wordmark?: string;
    favicon?: string;
  };
  typography: TypographySettings; // <--- NEW

  // Strategy
  coreCustomerProfile: { // <--- NEW (Replaces generic targetAudience)
    demographics: string;
    psychographics: string;
    painPoints: string[];
    desires: string[];
  };
  competitors: { name: string; website: string }[]; // <--- NEW

  // Visual Motifs (Brand Signatures)
  visualMotifs: VisualMotif[];

  // Legacy / Misc
  fontName: string; // Deprecated in favor of typography.headingFont
  usps: string[];
  testimonials: Testimonial[];

  // Extended settings (optional for backward compat)
  socialSettings?: Record<string, any>;
  exportPresets?: Record<string, any>;
}

export type BrandArchetype =
  | 'The Innocent' | 'The Explorer' | 'The Sage' | 'The Hero'
  | 'The Outlaw' | 'The Magician' | 'The Guy/Girl Next Door' | 'The Lover'
  | 'The Jester' | 'The Caregiver' | 'The Creator' | 'The Ruler'
  | 'Unset';

export interface TypographySettings {
  headingFont: string; // e.g. "Playfair Display"
  bodyFont: string;    // e.g. "Roboto"
  scale: 'small' | 'medium' | 'large';
}

// ============================================================================
// STRATEGY SIDEBAR TYPES
// ============================================================================

// Visual Motifs - Recurring brand elements (e.g., whales, anchors)
export interface VisualMotif {
  id: string;
  name: string;           // Simple keyword: "Whale", "Beach Sunset", "Green Cross"
  description?: string;   // Optional detailed directive (rarely used)
  referenceImageUrl?: string;
  frequency?: 'always' | 'often' | 'sometimes' | 'contextual';
  prominence?: 'subtle' | 'moderate' | 'dominant' | 'prominent' | 'hidden'; // Used by prompts.ts
}

// Subject types for dynamic sidebar controls
export type SubjectType = 'product' | 'service' | 'person' | 'location' | 'none';

// Framing options per subject type
export type ProductFraming = 'hero' | 'lifestyle';
export type ServiceFraming = 'in_action' | 'outcome' | 'abstract';
export type TeamFraming = 'portrait' | 'action';
export type LocationFraming = 'exterior' | 'interior' | 'detail' | 'crowd';
export type TeamVibe = 'authority' | 'friendly' | 'creative';

// Copy strategy options
export type CopyStrategy = 'benefit' | 'problem_solution' | 'urgent' | 'minimal';

// Campaign preset identifiers
export type CampaignMode = 'flash_sale' | 'awareness' | 'local' | 'educational' | 'custom';

// The full generation strategy state
export interface GenerationStrategy {
  mode: CampaignMode;

  // Product-specific
  productFraming?: ProductFraming;
  showPrice: boolean;
  showPromo: boolean;
  strictLikeness: boolean;

  // Team-specific
  teamFraming?: TeamFraming;
  showNameRole: boolean;
  teamVibe?: TeamVibe;

  // Service-specific
  serviceFraming?: ServiceFraming;

  // Location-specific
  locationFraming?: LocationFraming;

  // Universal
  copyStrategy: CopyStrategy;
  customCta?: string;

  // Footer/Trust Stack
  trustStack: {
    website: boolean;
    location: boolean;
    phone: boolean;
    hours: boolean;
  };

  // Visual Motifs (IDs of selected motifs)
  selectedMotifIds: string[];

  // Slogan override
  sloganPlacement: 'auto' | 'header' | 'footer' | 'hidden';
}

export interface SystemPrompts {
  chatPersona: string;
  imageGenRules: string;
  taskGenRules: string;
}

export interface Testimonial {
  id: string;
  author: string;
  quote: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  imageUrl: string; // Base64 or URL
}

export interface BusinessImage {
  id: string;
  name: string;           // e.g. "Storefront", "Interior", "Product Display"
  description?: string;   // Optional context for AI
  imageUrl: string;
  additionalImages?: string[];
}

export interface ContactMethod {
  id: string;
  type: 'phone' | 'email' | 'website' | 'whatsapp' | 'address';
  value: string;
  label?: string; // e.g. "Sales", "Support"
  isPrimary: boolean;
  formatting?: {
    includeAreaCode?: boolean; // User request
  };
  customFormat?: string; // e.g. "Call: {value}"
  displayStyle?: 'standard' | 'value_only' | 'action' | 'custom'; // <--- NEW: UX Friendly
}

export interface BusinessProfile {
  contactEmail: string;
  contactPhone: string;
  address: string; // Crucial for Retail
  publicLocationLabel?: string; // How the AI refers to the location (e.g. "Downtown Austin")

  // --- NEW: OPERATING MODEL ---
  operatingMode?: 'storefront' | 'online' | 'service' | 'appointment';
  serviceArea?: string; // e.g. "Greater Austin Area"
  bookingUrl?: string; // e.g. "calendly.com/..."

  socials: { platform: string; handle: string }[];
  // operatingMode?: 'standard' | 'always_open' | 'appointment_only'; // DEPRECATED
  // bookingUrl?: string; // MOVED UP
  timezone?: string;
  hours: { day: string; open: string; close: string; closed: boolean }[];
  website?: string;
  showHours?: boolean; // Used by prompts.ts

  // --- NEW: CONTACT HUB ---
  contacts: ContactMethod[];
}

export interface AdPreferences {
  targetAudience: string;
  goals: string;
  complianceText: string;
  preferredCta: string;
  sloganUsage?: 'Always' | 'Sometimes' | 'Never'; // DEPRECATED: Use sloganProminence instead

  // --- NEW: VISIBILITY CONTROLS ---
  // contactMethods: ('website' | 'phone' | 'whatsapp' | 'email' | 'address')[]; // DEPRECATED
  contactIds: string[]; // IDs  // --- NEW: LOCATION ---
  locationDisplay: 'full_address' | 'city_state' | 'online_only' | 'hidden' | 'custom_text';
  locationText?: string; // Custom override (e.g. "My Shop (Downtown)")

  // --- NEW: HOURS & HOLIDAY ---
  hoursDisplay: 'all_hours' | 'weekends_only' | 'custom_selection' | 'hidden' | 'custom_text';
  hoursDisplayDays?: string[]; // Days to show if custom_selection (e.g. ["Monday", "Friday"])
  hoursText?: string; // Custom text override (e.g. "Mon-Fri 9am-5pm")

  holidayMode: {
    isActive: boolean;
    name: string; // e.g. "Christmas Hours"
    hours: string; // e.g. "Open late until 9pm"
    cta?: string; // Optional override for CTA during holiday
  };

  targetLanguage: string; // e.g. "English"

  // --- PROMINENCE CONTROLS (used by prompts.ts) ---
  sloganProminence?: 'subtle' | 'moderate' | 'prominent' | 'standard' | 'hidden';
  showBusinessName?: boolean;
  businessNameProminence?: 'subtle' | 'moderate' | 'prominent' | 'standard' | 'hidden';
  contactProminence?: 'subtle' | 'moderate' | 'prominent' | 'standard' | 'hidden';
  locationProminence?: 'subtle' | 'moderate' | 'prominent' | 'standard' | 'hidden';
  hoursProminence?: 'subtle' | 'moderate' | 'prominent' | 'standard' | 'hidden';
}

export interface Offering {
  id: string;
  name: string;
  description: string;
  price: string;
  isFree?: boolean;              // NEW: For free offerings (delivery, consultation, etc.)
  category: string;
  active: boolean;
  imageUrl?: string;
  additionalImages?: string[];   // Multiple angles/details
  preserveLikeness?: boolean;
  // Marketing Brain Fields
  targetAudience?: string;
  benefits?: string[];
  features?: string[];           // Technical specs vs outcomes
  promotion?: string;            // e.g., "20% off"
  termsAndConditions?: string;   // NEW: Per-offering T&Cs
}

// Subtask (Checkpoint) within a Task
export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

// Task Categories for filtering
export type TaskCategory = 'content' | 'ads' | 'social' | 'email' | 'analytics' | 'other';

// Task Attachment for files and linked assets
export interface TaskAttachment {
  id: string;
  type: 'file' | 'asset';
  name: string;
  url: string;
  mimeType?: string;
  size?: number;
  assetId?: string;      // For linked assets from Creative Engine
  thumbnailUrl?: string; // For image previews
  createdAt: string;
}

// Technical specifications for deliverables
export type DimensionUnit = 'px' | 'cm' | 'mm' | 'in';
export type FileFormat = 'PNG' | 'JPG' | 'PDF' | 'SVG' | 'WEBP' | 'MP4' | 'GIF';

export interface TaskTechSpecs {
  fileFormat?: FileFormat;
  dimensions?: {
    width: number;
    height: number;
    unit: DimensionUnit;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  dueDate?: string;                   // Optional, ISO string
  createdAt: string;
  updatedAt: string;
  category?: TaskCategory;
  labels?: string[];                  // Free-form tags
  subtasks?: Subtask[];               // Checkpoints
  attachments?: TaskAttachment[];     // Files and linked assets
  techSpecs?: TaskTechSpecs;          // Technical requirements
  sortOrder: number;                  // For drag-drop ordering
  businessId?: string;                // Optional: tag to a specific business
  assigneeId?: string;                // Optional: assigned team member user ID
  notifyEmail?: boolean;              // Send email on assignment/reminder
  notifyInApp?: boolean;              // Send in-app notification
  recurrence?: {                      // Recurring task settings
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number;                // Every N days/weeks/months (default 1)
  };
}

export interface Asset {
  id: string;
  type: 'image' | 'text' | 'video';
  content: string; // URL or text content
  prompt: string;
  createdAt: string;
  stylePreset?: string;
  aspectRatio?: string; // Persisted ratio (e.g. "16:9")
  businessId?: string; // Link to business
  styleId?: string; // Link to style preset ID
  subjectId?: string; // Link to subject/offering ID
  modelTier?: 'flash' | 'pro' | 'ultra';
}

export type AssetStatus = 'generating' | 'loading_image' | 'complete';

export interface ExtendedAsset extends Asset {
  localStatus?: AssetStatus;
  jobId?: string; // Server job ID for polling
  animationPhase?: 'warmup' | 'cruise' | 'deceleration' | 'revealed'; // Tracks animation progress
  progress?: number; // <--- NEW: Persist display progress (0-100)
}

export interface StyleReferenceImage {
  id: string;
  url: string;
  isActive: boolean;
}

// ============================================================================
// V2 GOD-TIER PRODUCTION PRESET SCHEMA (schemaVersion: 3.0)
// Universal Creative Engine - ALL FIELDS ARE FLEXIBLE STRINGS
// ============================================================================

// 1. MEDIUM CONTROLLER - The Core Engine
export interface MediumExecutionDetails {
  // Photography
  cameraSystem?: string; // e.g. "Hasselblad Medium Format", "Sony A7R IV", "Analog Portra 400"
  shotStyle?: string; // e.g. "Studio Product", "Lifestyle Editorial", "Action Freeze"
  // 3D Render
  renderEngine?: string; // e.g. "Octane", "Unreal Engine 5", "Blender Cycles"
  style?: string; // e.g. "Hyperrealistic", "Clay Maquette", "Low-Poly Stylized"
  // Illustration
  technique?: string; // e.g. "Watercolor wash", "Digital concept art", "Cel-shaded anime"
  brushwork?: string; // e.g. "Smooth blended", "Textured impasto", "Loose expressive"
  // Vector
  vectorStyle?: string; // e.g. "Flat minimalist", "Gradient mesh", "Isometric"
  complexity?: string; // e.g. "Simple shapes", "Highly detailed"
}

export interface MediumController {
  medium: string; // e.g. "Photography", "3D Render", "Digital Illustration", "Vector Art", "Mixed Media"
  executionDetails: MediumExecutionDetails;
}

// 2. VIEWPOINT - Universal Composition & Framing
export interface Viewpoint {
  shotType: string; // e.g. "ECU (Extreme Close-Up)", "Medium Shot", "Wide Shot", "Overhead Flatlay"
  angle: string; // e.g. "Eye-Level", "Low-Angle Hero", "High-Angle", "Dutch Angle"
  perspective: string; // e.g. "Ultra-Wide 14mm", "Standard 50mm", "Telephoto 135mm", "Orthographic"
  depthOfField: string; // e.g. "Extremely Shallow f/1.4", "Shallow f/2.8", "Deep Focus f/16"
  framingRule: string; // e.g. "Centered Dominance", "Rule of Thirds", "Golden Ratio", "Negative Space"
}

// 3. BRAND APPLICATION - The Commercial Imperative (Logo Treatment)
export interface BrandApplication {
  integrationMethod: string; // e.g. "Surface Decal", "Embossed", "3D Object", "Floating Element", "Light Projection"
  materiality: string; // e.g. "Polished Chrome", "Brushed Metal", "Neon Tubing", "Gold Foil", "Holographic"
  lightingInteraction: string; // e.g. "Standard", "Backlit", "Self-Luminous/Glowing"
  prominence: string; // e.g. "Subtle", "Integrated", "Dominant Focal Point"
}

// 4. LIGHTING & ATMOSPHERE - Mood and Shape
export interface LightingConfig {
  style: string; // e.g. "Three-Point Studio", "Rembrandt", "Split Dramatic", "High-Key", "Low-Key Chiaroscuro"
  quality: string; // e.g. "Hard Sharp", "Soft Diffused", "Specular Highlights"
  contrast: string; // e.g. "Flat 1:1", "Soft 2:1", "Dramatic 4:1", "Intense 8:1"
  temperature: string; // e.g. "2700K Tungsten Warm", "5600K Daylight", "7000K Cool Overcast"
  atmospherics: string; // e.g. "Clear Crisp", "Light Haze", "Volumetric Fog", "Dust Particles", "Lens Flare"
}

// 5. AESTHETICS & FINISH - The Final Polish
export interface AestheticsConfig {
  colorGrade: string; // e.g. "Neutral", "Teal and Orange", "Desaturated Grit", "High Vibrancy", "Vintage Film"
  clarity: string; // e.g. "Soft Dreamy", "Standard", "Crisp High-Frequency"
  textureOverlay: string; // e.g. "None", "Fine Film Grain", "Digital Noise", "Halftone", "Canvas"
  primarySurfaceMaterial: string; // e.g. "Matte", "High-Gloss", "Metallic", "Subsurface Scattering", "Glass"
}

// THE MASTER CONFIG OBJECT
export interface ProductionPresetConfig {
  schemaVersion: '3.0';
  mediumController: MediumController;
  viewpoint: Viewpoint;
  brandApplication: BrandApplication;
  lighting: LightingConfig;
  aesthetics: AestheticsConfig;
}

// UPDATED: StylePreset with V2 God-Tier Config
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  promptModifier: string; // Legacy fallback / simple override
  config?: ProductionPresetConfig; // <--- V2 GOD-TIER CONFIG
  sortOrder?: number;
  isActive?: boolean;
  referenceImages?: StyleReferenceImage[];
  styleCues?: string[];
  avoid?: string[];
}

export interface LinkedEntity {
  id: string;
  type: 'style' | 'preset' | 'business' | 'asset';
  name: string;
  previewUrl?: string; // For images
}

export interface AdminNote {
  id: string;
  content: string;
  category: 'Idea' | 'Roadmap' | 'Bug';
  createdAt: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  tags?: string[];
  links?: LinkedEntity[];
}

export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  PROFILE = 'PROFILE',
  BRAND_KIT = 'BRAND_KIT',
  OFFERINGS = 'OFFERINGS',
  TASKS = 'TASKS',
  GENERATOR = 'GENERATOR',
  LIBRARY = 'LIBRARY',
  ADMIN = 'ADMIN',
  CHAT = 'CHAT',
  USER_PROFILE = 'USER_PROFILE',
  DESIGN_LAB = 'DESIGN_LAB',
  PLANNER = 'PLANNER',
  SOCIAL = 'SOCIAL'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachment?: {
    type: 'image';
    content: string; // Base64 or URL
  };
  attachments?: {  // Phase 5: Multiple images for batch generation
    type: 'image';
    content: string;
  }[];
  imageUrl?: string;  // Phase 6: Supabase URL for AI vision
}

// ============================================================================
// SOCIAL MEDIA TYPES (GHL Integration)
// ============================================================================

export interface SocialPost {
  id: string;
  ghlPostId?: string;
  parentPostId?: string;
  businessId: string;
  locationId?: string;
  summary: string;
  mediaUrls: string[];
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  scheduledAt?: string;
  publishedAt?: string;
  platforms: string[];
  syncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SocialAccount {
  id: string;
  platform: string;  // 'instagram', 'facebook', 'linkedin', etc.
  name: string;
  avatar?: string;
  type?: string;     // 'page', 'profile', 'business' (GHL account type)
}

// ============================================================================
// CONTENT PILLARS TYPES
// ============================================================================

export type PillarTheme = 'motivation' | 'product' | 'team' | 'testimonial' | 'educational' | 'custom';
export type PillarScheduleType = 'weekly' | 'monthly';
export type PillarSubjectMode = 'static' | 'rotate_offerings' | 'rotate_team' | 'rotate_locations';
export type PillarDraftStatus = 'pending' | 'approved' | 'skipped' | 'posted' | 'expired';

export interface ContentPillar {
  id: string;
  businessId: string;

  // Identity
  name: string;
  theme: PillarTheme;

  // Schedule
  scheduleType: PillarScheduleType;
  dayOfWeek?: number;      // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;     // 1-31

  // Content Source
  subjectMode: PillarSubjectMode;
  staticSubjectId?: string;
  lastRotatedIndex?: number;

  // Style & Generation
  stylePresetId?: string;
  promptTemplate?: string;
  generateImage: boolean;

  // Platforms
  platforms: string[];

  // V2: Enhanced configuration
  instructions?: string;           // Natural language from chat builder
  platformOutputs?: {              // Per-platform settings
    platform: string;
    aspectRatio: string;
    captionStyle?: string;
  }[];
  styleRotation?: {                // Style rotation config
    enabled: boolean;
    styleIds: string[];
    currentIndex: number;
  };

  // State
  isActive: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface PillarDraft {
  id: string;
  pillarId: string;
  businessId: string;

  // Generated Content
  caption: string;
  imageAssetId?: string;
  imageUrl?: string;

  // Target
  scheduledFor: string;  // Date string (YYYY-MM-DD)
  platforms: string[];

  // Status
  status: PillarDraftStatus;
  approvedAt?: string;
  postedAt?: string;

  // Subject tracking
  subjectType?: 'offering' | 'team' | 'location';
  subjectId?: string;

  // Metadata
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

// Type alias for business hours (used by formatters.ts)
export type BusinessHour = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
  slots?: { open: string; close: string }[]; // Multiple time slots per day
};

// Notification interface (used by NotificationContext)
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number; // ms, undefined = persistent
  createdAt: Date;
}
