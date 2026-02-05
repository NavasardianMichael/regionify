import type { FC } from 'react';
import { CheckOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

type PlanFeature = {
  text: string;
  included: boolean;
};

type BillingPlan = {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  buttonText: string;
};

const BILLING_PLANS: BillingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    buttonText: 'Current Plan',
    features: [
      { text: '5 maps per month', included: true },
      { text: 'Basic map styles', included: true },
      { text: 'Standard export (PNG)', included: true },
      { text: 'Community support', included: true },
      { text: 'Watermark on exports', included: true },
      { text: 'Advanced legends', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    period: 'month',
    description: 'For professionals and teams',
    buttonText: 'Upgrade to Pro',
    popular: true,
    features: [
      { text: 'Unlimited maps', included: true },
      { text: 'All map styles', included: true },
      { text: 'HD export (PNG, SVG, PDF)', included: true },
      { text: 'Email support', included: true },
      { text: 'No watermark', included: true },
      { text: 'Advanced legends', included: true },
      { text: 'Priority support', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29,
    period: 'month',
    description: 'For organizations with advanced needs',
    buttonText: 'Contact Sales',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Custom map styles', included: true },
      { text: 'API access', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

const PlanCard: FC<{ plan: BillingPlan }> = ({ plan }) => {
  const isFreePlan = plan.id === 'free';

  return (
    <Card className={`relative h-full shadow-sm ${plan.popular ? 'border-primary border-2' : ''}`}>
      {plan.popular && (
        <div className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white">
          Most Popular
        </div>
      )}

      <div className="mb-4 text-center">
        <Typography.Title level={3} className="text-primary mb-1 text-xl font-bold">
          {plan.name}
        </Typography.Title>
        <Typography.Paragraph className="mb-4 text-gray-500">
          {plan.description}
        </Typography.Paragraph>

        <div className="mb-4">
          <span className="text-primary text-4xl font-bold">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && <span className="text-gray-500">/{plan.period}</span>}
        </div>
      </div>

      <ul className="mb-6 space-y-3">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <CheckOutlined className={feature.included ? 'text-green-500' : 'text-gray-300'} />
            <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <Button type={plan.popular ? 'primary' : 'default'} block size="large" disabled={isFreePlan}>
        {plan.buttonText}
      </Button>
    </Card>
  );
};

const BillingPage: FC = () => {
  return (
    <div className="mx-auto max-w-256">
      <div className="mb-8 text-center">
        <Typography.Title level={1} className="text-primary text-3xl font-bold">
          Choose Your Plan
        </Typography.Title>
        <Typography.Paragraph className="mt-2 text-gray-500">
          Select the perfect plan for your mapping needs
        </Typography.Paragraph>
      </div>

      <Flex gap="large" justify="center" wrap="wrap">
        {BILLING_PLANS.map((plan) => (
          <div key={plan.id} className="w-80 flex-none">
            <PlanCard plan={plan} />
          </div>
        ))}
      </Flex>

      <div className="mt-8 text-center">
        <Typography.Text className="text-gray-500">
          All plans include a 14-day money-back guarantee. No questions asked.
        </Typography.Text>
      </div>
    </div>
  );
};

export default BillingPage;
