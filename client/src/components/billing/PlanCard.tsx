import { type FC, useCallback, useMemo } from 'react';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { type Plan, PLANS } from '@regionify/shared';
import { Button, Card, Flex, Typography } from 'antd';
import type { BillingPlan, PayablePlan } from './types';

export type PlanCardProps = {
  plan: BillingPlan;
  currentPlan: Plan;
  onUpgrade: (plan: PayablePlan) => void;
  upgradingPlan: PayablePlan | null;
};

const PlanCard: FC<PlanCardProps> = ({ plan, currentPlan, onUpgrade, upgradingPlan }) => {
  const isCurrentPlan = plan.id === currentPlan;
  const isUpgrading = upgradingPlan === plan.id;

  const handleClick = useCallback(() => {
    if (plan.id === PLANS.explorer || plan.id === PLANS.chronographer) {
      onUpgrade(plan.id as PayablePlan);
    }
  }, [plan.id, onUpgrade]);

  const priceLabel = useMemo(() => {
    if (plan.price === 0) return 'Free';
    return `$${plan.price} one-time`;
  }, [plan.price]);

  const buttonType = useMemo(() => (plan.popular ? 'primary' : 'default'), [plan.popular]);

  const cardClassName = useMemo(
    () => `relative h-full shadow-sm ${plan.popular ? 'border-primary border-2' : ''}`,
    [plan.popular],
  );

  const cardBodyStyles = useMemo(
    () => ({
      display: 'flex' as const,
      flexDirection: 'column' as const,
      height: '100%',
      minHeight: 0,
    }),
    [],
  );

  return (
    <Card className={cardClassName} styles={{ body: cardBodyStyles }}>
      {plan.popular && (
        <div className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white">
          Best Choice
        </div>
      )}

      <Flex vertical gap="middle" style={{ height: '100%', minHeight: 0 }}>
        <Flex vertical align="center" gap="small">
          <Typography.Title level={3} className="text-primary mb-0! text-xl font-bold">
            {plan.name}
          </Typography.Title>
          <Typography.Paragraph className="mb-0! text-center text-gray-500">
            {plan.description}
          </Typography.Paragraph>
          <Flex align="baseline" gap={4}>
            <Typography.Text className="text-primary text-4xl font-bold">
              {priceLabel}
            </Typography.Text>
          </Flex>
        </Flex>

        <Flex vertical gap="small" flex={1} style={{ minHeight: 0 }}>
          {plan.features.map((feature, index) => (
            <Flex key={index} align="center" gap="small">
              <CheckOutlined className={feature.included ? 'text-green-500' : 'text-gray-300'} />
              <Typography.Text
                type={feature.included ? undefined : 'secondary'}
                className={feature.included ? 'text-gray-700' : 'text-gray-400'}
              >
                {feature.text}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>

        <Button
          type={buttonType}
          block
          disabled={isCurrentPlan}
          loading={isUpgrading}
          icon={isUpgrading ? <LoadingOutlined /> : undefined}
          onClick={handleClick}
        >
          {isCurrentPlan ? 'Current Plan' : plan.buttonText}
        </Button>
      </Flex>
    </Card>
  );
};

export default PlanCard;
