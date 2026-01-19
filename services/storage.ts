
import { supabase } from './supabase';
import { Business, Asset, Task, AdminNote, SystemPrompts, UserProfile, StylePreset } from '../types';

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
    archetype: 'The Sage',
    tonePills: ['Sustainable', 'Artisan'],
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
    ],
    contacts: []
  },
  adPreferences: {
    targetAudience: 'Young professionals and coffee enthusiasts',
    goals: 'Drive in-store visits',
    complianceText: '',
    preferredCta: 'Order Now',
    sloganProminence: 'standard',
    businessNameProminence: 'standard',
    contactProminence: 'standard',
    locationProminence: 'standard',
    hoursProminence: 'standard',
    contactIds: [],
    locationDisplay: 'full_address',
    hoursDisplay: 'all_hours',
    holidayMode: { isActive: false, name: '', hours: '' },
    targetLanguage: 'English'
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
  ],
  currency: 'USD',
  typography: { headingFont: 'Playfair Display', bodyFont: 'Lato', scale: 'medium' },
  coreCustomerProfile: {
    demographics: 'Urban professionals, 25-45',
    psychographics: 'Eco-conscious, values quality over speed',
    painPoints: ['Burnt coffee', 'Unethical sourcing'],
    desires: ['A morning ritual', 'Sustainable choices']
  },
  competitors: [],
  visualMotifs: [],
  businessImages: []
};

const DEFAULT_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Create your first marketing task',
    description: 'Click the + button to add tasks to your marketing board.',
    status: 'To Do',
    priority: 'Medium',
    category: 'other',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sortOrder: 0
  }
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
  currency: row.currency || 'USD', // <--- Default to USD
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
  testimonials: row.testimonials,
  logoVariants: row.logo_variants,
  typography: row.typography,
  coreCustomerProfile: row.core_customer_profile,
  competitors: row.competitors,
  visualMotifs: row.visual_motifs || [],
  businessImages: row.business_images || [],
  socialConfig: row.social_config || undefined, // <--- GHL Integration
  socialSettings: row.social_settings || undefined, // <--- Social Posting Settings
  exportPresets: row.export_presets || [] // <--- Export Presets
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
  currency: business.currency, // <--- Added
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
  testimonials: business.testimonials,
  logo_variants: business.logoVariants,
  typography: business.typography,
  core_customer_profile: business.coreCustomerProfile,
  competitors: business.competitors,
  visual_motifs: business.visualMotifs,
  business_images: business.businessImages,
  social_config: business.socialConfig || null, // <--- GHL Integration
  social_settings: business.socialSettings || null, // <--- Social Posting Settings
  export_presets: business.exportPresets || null // <--- Export Presets
});

