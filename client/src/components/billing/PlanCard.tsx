import { type FC, useCallback, useMemo } from 'react';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { type Plan, PLANS } from '@regionify/shared';
import { Button, Card, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import type { BillingPlan, PayablePlan } from './types';

export type PlanCardProps = {
  plan: BillingPlan;
  currentPlan: Plan;
  onUpgrade: (plan: PayablePlan) => void;
  upgradingPlan: PayablePlan | null;
};

const PlanCard: FC<PlanCardProps> = ({ plan, currentPlan, onUpgrade, upgradingPlan }) => {
  const { t } = useTypedTranslation();
  const isCurrentPlan = plan.id === currentPlan;
  const isUpgrading = upgradingPlan === plan.id;

  const handleClick = useCallback(() => {
    if (plan.id === PLANS.explorer || plan.id === PLANS.chronographer) {
      onUpgrade(plan.id as PayablePlan);
    }
  }, [plan.id, onUpgrade]);

  const priceLabel = useMemo(() => {
    if (plan.price === 0) return t('plans.priceFree');
    return t('plans.priceOneTime', { price: `$${plan.price}` });
  }, [plan.price, t]);

  const buttonType = useMemo(() => (plan.popular ? 'primary' : 'default'), [plan.popular]);

  const cardClassName = useMemo(
    () => `relative h-full min-h-0 shadow-sm ${plan.popular ? 'border-primary border-2' : ''}`,
    [plan.popular],
  );

  const cardBodyStyles = useMemo(
    () => ({
      display: 'flex' as const,
      flexDirection: 'column' as const,
      height: '100%',
    }),
    [],
  );

  return (
    <Card className={cardClassName} styles={{ body: cardBodyStyles }}>
      {plan.popular && (
        <div className="bg-primary absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-white">
          {t('plans.bestChoice')}
        </div>
      )}

      <Flex vertical gap="middle" className="h-full w-full">
        <Flex vertical align="center" gap="small" className="w-full items-center text-center">
          <Typography.Title
            level={3}
            className="text-primary mb-0! w-full text-center text-xl font-bold"
          >
            {plan.name}
          </Typography.Title>
          <Typography.Paragraph className="mb-0! w-full max-w-full text-center text-gray-500">
            {plan.description}
          </Typography.Paragraph>
          <Flex align="baseline" justify="center" gap={4} className="w-full">
            <Typography.Text className="text-primary text-4xl font-bold">
              {priceLabel}
            </Typography.Text>
          </Flex>
        </Flex>

        <Flex vertical gap="small" className="w-full">
          {plan.features.map((feature, index) => (
            <Flex key={index} align="flex-start" gap="small" className="w-full">
              <CheckOutlined className="mt-0.5 shrink-0 text-green-500" />
              <Typography.Text className="text-left text-gray-700">{feature.text}</Typography.Text>
            </Flex>
          ))}
        </Flex>

        <Button
          type={buttonType}
          block
          className="mt-auto"
          disabled={isCurrentPlan}
          loading={isUpgrading}
          icon={isUpgrading ? <LoadingOutlined /> : undefined}
          onClick={handleClick}
        >
          {isCurrentPlan ? t('plans.currentPlan') : plan.buttonText}
        </Button>
      </Flex>
    </Card>
  );
};

export default PlanCard;
