
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
  credits: number;
  role: 'Owner' | 'Editor' | 'Viewer';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  voice: {
    // Scales from 0 (Left) to 100 (Right)
    sliders: {
      identity: number; // 0 (Reserved) <-> 100 (Assertive)
      style: number;    // 0 (Formal)   <-> 100 (Casual)
      emotion: number;  // 0 (Serious)  <-> 100 (Humorous)
    };
    keywords: string[];
    slogan: string;
    negativeKeywords: string[]; // Words to NEVER use
    tone?: string;
  };
  profile: BusinessProfile;
  adPreferences: AdPreferences;
  offerings: Offering[];
  teamMembers: TeamMember[];
  inspirationImages: string[]; // URLs/Base64 of ads they admire
  
  // New Persuasion Data Points
  logoUrl: string;
  fontName: string;
  usps: string[]; // Unique Selling Points
  testimonials: Testimonial[];
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

export interface BusinessProfile {
  contactEmail: string;
  contactPhone: string;
  address: string; // Crucial for Retail
  publicLocationLabel?: string; // How the AI refers to the location (e.g. "Downtown Austin")
  socials: { platform: string; handle: string }[];
  operatingMode?: 'standard' | 'always_open' | 'appointment_only';
  bookingUrl?: string;
  timezone?: string;
  hours: { day: string; open: string; close: string; closed: boolean }[];
}

export interface AdPreferences {
  targetAudience: string;
  goals: string;
  complianceText: string;
  preferredCta: string;
  sloganUsage: 'Always' | 'Sometimes' | 'Never';
}

export interface Offering {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  active: boolean;
  imageUrl?: string;
  preserveLikeness?: boolean;
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
  logoMaterial?: string; // Instructions for logo integration
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  icon?: string;
  imageUrl?: string;
  logoPlacement?: string; // Instructions for where the logo goes
}

export interface AdminNote {
  id: string;
  content: string;
  category: 'Idea' | 'Roadmap' | 'Bug';
  createdAt: string;
  isDone: boolean;
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
