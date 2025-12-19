/**
 * Extraction Service
 * Client-side wrapper for the /api/extract-website endpoint
 * Uses Firecrawl v2.7.0 + Gemini via Vercel Gateway for intelligent website extraction
 */

import { Business, Offering } from '../types';

// Extraction result types
export interface ExtractedBusinessData {
    name?: string;
    industry?: string;
    type?: 'Retail' | 'E-Commerce' | 'Service' | 'Other';
    description?: string;
    slogan?: string;

    // Brand Kit moved/expanded here
    brandKit?: {
        colors?: {
            primary?: string;
            secondary?: string;
            accent?: string;
        };
        typography?: {
            headings?: string;
            body?: string;
        };
        visualMotifs?: string[];
    };

    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
    };
    logoUrl?: string;

    profile?: {
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        publicLocationLabel?: string;
        hours?: Record<string, string>; // New
        timezone?: string; // New
        bookingUrl?: string; // New
        operatingMode?: 'storefront' | 'online' | 'service' | 'appointment';
        socials?: { platform: string; handle: string }[];
        website?: string;
    };

    voice?: {
        archetypeInferred?: string;
        tonePillsInferred?: string[];
        keywords?: string[];
    };

    strategy?: { // New
        coreCustomerProfile?: {
            demographics?: string;
            psychographics?: string;
            painPoints?: string[];
            desires?: string[];
        };
        competitors?: string[];
    };

    content?: { // New
        teamMembers?: { name: string; role: string; imageUrl?: string }[];
        locations?: { name: string; address: string; imageUrl?: string }[];
        testimonials?: { text: string; author: string }[];
    };

    usps?: string[];
    offerings?: {
        name: string;
        description?: string;
        price?: string;
        category?: string;
    }[];

    targetAudience?: string;
    targetLanguage?: string;
}

export interface ExtractionResult {
    success: boolean;
    data?: ExtractedBusinessData;
    confidence?: Record<string, number>;
    error?: string;
}

// Progress states for UI
export type ExtractionProgress =
    | 'idle'
    | 'validating'
    | 'crawling'
    | 'analyzing'
    | 'complete'
    | 'error';


export interface ExtractionState {
    progress: ExtractionProgress;
    message: string;
    result?: ExtractionResult;
    error?: string;
}

// Page discovery types
export interface DiscoveredPage {
    id: string;
    url: string;
    title: string;
}

/**
 * Discover pages on a website for user selection
 */
export async function discoverPages(url: string): Promise<{ success: boolean; pages?: DiscoveredPage[]; error?: string }> {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }

    const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3000/api/discover-pages'
        : '/api/discover-pages';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: normalizedUrl }),
        });

        if (!response.ok) {
            return { success: false, error: 'Failed to discover pages' };
        }

        const result = await response.json();
        return { success: true, pages: result.pages || [] };
    } catch (error) {
        return { success: false, error: 'Page discovery failed' };
    }
}

/**
 * Extract business data from a website URL
 * @param urlOrUrls - Single URL string or array of URLs for selective extraction
 * @param mode - 'single' for one page, 'full' for multi-page crawl, 'select' for batch URLs
 * @param onProgress - Callback for progress updates
 * @returns Extraction result with business data
 */
