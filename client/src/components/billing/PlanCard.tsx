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

  const buttonType = useMemo(() => (isCurrentPlan ? 'default' : 'primary'), [isCurrentPlan]);

  const cardClassName = useMemo(
    () =>
      `min-h-0 min-w-0 w-full flex-1 shadow-sm ${plan.popular ? 'border-primary border-2' : ''}`,
    [plan.popular],
  );

  const cardStyles = useMemo(
    () => ({
      root: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        height: '100%',
        minHeight: 0,
        ...(plan.popular ? { overflow: 'visible' as const } : {}),
      },
      body: {
        flex: 1,
        display: 'flex' as const,
        flexDirection: 'column' as const,
        minHeight: 0,
        ...(plan.popular ? { overflow: 'visible' as const } : {}),
      },
    }),
    [plan.popular],
  );

  return (
    <Card className={`relative overflow-visible ${cardClassName}`} styles={cardStyles}>
      {plan.popular ? (
        <span className="bg-primary pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm">
          {t('plans.bestChoice')}
        </span>
      ) : null}
      <Flex vertical gap="middle" className={`min-h-0 flex-1 ${plan.popular ? 'pt-3' : ''}`}>
        <Flex
          vertical
          align="center"
          gap="small"
          className="w-full shrink-0 items-center text-center"
        >
          <Typography.Title
            level={3}
            className="text-primary mb-0! w-full text-center text-xl font-bold"
          >
            {plan.name}
          </Typography.Title>
          <Typography.Paragraph className="mb-0! w-full max-w-full text-center! text-gray-500">
            {plan.description}
          </Typography.Paragraph>
          <Flex align="baseline" justify="center" gap={4} className="w-full">
            <Typography.Text className="text-primary text-4xl font-bold">
              {priceLabel}
            </Typography.Text>
          </Flex>
        </Flex>

        <Flex vertical gap="small" className="min-h-0 w-full flex-1">
          {plan.features.map((feature, index) => (
            <Flex key={index} align="flex-start" gap="small" className="w-full">
              <CheckOutlined className="mt-0.5 shrink-0 text-green-500" />
              <Typography.Text className="text-left text-gray-700">{feature.text}</Typography.Text>
            </Flex>
          ))}
        </Flex>

        <Button
          type={buttonType}
          variant={isCurrentPlan ? 'outlined' : 'solid'}
          color={isCurrentPlan ? 'default' : 'primary'}
          block
          className="mt-auto shrink-0"
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
