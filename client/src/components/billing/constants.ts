import type { BillingPlan } from './types';

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'lifetime',
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
    price: 59,
    period: 'lifetime',
    description: 'For professionals and teams. One-time payment, lifetime access.',
    buttonText: 'Buy Explorer (Lifetime)',
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
    price: 159,
    period: 'lifetime',
    description: 'For power users. One-time payment, lifetime access.',
    buttonText: 'Buy Atlas (Lifetime)',
    popular: true,
    features: [
      { text: 'Everything in Explorer', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
    ],
  },
];
