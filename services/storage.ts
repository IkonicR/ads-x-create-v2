
import { supabase } from './supabase';
import { Business, Asset, Task, AdminNote, SystemPrompts, UserProfile, Preset, StylePreset } from '../types';

const DEFAULT_BUSINESS: Business = {
  id: '1',
  name: 'Lumina Coffee',
  type: 'Retail',
  industry: 'Food & Beverage',
  description: 'Artisanal coffee roasters focusing on sustainable beans.',
  website: 'luminacoffee.com',
  credits: 120,
  role: 'Owner',
  colors: { primary: '#4A3B32', secondary: '#D4A373', accent: '#A95C36' },
  voice: { 
    sliders: {
      identity: 40, // Somewhat reserved
      style: 70,    // Fairly casual
      emotion: 50   // Balanced
    },
    keywords: ['Sustainable', 'Artisan', 'Morning'], 
    slogan: 'Wake up to better.',
    negativeKeywords: ['Cheap', 'Fast Food', 'Bitter']
  },
  profile: {
    contactEmail: 'hello@luminacoffee.com',
    contactPhone: '555-0123',
    address: '123 Bean St, Seattle, WA',
    socials: [{ platform: 'Instagram', handle: '@luminacoffee' }],
    hours: [
      { day: 'Mon', open: '07:00', close: '18:00', closed: false },
      { day: 'Tue', open: '07:00', close: '18:00', closed: false },
      { day: 'Wed', open: '07:00', close: '18:00', closed: false },
      { day: 'Thu', open: '07:00', close: '18:00', closed: false },
      { day: 'Fri', open: '07:00', close: '18:00', closed: false },
      { day: 'Sat', open: '08:00', close: '16:00', closed: false },
      { day: 'Sun', open: '00:00', close: '00:00', closed: true },
    ]
  },
  adPreferences: {
    targetAudience: 'Young professionals and coffee enthusiasts',
    goals: 'Drive in-store visits',
    complianceText: '',
    preferredCta: 'Order Now',
    sloganUsage: 'Sometimes'
  },
  offerings: [
    { id: 'p1', name: 'Signature Espresso Blend', description: 'Notes of dark chocolate and cherry.', price: '$18', category: 'Coffee', active: true },
    { id: 'p2', name: 'Cold Brew Can', description: 'Ready to drink, smooth finish.', price: '$5', category: 'Beverage', active: true }
  ],
  teamMembers: [],
  inspirationImages: [],
  logoUrl: '',
  fontName: 'Inter',
  usps: ['Ethically Sourced', 'Roasted Weekly', 'Award Winning'],
  testimonials: [
    { id: 't1', author: 'Sarah J.', quote: 'Best latte I have ever had.' }
  ]
};

const DEFAULT_TASKS: Task[] = [
  { id: 't1', title: 'Approve Winter Campaign', status: 'To Do', priority: 'High', dueDate: '2023-11-01' },
  { id: 't2', title: 'Update Store Hours', status: 'Done', priority: 'Low', dueDate: '2023-10-15' }
];

// Helper to map DB Business to App Business
const mapBusinessFromDB = (row: any): Business => ({
  id: row.id,
  owner_id: row.owner_id, // <--- Mapped
  name: row.name,
  type: row.type,
  industry: row.industry,
  description: row.description,
  website: row.website,
  credits: row.credits,
  role: row.role,
  colors: row.colors,
  voice: row.voice,
  profile: row.profile,
  adPreferences: row.ad_preferences,
  offerings: row.offerings,
  teamMembers: row.team_members,
  inspirationImages: row.inspiration_images,
  logoUrl: row.logo_url,
  fontName: row.font_name,
  usps: row.usps,
  testimonials: row.testimonials
});

// Helper to map App Business to DB payload
const mapBusinessToDB = (business: Business) => ({
  id: business.id,
  owner_id: business.owner_id, // <--- Mapped
  name: business.name,
  type: business.type,
  industry: business.industry,
  description: business.description,
  website: business.website,
  credits: business.credits,
  role: business.role,
  colors: business.colors,
  voice: business.voice,
  profile: business.profile,
  ad_preferences: business.adPreferences,
  offerings: business.offerings,
  team_members: business.teamMembers,
  inspiration_images: business.inspirationImages,
  logo_url: business.logoUrl,
  font_name: business.fontName,
  usps: business.usps,
  testimonials: business.testimonials
});

