import type { BillingPlan } from './types';

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    buttonText: 'Current Plan',
    features: [
      { text: 'Up to 5 projects', included: true },
      { text: 'Basic map styles', included: true },
      { text: 'Export quality up to 50%', included: true },
      { text: 'Community support', included: true },
      { text: 'Advanced legends', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'explorer',
    name: 'Explorer',
    price: 10,
    period: 'month',
    description: 'For professionals and teams',
    buttonText: 'Upgrade to Explorer',
    popular: true,
    features: [
      { text: 'Unlimited projects', included: true },
      { text: 'All map styles', included: true },
      { text: 'Full export quality (PNG, SVG, JPEG)', included: true },
      { text: 'Email support', included: true },
      { text: 'Advanced legends', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'atlas',
    name: 'Atlas',
    price: 20,
    period: 'month',
    description: 'For power users',
    buttonText: 'Upgrade to Atlas',
    features: [
      { text: 'Everything in Explorer', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
    ],
  },
];
