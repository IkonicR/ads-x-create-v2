/**
 * Ads x Create — Pricing Configuration V7 (The Abundance Model)
 * Strategy: "High Limits + Smart Scaling"
 * Model: gemini-3-pro-image-preview (~$0.134/img cost)
 * Currency: x100 Inflation
 */

export const CURRENCIES = {
    USD: { symbol: '$', rate: 1, locale: 'en-US' },
    ZAR: { symbol: 'R', rate: 18, locale: 'en-ZA' },
    EUR: { symbol: '€', rate: 0.92, locale: 'de-DE' },
    GBP: { symbol: '£', rate: 0.79, locale: 'en-GB' },
    AUD: { symbol: 'A$', rate: 1.55, locale: 'en-AU' },
    INR: { symbol: '₹', rate: 83, locale: 'en-IN' },
    BRL: { symbol: 'R$', rate: 4.9, locale: 'pt-BR' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

// ------------------------------------------------------------------
// CREDIT LOGIC: x100 INFLATION
// ------------------------------------------------------------------
export const CREDITS = {
    // CONSUMPTION
    costStandard: 100,   // 1 Image ($0.13 cost)
    costUltra: 200,      // 4K Upscale ($0.24 cost)

    // FUTURE PROOFING (When we add Flux.2)
    costFlux: 30,        // Flux is cheaper, allows "Draft Mode" later

    costEdit: 50,        // In-painting ($0.06 cost)
    costChat: 0,         // Free retention hook

    // RETENTION
    rolloverMonths: 1,   // Unused credits roll over (Fairness)
    rolloverCap: 2,      // Max bank = 2x monthly allowance

    // SALES LOGIC
    extraCreditPrice: 0.005,
};

export const PLANS = {
    creator: {
        id: 'creator',
        name: 'Solo',
        description: 'For solopreneurs building a personal brand',
        monthlyPrice: 39,
        annualPrice: 390, // 2 Months Free
        features: {
            businesses: 1,
            maxBusinesses: 1, // Locked. Must upgrade.

            // 10,000 Credits = 100 Standard Images
            // Margin: 66% (Safe)
            creditsPerMonth: 10000,

            // HOOK: Lite Scheduling (15 posts = ~Every other day)
            socialScheduling: true,
            socialSchedulingLimit: 15,

            extraBusinessPrice: null,
            extraBusinessCredits: null,

            customStyles: false,
            teamSeats: 0,
            whiteLabel: false,
            prioritySupport: false,
            dedicatedManager: false,
        },
    },
    growth: {
        id: 'growth',
        name: 'Business',
        badge: 'Most Popular',
        description: 'For growing brands requiring consistency',
        monthlyPrice: 97,
        annualPrice: 970,
        features: {
            businesses: 1,
            maxBusinesses: 10,

            // 30,000 Credits = 300 Images
            // Margin: 58% (Volume play)
            creditsPerMonth: 30000,

            // SMART SCALING:
            // Pay $29 -> Get +50 Images (5,000 credits)
            // Profit on add-on: ~$22.30 (77% Margin)
            extraBusinessPrice: 29,
            extraBusinessCredits: 5000,

            // UNLIMITED SCHEDULING
            socialScheduling: true,
            socialSchedulingLimit: -1,

            customStyles: true, // "God-Tier" Presets
            teamSeats: 5,
            whiteLabel: false,
            prioritySupport: true,
            dedicatedManager: false,
        },
    },
    agency: {
        id: 'agency',
        name: 'Partner',
        description: 'For agencies and multi-brand organizations',
        monthlyPrice: 297,
        annualPrice: 2970,
        features: {
            businesses: 10, // 10 Included!
            maxBusinesses: 100,

            // 100,000 Credits = 1,000 Images (Global Pool)
            // Margin: 55% (Worst case) -> ~80% (Realized)
            creditsPerMonth: 100000,
            isGlobalPool: true,

            // VOLUME SCALING:
            // Pay $19 -> Get 0 Extra Credits (Share the massive pool)
            // Profit: 100%
            extraBusinessPrice: 19,
            extraBusinessCredits: 0,

            socialScheduling: true,
            socialSchedulingLimit: -1,

            customStyles: true,
            teamSeats: -1, // Unlimited
            whiteLabel: true, // Your logo, not ours
            prioritySupport: true,
            dedicatedManager: true,
        },
    },
    beta: {
        id: 'beta',
        name: 'Beta',
        description: 'Early access testing',
        monthlyPrice: 0,
        annualPrice: 0,
        features: {
            businesses: 3,
            maxBusinesses: 3, // Hard cap for beta testers
            creditsPerMonth: 5000, // 50 Images
            extraBusinessPrice: null,
            extraBusinessCredits: null,
            socialScheduling: true,
            socialSchedulingLimit: -1,
            customStyles: true,
            teamSeats: 5,
            whiteLabel: false,
            prioritySupport: true,
            dedicatedManager: false,
        },
    },
} as const;

export type PlanId = keyof typeof PLANS;

// CREDIT PACKS
// Strategy: "Fair Backup"
export const CREDIT_PACKS = [
    { credits: 3000, price: 15, label: 'Starter (30 Imgs)' },     // $0.50 / img
    { credits: 12000, price: 49, label: 'Creator (120 Imgs)' },   // $0.40 / img
    { credits: 60000, price: 199, label: 'Agency (600 Imgs)' },   // $0.33 / img
];

// Helper: Convert price to currency
export function formatPrice(usdPrice: number, currency: CurrencyCode = 'USD'): string {
    const { symbol, rate, locale } = CURRENCIES[currency];
    const converted = Math.round(usdPrice * rate);
    const rounded = currency === 'USD' ? converted : Math.ceil(converted / 10) * 10;

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(rounded);
}

// Helper: Calculate Plan Price
export function calculatePlanPrice(
    planId: PlanId,
    extraBusinesses: number = 0,
    currency: CurrencyCode = 'USD'
): { monthly: string; annual: string; monthlyRaw: number } {
    const plan = PLANS[planId];
    const extraPrice = plan.features.extraBusinessPrice || 0;
    const monthlyRaw = plan.monthlyPrice + (extraBusinesses * extraPrice);
    const annualRaw = monthlyRaw * 10;

    return {
        monthly: formatPrice(monthlyRaw, currency),
        annual: formatPrice(annualRaw, currency),
        monthlyRaw,
    };
}

export function getCurrencyFromCountry(countryCode: string): CurrencyCode {
    const countryToCurrency: Record<string, CurrencyCode> = {
        US: 'USD', ZA: 'ZAR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
        GB: 'GBP', AU: 'AUD', IN: 'INR', BR: 'BRL',
    };
    return countryToCurrency[countryCode] || 'USD';
}