export const StorageService = {
  getBusinesses: async (userId?: string): Promise<Business[]> => {
    let query = supabase.from('businesses').select('*');
    
    // SECURITY: Only show businesses owned by the user (if userId provided)
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching businesses:', error);
      return [];
    }

    if (!data || data.length === 0) {
      // Do NOT seed default business implicitly here anymore.
      // If user has no businesses, App should redirect to Onboarding.
      // Returning empty array is correct.
      return [];
    }

    return data.map(mapBusinessFromDB);
  },

  saveBusiness: async (business: Business, userId?: string): Promise<void> => {
    const payload = mapBusinessToDB(business);
    
    // SECURITY: Ensure owner_id is set on creation
    if (!payload.owner_id && userId) {
      payload.owner_id = userId;
    }

    const { error } = await supabase.from('businesses').upsert(payload);
    if (error) console.error('Error saving business:', error);
  },

  // --- Assets ---
  
  async uploadBusinessAsset(file: File, businessId: string, folder: string = 'logos'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/${folder}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading asset:', error);
      return null;
    }
  },

  async saveAsset(asset: Asset): Promise<void> {
    const { error } = await supabase
      .from('assets')
      .insert({
        id: asset.id,
        business_id: asset.businessId,
        type: asset.type,
        content: asset.content,
        prompt: asset.prompt,
        style_preset: asset.stylePreset,
        aspect_ratio: asset.aspectRatio, // Save ratio
        created_at: asset.createdAt
      });

    if (error) {
      console.error('Error saving asset:', error);
    }
  },

  async getAssets(businessId: string): Promise<Asset[]> {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      prompt: row.prompt,
      createdAt: row.created_at,
      stylePreset: row.style_preset,
      aspectRatio: row.aspect_ratio // Load ratio
    }));
  },

  deleteAsset: async (assetId: string): Promise<void> => {
    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', assetId);
    
    if (error) {
      console.error('Error deleting asset:', error);
      throw error;
    }
  },

  getTasks: async (businessId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('business_id', businessId);

    if (error) {
      console.error('Error fetching tasks:', error);
      return DEFAULT_TASKS;
    }

    if (!data || data.length === 0) {
      // Seed default tasks
      const tasksPayload = DEFAULT_TASKS.map(t => ({
        business_id: businessId,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate,
        created_at: new Date().toISOString()
      }));
      
      const { data: inserted } = await supabase.from('tasks').insert(tasksPayload).select();
      if (inserted) {
        return inserted.map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          priority: row.priority,
          dueDate: row.due_date
        }));
      }
      return DEFAULT_TASKS;
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date
    }));
  },

  saveTasks: async (tasks: Task[], businessId: string): Promise<void> => {
    // We need businessId to save tasks correctly.
    const payloads = tasks.map(t => ({
      id: t.id,
      business_id: businessId,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.dueDate
    }));

    // Using upsert with onConflict on 'id' to handle duplicates gracefully
    const { error } = await supabase.from('tasks').upsert(payloads, { onConflict: 'id' });
    if (error) console.error('Error saving tasks:', error);
  },

  getAdminNotes: async (): Promise<AdminNote[]> => {
    const { data, error } = await supabase.from('admin_notes').select('*');
    if (error) return [];
    return data.map((row: any) => ({
      id: row.id,
      content: row.content,
      category: row.category,
      isDone: row.is_done,
      createdAt: row.created_at
    }));
  },

  saveAdminNotes: async (notes: AdminNote[]): Promise<void> => {
    const payloads = notes.map(n => ({
      id: n.id,
      content: n.content,
      category: n.category,
      is_done: n.isDone,
      created_at: n.createdAt
    }));
    const { error } = await supabase.from('admin_notes').upsert(payloads);
    if (error) console.error('Error saving notes:', error);
  },

  getSystemPrompts: async (): Promise<SystemPrompts | null> => {
    const { data, error } = await supabase.from('system_prompts').select('*').limit(1).maybeSingle();
    if (error || !data) return null;
    return {
      chatPersona: data.chat_persona,
      imageGenRules: data.image_gen_rules,
      taskGenRules: data.task_gen_rules
    };
  },

  async saveSystemPrompts(prompts: SystemPrompts): Promise<void> {
    // Check if one exists to get ID, or just use a fixed ID? 
    // Let's just delete all and insert new, or use a fixed ID for singleton.
    // Cleaner: Get the existing one, update it.
    const existing = await StorageService.getSystemPrompts();
    
    // Actually, we can just upsert with a known query if we had an ID.
    // Since we don't track the ID in SystemPrompts type, let's fetch the ID first if it exists.
    
    const { data } = await supabase.from('system_prompts').select('id').limit(1).maybeSingle();
    
    const payload: any = {
      chat_persona: prompts.chatPersona,
      image_gen_rules: prompts.imageGenRules,
      task_gen_rules: prompts.taskGenRules
    };

    if (data?.id) {
      payload.id = data.id;
    }

    const { error } = await supabase.from('system_prompts').upsert(payload);
    if (error) console.error('Error saving system prompts:', error);
  },

  // --- Config (Presets & Styles) ---

  getPresets: async (): Promise<Preset[]> => {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) {
      console.error('Error fetching presets:', error);
      return [];
    }
    
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      promptModifier: row.prompt_modifier,
      icon: row.icon,
      imageUrl: row.image_url,
      logoPlacement: row.logo_placement
    }));
  },

  savePreset: async (preset: Preset & { sortOrder?: number, isActive?: boolean }): Promise<void> => {
    const payload = {
      id: preset.id,
      name: preset.name,
      description: preset.description,
      prompt_modifier: preset.promptModifier,
      icon: preset.icon,
      image_url: preset.imageUrl,
      logo_placement: preset.logoPlacement,
      sort_order: preset.sortOrder,
      is_active: preset.isActive
    };
    const { error } = await supabase.from('presets').upsert(payload);
    if (error) console.error('Error saving preset:', error);
  },

  getStyles: async (): Promise<StylePreset[]> => {
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .order('sort_order', { ascending: true });
      
    if (error) {
      console.error('Error fetching styles:', error);
      return [];
    }
    
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.image_url,
      promptModifier: row.prompt_modifier,
      logoMaterial: row.logo_material
    }));
  },

  saveStyle: async (style: StylePreset & { sortOrder?: number, isActive?: boolean }): Promise<void> => {
    const payload = {
      id: style.id,
      name: style.name,
      description: style.description,
      image_url: style.imageUrl,
      prompt_modifier: style.promptModifier,
      logo_material: style.logoMaterial,
      sort_order: style.sortOrder,
      is_active: style.isActive
    };
    const { error } = await supabase.from('styles').upsert(payload);
    if (error) console.error('Error saving style:', error);
  },

  // --- User Profiles ---

  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('Error getting session:', error);
    return session;
  },

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateUserProfile(profile: Partial<UserProfile> & { id: string }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .upsert(profile);

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  }
};
