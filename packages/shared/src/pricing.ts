import { CurrencyCode, PlanId, PricingPlan } from './types';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'SINGLE_PASS',
    name: 'Single Download Pass',
    description: 'Perfect for one special celebration at home.',
    priceInr: 49,
    priceUsd: 3.0,
    billingCycle: 'one_time',
    exportQuota: 1,
    features: [
      '1 Ultra-Crisp 4K Video or HD 1-Page Card Download',
      'Includes 30 Artisan 3D scenes, 24 Signature Cards, Wax Seal & Gardens',
      'Zero watermark + Save to Photos & Share ready',
      'Free typo fixes & re-downloads for 7 days',
    ],
  },
  {
    id: 'MONTHLY_CREATOR',
    name: 'Monthly Creator',
    badge: 'POPULAR',
    description: 'For families hosting multiple ceremonies & parties.',
    priceInr: 199,
    priceUsd: 9.99,
    billingCycle: 'monthly',
    exportQuota: 9,
    features: [
      '9 Monthly Downloads across 3D Videos & HD Invitation Cards',
      'Unlocks Wax-Seal Envelopes, Estate Gardens & 3D Atmosphere',
      'All 3D Templates, 24 Illustrated Cards, Photo Cutouts & 4K MP4',
      'Cancel anytime in one tap',
    ],
  },
  {
    id: 'YEARLY_ALL_ACCESS',
    name: 'Yearly All-Access',
    badge: 'BEST VALUE',
    description: 'Celebrate birthdays, weddings & festivals all year.',
    priceInr: 1999,
    priceUsd: 49.99,
    billingCycle: 'yearly',
    exportQuota: 120,
    features: [
      '120 Downloads per year across 3D Videos & HD Cards (10/mo)',
      'Unlocks Wax-Seal Envelopes, Gardens & 3D Atmosphere',
      'Every 3D template, 1-Page Card, Photo Cutout & seasonal drop',
      '4K Ultra-Crisp MP4 + PNG/JPG Card downloads',
    ],
  },
];

export function formatPlanPrice(plan: PricingPlan, currency: CurrencyCode): string {
  if (currency === 'INR') {
    const suffix =
      plan.billingCycle === 'monthly'
        ? '/mo'
        : plan.billingCycle === 'yearly'
          ? '/yr'
          : '';
    return `₹${plan.priceInr}${suffix}`;
  }
  const suffix =
    plan.billingCycle === 'monthly'
      ? '/mo'
      : plan.billingCycle === 'yearly'
        ? '/yr'
        : '';
  return `$${plan.priceUsd.toFixed(2).replace(/\.00$/, '')}${suffix}`;
}

export function getPlanById(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((p) => p.id === id);
}

/** Resolves INR for visitors in India (Asia/Kolkata, -IN locale) and USD outside India. */
export function detectRegionalCurrency(): CurrencyCode {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions();
    const tz = (resolved.timeZone || '').toLowerCase();
    const loc = (resolved.locale || '').toLowerCase();
    if (tz === 'asia/kolkata' || tz === 'asia/calcutta' || loc.endsWith('-in')) {
      return 'INR';
    }
    if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().endsWith('-in')) {
      return 'INR';
    }
    return tz || loc ? 'USD' : 'INR';
  } catch {
    return 'INR';
  }
}