export async function extractWebsite(
    urlOrUrls: string | string[],
    mode: 'single' | 'full' | 'select' = 'single',
    onProgress?: (state: ExtractionState) => void
): Promise<ExtractionResult> {
    // Validate URL(s)
    onProgress?.({ progress: 'validating', message: 'Validating URL...' });

    // Normalize URL(s)
    const isArray = Array.isArray(urlOrUrls);
    const normalizedUrls = isArray
        ? urlOrUrls.map(u => {
            const trimmed = u.trim();
            return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
        })
        : undefined;

    const normalizedUrl = isArray
        ? normalizedUrls![0]
        : urlOrUrls.trim().startsWith('http://') || urlOrUrls.trim().startsWith('https://')
            ? urlOrUrls.trim()
            : `https://${urlOrUrls.trim()}`;

    // Validate the primary URL
    try {
        new URL(normalizedUrl);
    } catch {
        const error = 'Please enter a valid website URL';
        onProgress?.({ progress: 'error', message: error, error });
        return { success: false, error };
    }

    // Start extraction
    const crawlMessage = mode === 'single'
        ? 'Reading this page...'
        : mode === 'select'
            ? `Scraping ${normalizedUrls?.length || 1} pages...`
            : 'Crawling your website...';
    onProgress?.({ progress: 'crawling', message: crawlMessage });

    try {
        // Use port 3000 for local dev (Express server), relative path for production
        const apiUrl = import.meta.env.DEV
            ? 'http://localhost:3000/api/extract-website'
            : '/api/extract-website';

        // Build request body based on mode
        const requestBody: { url?: string; urls?: string[]; mode: string } = { mode };

        if (mode === 'select' && normalizedUrls) {
            requestBody.urls = normalizedUrls;
        } else {
            requestBody.url = normalizedUrl;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        // Update progress to analyzing
        onProgress?.({ progress: 'analyzing', message: 'Extracting brand identity...' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const errorMessage = errorData.error || 'Failed to extract website data';
            onProgress?.({ progress: 'error', message: errorMessage, error: errorMessage });
            return { success: false, error: errorMessage };
        }

        const result: ExtractionResult = await response.json();

        if (result.success && result.data) {
            onProgress?.({
                progress: 'complete',
                message: 'Extraction complete!',
                result
            });
        } else {
            const errorMessage = result.error || 'No data extracted';
            onProgress?.({ progress: 'error', message: errorMessage, error: errorMessage });
        }

        return result;

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network error';
        onProgress?.({ progress: 'error', message: errorMessage, error: errorMessage });
        return { success: false, error: errorMessage };
    }
}

/**
 * Convert extracted data to a partial Business object
 * for use in the onboarding flow
 */
export function extractedDataToBusiness(
    extracted: ExtractedBusinessData,
    selectedType?: Business['type']
): Partial<Business> {
    const operatingMode = extracted.profile?.operatingMode || 'storefront';

    // Smart location display based on operating mode
    const locationDisplay = operatingMode === 'online'
        ? 'online_only'
        : operatingMode === 'service'
            ? 'hidden' // Service goes to customer, no fixed location
            : 'city_state'; // storefront/appointment show location

    // Create ContactMethod entries from extracted data
    const contacts: any[] = [];
    if (extracted.profile?.contactEmail) {
        contacts.push({
            id: 'extracted-email',
            type: 'email',
            value: extracted.profile.contactEmail,
            isPrimary: true,
            displayStyle: 'standard',
        });
    }
    if (extracted.profile?.contactPhone) {
        contacts.push({
            id: 'extracted-phone',
            type: 'phone',
            value: extracted.profile.contactPhone,
            isPrimary: contacts.length === 0,
            displayStyle: 'standard',
        });
    }

    // Map Competitors (String[] -> Object[])
    const competitors = (extracted.strategy?.competitors || []).map(comp => ({
        name: comp,
        website: ''
    }));

    // Map Visual Motifs (String[] -> Object[]) - Default to hidden so user can enable
    const visualMotifs = (extracted.brandKit?.visualMotifs || []).map((motif, index) => ({
        id: `extracted-motif-${index}`,
        name: motif,
        prominence: 'hidden' as const
    }));

    // Map Team Members
    const teamMembers = (extracted.content?.teamMembers || []).map((member, index) => ({
        id: `extracted-team-${index}`,
        name: member.name,
        role: member.role,
        imageUrl: member.imageUrl || ''
    }));

    // Map Business Images (empty array - extraction doesn't provide these)
    const businessImages: any[] = [];

    // Format Hours Text
    let hoursText = '';
    if (extracted.profile?.hours) {
        hoursText = Object.entries(extracted.profile.hours)
            .map(([days, time]) => `${days}: ${time}`)
            .join(' | ');
    }

    return {
        name: extracted.name || '',
        type: selectedType || extracted.type || 'Other',
        industry: extracted.industry || '',
        description: extracted.description || '',
        website: extracted.profile?.website || '',
        logoUrl: extracted.logoUrl || '',

        // Brand Kit
        colors: {
            primary: extracted.brandKit?.colors?.primary || extracted.colors?.primary || '#000000',
            secondary: extracted.brandKit?.colors?.secondary || extracted.colors?.secondary || '#ffffff',
            accent: extracted.brandKit?.colors?.accent || extracted.colors?.accent || '#a855f7',
        },
        typography: {
            headingFont: extracted.brandKit?.typography?.headings || 'Inter',
            bodyFont: extracted.brandKit?.typography?.body || 'Inter',
            scale: 'medium'
        },
        visualMotifs: visualMotifs,

        voice: {
            sliders: { identity: 50, style: 50, emotion: 50 },
            archetype: mapArchetype(extracted.voice?.archetypeInferred),
            tonePills: sanitizeTonePills(extracted.voice?.tonePillsInferred || []),
            keywords: extracted.voice?.keywords || [],
            slogan: extracted.slogan || '',
            negativeKeywords: [],
        },

        // Strategy
        coreCustomerProfile: {
            demographics: extracted.strategy?.coreCustomerProfile?.demographics || '',
            psychographics: extracted.strategy?.coreCustomerProfile?.psychographics || '',
            painPoints: extracted.strategy?.coreCustomerProfile?.painPoints || [],
            desires: extracted.strategy?.coreCustomerProfile?.desires || []
        },
        competitors: competitors,

        profile: {
            contactEmail: extracted.profile?.contactEmail || '',
            contactPhone: extracted.profile?.contactPhone || '',
            address: extracted.profile?.address || '',
            publicLocationLabel: extracted.profile?.publicLocationLabel || '',
            operatingMode: operatingMode,
            socials: extracted.profile?.socials || [],
            hours: [], // TODO: Parse logic or rely on hoursText
            contacts: contacts,
            timezone: extracted.profile?.timezone,
            bookingUrl: extracted.profile?.bookingUrl,
        },

        adPreferences: {
            targetAudience: (extracted as any).targetAudience || '',
            goals: '',
            complianceText: '',
            preferredCta: '',
            sloganProminence: 'standard',
            businessNameProminence: 'standard',
            contactProminence: 'standard',
            locationProminence: 'standard',
            hoursProminence: 'standard',
            contactIds: contacts.map(c => c.id),
            locationDisplay: locationDisplay as any,
            hoursDisplay: hoursText ? 'custom_text' : 'hidden',
            hoursText: hoursText,
            holidayMode: { isActive: false, name: '', hours: '' },
            targetLanguage: (extracted as any).targetLanguage || 'English',
        },

        usps: extracted.usps || [],

        // Content
        teamMembers: teamMembers,
        businessImages: businessImages,
        testimonials: (extracted.content?.testimonials || []).map((t, i) => ({
            id: `extracted-test-${i}`,
            author: t.author,
            quote: t.text
        }))
    };
}

/**
 * Convert extracted offerings to Offering objects
 */
export function extractedDataToOfferings(
    extracted: ExtractedBusinessData
): Partial<Offering>[] {
    if (!extracted.offerings) return [];

    return extracted.offerings.map((item, index) => ({
        id: `extracted-${index}`,
        name: item.name,
        description: item.description || '',
        price: item.price || '',
        category: item.category || 'Products',
        active: true,
    }));
}

/**
 * Map AI-inferred archetype string to our BrandArchetype type
 */
function mapArchetype(archetypeString?: string): Business['voice']['archetype'] {
    if (!archetypeString) return 'Unset';

    const archetypes: Business['voice']['archetype'][] = [
        'The Innocent', 'The Explorer', 'The Sage', 'The Hero',
        'The Outlaw', 'The Magician', 'The Guy/Girl Next Door', 'The Lover',
        'The Jester', 'The Caregiver', 'The Creator', 'The Ruler'
    ];

    const found = archetypes.find(a =>
        archetypeString.toLowerCase().includes(a.toLowerCase().replace('The ', ''))
    );

    return found || 'Unset';
}

/**
 * Valid tone pills - must match BrandKit.tsx exactly
 */
const VALID_TONE_PILLS = [
    // Style
    'Bold', 'Premium', 'Minimal', 'Playful', 'Modern', 'Classic', 'Elegant', 'Timeless', 'Sophisticated', 'Luxurious', 'Refined', 'Curated',
    // Tone
    'Professional', 'Creative', 'Energetic', 'Witty', 'Urgent', 'Calm', 'Warm', 'Approachable', 'Sincere', 'Trustworthy',
    // Relation
    'Friendly', 'Exclusive', 'Rebellious', 'Community Focused', 'Authoritative', 'Supportive', 'Personable', 'Welcoming',
    // Intellect
    'Educational', 'Insightful', 'Analytical', 'Geeky', 'Direct', 'Informative', 'Expert'
];

/**
 * Sanitize and normalize tone pills from extraction
 * - Removes emojis
 * - Matches against valid list (case-insensitive)
 * - Limits to 4 max
 */
function sanitizeTonePills(extracted: string[]): string[] {
    if (!extracted || !Array.isArray(extracted)) return [];

    // Regex to strip all emoji characters
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu;

    const normalized = extracted
        .map(pill => {
            // Strip emojis and trim whitespace
            const cleaned = pill.replace(emojiRegex, '').trim();
            // Find case-insensitive match in valid list
            return VALID_TONE_PILLS.find(valid =>
                valid.toLowerCase() === cleaned.toLowerCase()
            );
        })
        .filter((pill): pill is string => pill !== undefined)
        .slice(0, 4); // Enforce max 4

    return normalized;
}
