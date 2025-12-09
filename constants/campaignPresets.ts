import { GenerationStrategy, CampaignMode, SubjectType } from '../types';

// Default strategy state
export const DEFAULT_STRATEGY: GenerationStrategy = {
    mode: 'custom',
    productFraming: 'hero',
    showPrice: false,
    showPromo: false,
    strictLikeness: false,
    teamFraming: 'portrait',
    showNameRole: true,
    teamVibe: 'friendly',
    serviceFraming: 'in_action',
    locationFraming: 'exterior',
    copyStrategy: 'benefit',
    customCta: '',
    trustStack: {
        website: true,
        location: false,
        phone: false,
        hours: false,
    },
    selectedMotifIds: [],
    sloganPlacement: 'auto',
};

// Preset configurations per subject type
interface PresetConfig {
    product: Partial<GenerationStrategy>;
    team: Partial<GenerationStrategy>;
    none: Partial<GenerationStrategy>;
}

export const CAMPAIGN_PRESETS: Record<Exclude<CampaignMode, 'custom'>, {
    name: string;
    icon: string;
    description: string;
    config: PresetConfig;
}> = {
    flash_sale: {
        name: 'Flash Sale',
        icon: '⚡',
        description: 'Drive urgency and conversions',
        config: {
            product: {
                productFraming: 'hero',
                showPrice: true,
                showPromo: true,
                copyStrategy: 'urgent',
                customCta: 'Shop Now',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            team: {
                teamFraming: 'portrait',
                showNameRole: true,
                copyStrategy: 'urgent',
                customCta: 'Book Now',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            none: {
                copyStrategy: 'urgent',
                customCta: 'Shop Now',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
        },
    },
    awareness: {
        name: 'Brand Awareness',
        icon: '📢',
        description: 'Build recognition and vibe',
        config: {
            product: {
                productFraming: 'lifestyle',
                showPrice: false,
                showPromo: false,
                strictLikeness: false,
                copyStrategy: 'benefit',
                customCta: 'Learn More',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            team: {
                teamFraming: 'action',
                showNameRole: false,
                teamVibe: 'friendly',
                copyStrategy: 'benefit',
                customCta: 'Learn More',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            none: {
                copyStrategy: 'benefit',
                customCta: 'Learn More',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
        },
    },
    local: {
        name: 'Local Visit',
        icon: '📍',
        description: 'Drive foot traffic',
        config: {
            product: {
                productFraming: 'lifestyle',
                showPrice: false,
                copyStrategy: 'benefit',
                customCta: 'Visit Us',
                trustStack: { website: false, location: true, phone: true, hours: true },
            },
            team: {
                teamFraming: 'portrait',
                showNameRole: true,
                teamVibe: 'friendly',
                copyStrategy: 'benefit',
                customCta: 'Visit Us',
                trustStack: { website: false, location: true, phone: true, hours: true },
            },
            none: {
                copyStrategy: 'benefit',
                customCta: 'Visit Us',
                trustStack: { website: false, location: true, phone: true, hours: true },
            },
        },
    },
    educational: {
        name: 'Educational',
        icon: 'ℹ️',
        description: 'Build trust with value',
        config: {
            product: {
                productFraming: 'hero',
                showPrice: false,
                showPromo: false,
                copyStrategy: 'problem_solution',
                customCta: 'See How',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            team: {
                teamFraming: 'portrait',
                showNameRole: true,
                teamVibe: 'authority',
                copyStrategy: 'problem_solution',
                customCta: 'Learn More',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
            none: {
                copyStrategy: 'problem_solution',
                customCta: 'See How',
                trustStack: { website: true, location: false, phone: false, hours: false },
            },
        },
    },
};

// Helper to apply a preset
export function applyPreset(
    mode: Exclude<CampaignMode, 'custom'>,
    subjectType: SubjectType,
    currentStrategy: GenerationStrategy
): GenerationStrategy {
    const preset = CAMPAIGN_PRESETS[mode];
    const presetConfig = preset.config[subjectType];

    return {
        ...currentStrategy,
        ...presetConfig,
        mode,
    };
}
