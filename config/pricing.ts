/**
 * Ads x Create — Pricing Configuration
 * Source of Truth for all pricing plans
 * Last Updated: December 18, 2025
 */

// Supported currencies with conversion rates (approximate, update as needed)
export const CURRENCIES = {
    USD: { symbol: '$', rate: 1, locale: 'en-US' },
    ZAR: { symbol: 'R', rate: 18, locale: 'en-ZA' },    // South African Rand
    EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },  // Euro
    GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' },  // British Pound
    AUD: { symbol: 'A$', rate: 1.55, locale: 'en-AU' }, // Australian Dollar
    INR: { symbol: '₹', rate: 83, locale: 'en-IN' },    // Indian Rupee
    BRL: { symbol: 'R$', rate: 4.9, locale: 'pt-BR' },  // Brazilian Real
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// Credit system
export const CREDITS = {
    perImage2K: 1,
    perImage4K: 2,
    extraCreditPrice: 0.25, // USD
    rolloverMonths: 1,
    rolloverCap: 2, // 2x monthly limit
};

// Plan definitions (prices in USD)
export const PLANS = {
    creator: {
        id: 'creator',
        name: 'Creator',
        description: 'For solopreneurs and influencers',
        monthlyPrice: 39,
        annualPrice: 390, // 17% off
        features: {
            businesses: 1,
            creditsPerMonth: 40,
            extraBusinessPrice: null, // Cannot add extra
            extraBusinessCredits: null,
            socialScheduling: false,
            customStyles: false,
            teamSeats: 0,
            whiteLabel: false,
            earlyAccess: false,
            betaFeatures: false,
            prioritySupport: false,
            dedicatedManager: false,
        },
    },
    growth: {
        id: 'growth',
        name: 'Growth',
        description: 'For small businesses and power users',
        badge: 'Most Popular',
        monthlyPrice: 89,
        annualPrice: 890,
        features: {
            businesses: 1,
            maxBusinesses: 10,
            creditsPerMonth: 150,
            extraBusinessPrice: 29,
            extraBusinessCredits: 50,
            socialScheduling: true,
            customStyles: true,
            teamSeats: 3,
            whiteLabel: false,
            earlyAccess: true,
            betaFeatures: false,
            prioritySupport: true,
            dedicatedManager: false,
        },
    },
    agency: {
        id: 'agency',
        name: 'Agency',
        description: 'For marketing agencies',
        monthlyPrice: 299,
        annualPrice: 2990,
        features: {
            businesses: 10,
            maxBusinesses: 100,
            creditsPerMonth: 750, // Global pool
            isGlobalPool: true,
            extraBusinessPrice: 19,
            extraBusinessCredits: 0, // Pool doesn't grow
            socialScheduling: true,
            customStyles: true,
            teamSeats: -1, // Unlimited
            whiteLabel: true,
            earlyAccess: true,
            betaFeatures: true,
            prioritySupport: true,
            dedicatedManager: true,
        },
    },
} as const;

export type PlanId = keyof typeof PLANS;

// Credit packs for overage
export const CREDIT_PACKS = [
    { credits: 50, price: 15 },
    { credits: 100, price: 25 },
    { credits: 500, price: 100 },
];

// Helper: Convert price to currency
export function formatPrice(usdPrice: number, currency: CurrencyCode = 'USD'): string {
    const { symbol, rate, locale } = CURRENCIES[currency];
    const converted = Math.round(usdPrice * rate);

    // Round to nice numbers for non-USD
    const rounded = currency === 'USD' ? converted : Math.ceil(converted / 10) * 10;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(rounded);
}

// Helper: Get plan price with extra businesses
export function calculatePlanPrice(
    planId: PlanId,
    extraBusinesses: number = 0,
    currency: CurrencyCode = 'USD'
): { monthly: string; annual: string; monthlyRaw: number } {
    const plan = PLANS[planId];
    const extraPrice = plan.features.extraBusinessPrice || 0;
    const monthlyRaw = plan.monthlyPrice + (extraBusinesses * extraPrice);
    const annualRaw = monthlyRaw * 10; // 17% off (10 months for 12)

    return {
        monthly: formatPrice(monthlyRaw, currency),
        annual: formatPrice(annualRaw, currency),
        monthlyRaw,
    };
}

// Helper: Detect currency from country code
export function getCurrencyFromCountry(countryCode: string): CurrencyCode {
    const countryToCurrency: Record<string, CurrencyCode> = {
        US: 'USD',
        ZA: 'ZAR',
        DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
        GB: 'GBP',
        AU: 'AUD',
        IN: 'INR',
        BR: 'BRL',
    };
    return countryToCurrency[countryCode] || 'USD';
}
