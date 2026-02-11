import { PLAN_DETAILS, PLANS } from '@regionify/shared';
import type { BillingPlan } from './types';

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: PLANS.observer,
    name: 'Observer (free)',
    price: PLAN_DETAILS.observer.price,
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
    id: PLANS.explorer,
    name: 'Explorer',
    price: PLAN_DETAILS.explorer.price,
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
    id: PLANS.chronographer,
    name: 'Chronographer',
    price: PLAN_DETAILS.chronographer.price,
    period: 'lifetime',
    description: 'For power users. One-time payment, lifetime access.',
    buttonText: 'Buy Chronographer (Lifetime)',
    popular: true,
    features: [
      { text: 'Everything in Explorer', included: true },
      { text: 'Priority support', included: true },
      { text: 'Early access to new features', included: true },
    ],
  },
];
