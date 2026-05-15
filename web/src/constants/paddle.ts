export const plans = [
  {
    name: 'Pro',
    priceId: {
      month: 'pri_01kdmxvhvq1a2azqffahexqmyh',
      year: 'pri_01kdmy7ptmfd49wx8e9mvrpcd5',
    },
  },
] as const;

export const enterprisePriceIds = {
  monthly: 'pri_01kdmyhr3zypdbxtx9v7w9tjpx',
  yearly: 'pri_01kdmymyp32zs7vsm56a0kpwyv',
};

export type PlanName = (typeof plans)[number]['name'];
export type BillingCycle = 'month' | 'year';