export const StorageService = {
  getBusinesses: async (userId?: string): Promise<Business[]> => {
    if (!userId) {
      // No user = no businesses (security)
      console.log('[Storage] No userId provided, returning empty');
      return [];
    }

    console.log('[Storage] Fetching businesses for user:', userId);

    // 1. Get businesses where user is owner
    const { data: ownedBusinesses, error: ownedError } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId);

    if (ownedError) {
      console.error('[Storage] Error fetching owned businesses:', ownedError);
    }

    // 2. Get memberships with access_scope AND sort_order
    const { data: membershipData, error: memberError } = await supabase
      .from('business_members')
      .select('business_id, access_scope, sort_order')
      .eq('user_id', userId);

    if (memberError) {
      console.error('[Storage] Error fetching memberships:', memberError);
    }

    // Build a map of business_id -> sort_order for sorting later
    const sortOrderMap = new Map<string, number>();
    membershipData?.forEach(m => {
      sortOrderMap.set(m.business_id, m.sort_order ?? 0);
    });

    let memberBusinesses: any[] = [];
    let allAccessBusinesses: any[] = [];

    if (membershipData && membershipData.length > 0) {
      // Check for 'all' access scope - grants access to ALL owner's businesses
      const hasAllAccess = membershipData.some(m => m.access_scope === 'all');

      if (hasAllAccess) {
        // Find the business where they have 'all' access
        const allAccessMembership = membershipData.find(m => m.access_scope === 'all');
        if (allAccessMembership) {
          // Get the owner of that business
          const { data: ownerBusiness } = await supabase
            .from('business_members')
            .select('user_id')
            .eq('business_id', allAccessMembership.business_id)
            .eq('role', 'owner')
            .single();

          if (ownerBusiness?.user_id) {
            // Get ALL businesses owned by that owner
            const { data: ownerBusinesses } = await supabase
              .from('businesses')
              .select('*')
              .eq('owner_id', ownerBusiness.user_id);

            allAccessBusinesses = ownerBusinesses || [];
          }
        }
      }

      // Get regular (single-access) member businesses
      const singleAccessIds = membershipData
        .filter(m => m.access_scope !== 'all')
        .map(m => m.business_id);

      if (singleAccessIds.length > 0) {
        const { data: businesses, error: bizError } = await supabase
          .from('businesses')
          .select('*')
          .in('id', singleAccessIds);

        if (bizError) {
          console.error('[Storage] Error fetching member businesses:', bizError);
        } else {
          memberBusinesses = businesses || [];
        }
      }
    }

    // 3. Merge and deduplicate by ID
    const allBusinesses = [...(ownedBusinesses || []), ...memberBusinesses, ...allAccessBusinesses];
    const uniqueBusinesses = allBusinesses.filter(
      (biz, index, self) => index === self.findIndex(b => b.id === biz.id)
    );

    console.log(`[Storage] Found ${uniqueBusinesses.length} businesses (${ownedBusinesses?.length || 0} owned, ${memberBusinesses.length} as member, ${allAccessBusinesses.length} via all-access)`);

    if (!uniqueBusinesses || uniqueBusinesses.length === 0) {
      return [];
    }

    // 4. Map and sort by sort_order
    const mappedBusinesses = uniqueBusinesses.map(mapBusinessFromDB);
    mappedBusinesses.sort((a, b) => {
      const orderA = sortOrderMap.get(a.id) ?? 999;
      const orderB = sortOrderMap.get(b.id) ?? 999;
      return orderA - orderB;
    });

    return mappedBusinesses;
  },

  saveBusiness: async (business: Business, userId?: string): Promise<void> => {
    const payload = mapBusinessToDB(business);

    // SECURITY: Ensure owner_id is set on creation
    if (!payload.owner_id && userId) {
      payload.owner_id = userId;
    }

    // Check if this business already exists (to determine if we need to create business_members)
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', business.id)
      .maybeSingle();

    const isNewBusiness = !existingBusiness && userId;

    const { data, error } = await supabase
      .from('businesses')
      .upsert(payload)
      .select('id'); // Request return of ID to verify update happened

    if (error) {
      console.error('Error saving business:', error);
      throw error;
    }

    // CHECK FOR SILENT FAILURE (RLS)
    if (!data || data.length === 0) {
      console.error('[Storage] Save failed silently: 0 rows updated. Likely permission/RLS issue.');
      throw new Error('You do not have permission to update this business profile.');
    }

    // CRITICAL: For new businesses, create the business_members owner record
    // This is required for subscription lookups via get_business_owner_subscription RPC
    if (isNewBusiness && userId) {
      console.log('[Storage] Creating owner membership for new business:', business.id);
      const { error: memberError } = await supabase
        .from('business_members')
        .upsert({
          business_id: business.id,
          user_id: userId,
          role: 'owner',
          access_scope: 'single'
        }, { onConflict: 'business_id,user_id' });

      if (memberError) {
        console.error('[Storage] Warning: Failed to create owner membership:', memberError);
        // Don't throw - business was created, membership is a secondary concern
      } else {
        console.log('[Storage] Owner membership created successfully');
      }
    }
  },

  deleteBusiness: async (businessId: string): Promise<void> => {
    const { error } = await supabase.from('businesses').delete().eq('id', businessId);
    if (error) {
      console.error('Error deleting business:', error);
      throw error;
    }
  },

  // --- Assets ---

  async uploadBusinessAsset(file: File, businessId: string, folder: string = 'logos'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

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

  async uploadSystemAsset(file: File, folder: string = 'styles'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      // Upload to a 'system' root folder
      const fileName = `system/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

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
      console.error('Error uploading system asset:', error);
      return null;
    }
  },

  async uploadGeneratedAsset(base64Data: string, businessId: string): Promise<string | null> {
    try {
      // 1. Convert Base64 to Blob
      const base64Response = await fetch(base64Data);
      const blob = await base64Response.blob();

      // 2. Generate Filename
      const fileName = `${businessId}/generated/${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

      // 3. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // 4. Get Public URL
      const { data } = supabase.storage
        .from('business-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading generated asset:', error);
      return null;
    }
  },

  async migrateBase64Assets(businessId: string): Promise<number> {
    console.log(`[Migration] Starting migration for business: ${businessId}`);

    let migratedCount = 0;
    let hasMore = true;
    const BATCH_SIZE = 5; // Process in small batches to avoid memory/timeout issues
    let offset = 0;

    while (hasMore) {
      // 1. Fetch batch of assets (ID and Content only)
      const { data: assets, error } = await supabase
        .from('assets')
        .select('id, content') // Only fetch what we need
        .eq('business_id', businessId)
        .order('created_at', { ascending: false }) // Fix: Prioritize newest assets (visible ones)
        .range(offset, offset + BATCH_SIZE - 1);

      if (error || !assets || assets.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Iterate and check for Base64
      for (const asset of assets) {
        if (asset.content && asset.content.startsWith('data:image')) {
          console.log(`[Migration] Migrating asset ${asset.id}...`);
          try {
            // 3. Upload to Storage
            const publicUrl = await StorageService.uploadGeneratedAsset(asset.content, businessId);

            if (publicUrl) {
              // 4. Update DB
              const { error: updateError } = await supabase
                .from('assets')
                .update({ content: publicUrl })
                .eq('id', asset.id);

              if (!updateError) {
                migratedCount++;
                console.log(`[Migration] Success: ${asset.id}`);
              } else {
                console.error(`[Migration] DB Update Failed for ${asset.id}:`, updateError);
              }
            }
          } catch (err) {
            console.error(`[Migration] Failed to migrate ${asset.id}:`, err);
          }
        }
      }

      offset += BATCH_SIZE;
      // Safety break to prevent infinite loops if something goes wrong
      if (offset > 1000) hasMore = false;
    }

    console.log(`[Migration] Complete. Migrated ${migratedCount} assets.`);
    return migratedCount;
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
        created_at: asset.createdAt,
        style_id: asset.styleId,
        subject_id: asset.subjectId,
        model_tier: asset.modelTier
      });

    if (error) {
      console.error('Error saving asset:', error);
    }
  },

  getAssets: async (businessId: string, limit?: number, offset?: number): Promise<Asset[]> => {

    let query = supabase
      .from('assets')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Storage] Error fetching assets:', error);
      return [];
    }


    return data.map(row => ({
      id: row.id,
      type: row.type,
      content: row.content,
      prompt: row.prompt,
      createdAt: row.created_at,
      stylePreset: row.style_preset,
      aspectRatio: row.aspect_ratio, // Load ratio
      styleId: row.style_id,
      subjectId: row.subject_id,
      modelTier: row.model_tier
    }));
  },

  getRecentAssets: async (businessId: string, limit: number = 10): Promise<Asset[]> => {
    return StorageService.getAssets(businessId, limit);
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

  // Fetch tasks for the current user (RLS uses owner_id)
  // Optional businessId filter for when user wants to see tasks for a specific business
  getTasks: async (ownerId: string, businessId?: string): Promise<Task[]> => {
    let query = supabase
      .from('tasks')
      .select('*')
      .eq('owner_id', ownerId)
      .order('sort_order', { ascending: true });

    // Optional filter by business
    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Storage] Error fetching tasks:', error);
      return DEFAULT_TASKS;
    }

    if (!data || data.length === 0) {
      return DEFAULT_TASKS;
    }

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      category: row.category || undefined,
      labels: row.labels || [],
      subtasks: row.subtasks || [],
      sortOrder: row.sort_order ?? 0,
      attachments: row.attachments || [],
      techSpecs: row.tech_specs || undefined,
      businessId: row.business_id || undefined
    }));
  },

  saveTasks: async (tasks: Task[], ownerId: string): Promise<void> => {
    const payloads = tasks.map(t => ({
      id: t.id,
      owner_id: ownerId,
      business_id: t.businessId || null,
      title: t.title,
      description: t.description || null,
      status: t.status,
      priority: t.priority,
      due_date: t.dueDate || null,
      category: t.category || null,
      labels: t.labels || [],
      subtasks: t.subtasks || [],
      attachments: t.attachments || [],
      sort_order: t.sortOrder ?? 0,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('tasks').upsert(payloads, { onConflict: 'id' });
    if (error) console.error('Error saving tasks:', error);
  },

  saveTask: async (task: Task, ownerId: string): Promise<void> => {
    const payload = {
      id: task.id,
      owner_id: ownerId,
      business_id: task.businessId || null,
      title: task.title,
      description: task.description || null,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate || null,
      category: task.category || null,
      labels: task.labels || [],
      subtasks: task.subtasks || [],
      attachments: task.attachments || [],
      tech_specs: task.techSpecs || {},
      sort_order: task.sortOrder ?? 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('tasks').upsert(payload, { onConflict: 'id' });
    if (error) console.error('Error saving task:', error);
  },

  deleteTask: async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
  },

  updateTaskOrder: async (taskUpdates: { id: string; sortOrder: number; status: string }[], ownerId: string): Promise<void> => {
    // Batch update for drag-drop reordering (RLS handles owner validation)
    const updates = taskUpdates.map(t =>
      supabase.from('tasks')
        .update({ sort_order: t.sortOrder, status: t.status, updated_at: new Date().toISOString() })
        .eq('id', t.id)
    );

    await Promise.all(updates);
  },

  getAdminNotes: async (): Promise<AdminNote[]> => {
    const { data, error } = await supabase.from('admin_notes').select('*');
    if (error) return [];
    return data.map((row: any) => ({
      id: row.id,
      content: row.content,
      category: row.category,
      // Map legacy boolean if status is missing, otherwise use status
      status: row.status || (row.is_done ? 'done' : 'todo'),
      priority: row.priority || 'medium',
      createdAt: row.created_at,
      links: row.links || [],
      tags: row.tags || []
    }));
  },

  saveAdminNotes: async (notes: AdminNote[]): Promise<void> => {
    const payloads = notes.map(n => ({
      id: n.id,
      content: n.content,
      category: n.category,
      status: n.status,
      priority: n.priority,
      links: n.links || [],
      tags: n.tags || [],
      // Keep legacy field synced for safety if needed, or just ignore it. 
      // Let's sync it for now to be safe if rollback occurs.
      is_done: n.status === 'done',
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

  deletePreset: async (id: string): Promise<{ error: any }> => {
    const { error } = await supabase.from('presets').delete().eq('id', id);
    if (error) console.error('Error deleting preset:', error);
    return { error };
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

    return data.map((row: any) => {
      // BACKWARD COMPATIBILITY:
      // If reference_images_json exists, use it.
      // If not, fall back to reference_images (text[]) and map to structure.
      let rawRefs = row.reference_images_json;
      let refs: any[] = [];

      if (Array.isArray(rawRefs) && rawRefs.length > 0) {
        // Normalize: Ensure everything is an object with url and isActive
        refs = rawRefs.map((r: any) => {
          if (typeof r === 'string') {
            return { id: r, url: r, isActive: true };
          }
          return {
            id: r.id || r.url,
            url: r.url || r,
            isActive: r.isActive !== false
          };
        });
      } else if (Array.isArray(row.reference_images) && row.reference_images.length > 0) {
        // Fallback to legacy text[] column
        refs = row.reference_images.map((url: string) => ({
          id: url,
          url: url,
          isActive: true
        }));
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        imageUrl: row.image_url,
        promptModifier: row.prompt_modifier,
        config: row.config, // V2 God-Tier config
        referenceImages: refs,
        styleCues: row.style_cues,
        avoid: row.avoid
      };
    });
  },

  saveStyle: async (style: StylePreset & { sortOrder?: number, isActive?: boolean }): Promise<{ error: any }> => {
    const payload = {
      id: style.id,
      name: style.name,
      description: style.description,
      image_url: style.imageUrl,
      prompt_modifier: style.promptModifier,
      sort_order: style.sortOrder,
      is_active: style.isActive,
      config: style.config, // V2 God-Tier config
      reference_images_json: style.referenceImages, // <--- Save to JSONB
      // We also save to the old column for safety if needed, or just leave it.
      // Let's sync the old column with just URLs for other systems that might read it.
      reference_images: style.referenceImages?.map(r => r.url) || [],
      style_cues: style.styleCues,
      avoid: style.avoid
    };
    const { error } = await supabase.from('styles').upsert(payload);
    if (error) console.error('Error saving style:', error);
    return { error };
  },

  deleteStyle: async (id: string): Promise<{ error: any }> => {
    const { error } = await supabase.from('styles').delete().eq('id', id);
    if (error) console.error('Error deleting style:', error);
    return { error };
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
  },

  getGenerationLogs: async (): Promise<any[]> => {
    const { data, error } = await supabase
      .from('generation_logs')
      .select('*, businesses(name)') // Join with businesses to get name
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return data || [];
  }
};
