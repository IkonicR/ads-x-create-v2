export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD', // United States -> Dollar
  GB: 'GBP', // United Kingdom -> Pound
  EU: 'EUR', // Eurozone (Generic)
  DE: 'EUR', // Germany
  FR: 'EUR', // France
  IT: 'EUR', // Italy
  ES: 'EUR', // Spain
  NL: 'EUR', // Netherlands
  IE: 'EUR', // Ireland
  JP: 'JPY', // Japan -> Yen
  CN: 'CNY', // China -> Yuan
  IN: 'INR', // India -> Rupee
  BR: 'BRL', // Brazil -> Real
  CA: 'CAD', // Canada -> Dollar
  AU: 'AUD', // Australia -> Dollar
  ZA: 'ZAR', // South Africa -> Rand
  MX: 'MXN', // Mexico -> Peso
  CH: 'CHF', // Switzerland -> Franc
  SE: 'SEK', // Sweden -> Krona
  NZ: 'NZD', // New Zealand -> Dollar
  KR: 'KRW', // South Korea -> Won
  SG: 'SGD', // Singapore -> Dollar
  HK: 'HKD', // Hong Kong -> Dollar
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  BRL: 'R$',
  CAD: '$',
  AUD: '$',
  ZAR: 'R',
  MXN: '$',
  CHF: 'Fr.',
  SEK: 'kr',
  NZD: '$',
  KRW: '₩',
  SGD: '$',
  HKD: '$',
};

export const getCurrencyFromCountryCode = (countryCode: string): string | null => {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] || null;
};

export const getSymbolFromCurrency = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || '$';
};
