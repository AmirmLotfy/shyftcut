// Polar.sh Product Configuration
// Single paid plan (Premium): monthly and yearly.
// Product IDs and price IDs from Polar (Shyftcut Premium / Shyftcut Premium Annual).
// Create Checkout Session API expects products: [ productId ]; priceId is for display/billing.

export const POLAR_PRODUCTS = {
  premium: {
    id: 'premium',
    name: 'Premium',
    monthly: {
      productId: 'fb08648d-d92f-4fc9-bb76-f43df88991b4',
      priceId: '0807f6a7-b546-457e-99d1-fb4d008b5154',
      price: 6.99,
      interval: 'month' as const,
    },
    yearly: {
      productId: '21d9e315-f385-4c89-b58b-a74985db817b',
      priceId: 'f7a4f270-4641-4e89-839c-2c4265cfbfc3',
      price: 59,
      interval: 'year' as const,
    },
  },
} as const;

export type PolarPlanId = keyof typeof POLAR_PRODUCTS;
export type BillingInterval = 'month' | 'year';
