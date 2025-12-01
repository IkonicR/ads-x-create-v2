
export interface UserProfile {
  id: string;
  updated_at: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  onboarding_completed: boolean;
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

  // Legacy / Misc
  fontName: string; // Deprecated in favor of typography.headingFont
  usps: string[];
  testimonials: Testimonial[];
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

  // --- NEW: CONTACT HUB ---
  contacts: ContactMethod[];
}

export interface AdPreferences {
  targetAudience: string;
  goals: string;
  complianceText: string;
  preferredCta: string;
  sloganUsage: 'Always' | 'Sometimes' | 'Never';

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
}

export interface Offering {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  active: boolean;
  imageUrl?: string;
  additionalImages?: string[]; // <--- NEW: Multiple angles/details
  preserveLikeness?: boolean;
  // Marketing Brain Fields
  targetAudience?: string;
  benefits?: string[];
  features?: string[]; // Distinct from benefits (technical specs vs outcomes)
  promotion?: string; // e.g., "20% off"
}

export interface Task {
  id: string;
  title: string;
  status: 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
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
}

export type AssetStatus = 'generating' | 'loading_image' | 'complete';

export interface ExtendedAsset extends Asset {
  localStatus?: AssetStatus;
  // aspectRatio is already in Asset, but ExtendedAsset might need it explicitly if Asset didn't have it (it does now).
  // We can keep it clean.
}

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  promptModifier: string;
  logoMaterial: string; // e.g. "Neon", "Gold Foil", "Matte"
  config?: {
    layout: string; // e.g. "split_vertical_60_40", "hero_center"
    camera: string; // e.g. "Straight-on", "Isometric"
    lighting: string; // e.g. "Soft diffused"
    negative_space: string; // e.g. "Top left 30%"
    text_slots: {
      role: 'headline' | 'subhead' | 'body' | 'cta' | 'price';
      position?: string; // "top_left", "bottom_center"
      style?: string; // "bold_sans", "handwritten"
      count?: number; // For list items
    }[];
  }; // <--- Fix: Add missing property
  sortOrder?: number;
  isActive?: boolean;
  referenceImages?: string[]; // Array of URLs for style reference
  styleCues?: string[]; // <--- NEW: Positive style reinforcements
  avoid?: string[]; // <--- NEW: Negative constraints
  logoPlacement?: string; // <--- NEW: Instructions for logo placement
  textMaterial?: string; // <--- NEW: Material for text rendering (e.g. "Neon", "Gold Foil")
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
  DESIGN_LAB = 'DESIGN_LAB'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  attachment?: {
    type: 'image';
    content: string; // Base64
  };
}
