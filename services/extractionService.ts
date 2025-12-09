/**
 * Extraction Service
 * Client-side wrapper for the /api/extract-website endpoint
 * Uses Firecrawl v2.7.0 + DeepSeek V3.2 for intelligent website extraction
 */

import { Business, Offering } from '../types';

// Extraction result types
export interface ExtractedBusinessData {
    name?: string;
    industry?: string;
    type?: 'Retail' | 'E-Commerce' | 'Service' | 'Other';
    description?: string;
    slogan?: string;
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
        operatingMode?: 'storefront' | 'online' | 'service' | 'appointment';
        socials?: { platform: string; handle: string }[];
        website?: string;
    };
    voice?: {
        archetypeInferred?: string;
        tonePillsInferred?: string[];
        keywords?: string[];
    };
    usps?: string[];
    offerings?: {
        name: string;
        description?: string;
        price?: string;
        category?: string;
    }[];
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
 * @param url - The website URL to extract data from
 * @param mode - 'single' for one page, 'full' for multi-page crawl
 * @param onProgress - Callback for progress updates
 * @returns Extraction result with business data
 */
export async function extractWebsite(
    url: string,
    mode: 'single' | 'full' = 'single',
    onProgress?: (state: ExtractionState) => void
): Promise<ExtractionResult> {
    // Validate URL
    onProgress?.({ progress: 'validating', message: 'Validating URL...' });

    // Normalize URL first (add https:// if missing)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
    }

    // Now validate the normalized URL
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
        : 'Crawling your website...';
    onProgress?.({ progress: 'crawling', message: crawlMessage });

    try {
        // Use port 3000 for local dev (Express server), relative path for production
        const apiUrl = import.meta.env.DEV
            ? 'http://localhost:3000/api/extract-website'
            : '/api/extract-website';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: normalizedUrl, mode }),
        });

        // Update progress to analyzing (we don't have real server-side progress, so we estimate)
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
    if (extracted.profile?.address && (operatingMode === 'storefront' || operatingMode === 'appointment')) {
        contacts.push({
            id: 'extracted-address',
            type: 'address',
            value: extracted.profile.address,
            isPrimary: false,
            displayStyle: 'standard',
        });
    }

    return {
        name: extracted.name || '',
        type: selectedType || extracted.type || 'Other',
        industry: extracted.industry || '',
        description: extracted.description || '',
        website: extracted.profile?.website || '',
        logoUrl: extracted.logoUrl || '',
        colors: {
            primary: extracted.colors?.primary || '#000000',
            secondary: extracted.colors?.secondary || '#ffffff',
            accent: extracted.colors?.accent || '#a855f7',
        },
        voice: {
            sliders: { identity: 50, style: 50, emotion: 50 },
            archetype: mapArchetype(extracted.voice?.archetypeInferred),
            tonePills: extracted.voice?.tonePillsInferred || [],
            keywords: extracted.voice?.keywords || [],
            slogan: extracted.slogan || '',
            negativeKeywords: [],
        },
        profile: {
            contactEmail: extracted.profile?.contactEmail || '',
            contactPhone: extracted.profile?.contactPhone || '',
            address: extracted.profile?.address || '',
            publicLocationLabel: extracted.profile?.publicLocationLabel || '',
            operatingMode: operatingMode,
            socials: extracted.profile?.socials || [],
            hours: [],
            contacts: contacts,
        },
        adPreferences: {
            targetAudience: (extracted as any).targetAudience || '',
            goals: '',
            complianceText: '',
            preferredCta: '',
            sloganUsage: 'Sometimes',
            contactIds: contacts.map(c => c.id),
            locationDisplay: locationDisplay as any,
            hoursDisplay: 'hidden',
            holidayMode: { isActive: false, name: '', hours: '' },
            targetLanguage: (extracted as any).targetLanguage || 'English',
        },
        usps: extracted.usps || [],
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
