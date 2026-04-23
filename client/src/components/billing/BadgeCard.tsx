import { type FC, useCallback, useMemo } from 'react';
import { CheckOutlined, LoadingOutlined } from '@ant-design/icons';
import { type Badge, BADGES } from '@regionify/shared';
import { Button, Card, Flex, Typography } from 'antd';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
import type { BillingBadge, PayableBadge } from './types';

export type BadgeCardProps = {
  tier: BillingBadge;
  currentBadge: Badge;
  onUpgrade: (badge: PayableBadge) => void;
  upgradingBadge: PayableBadge | null;
  localizedPrice?: string;
  hideButton?: boolean;
};

const BadgeCard: FC<BadgeCardProps> = ({
  tier,
  currentBadge,
  onUpgrade,
  upgradingBadge,
  localizedPrice,
  hideButton = false,
}) => {
  const { t } = useTypedTranslation();
  const isCurrentBadge = tier.id === currentBadge;
  const isUpgrading = upgradingBadge === tier.id;
  const showPopularHighlight = tier.popular && currentBadge !== BADGES.chronographer;

  const handleClick = useCallback(() => {
    if (tier.id === BADGES.explorer || tier.id === BADGES.chronographer) {
      onUpgrade(tier.id as PayableBadge);
    }
  }, [tier.id, onUpgrade]);

  const priceLabel = useMemo(() => {
    if (tier.price === 0) {
      return t('badges.priceFree');
    }
    if (localizedPrice) {
      return t('badges.priceOneTime', { price: localizedPrice });
    }
    return t('badges.priceOneTime', { price: `$${tier.price}` });
  }, [tier.price, localizedPrice, t]);

  const buttonType = useMemo(() => (isCurrentBadge ? 'default' : 'primary'), [isCurrentBadge]);

  const cardClassName = useMemo(
    () =>
      `min-h-0 min-w-0 w-full flex-1 shadow-sm ${showPopularHighlight ? 'border-primary border-2' : ''}`,
    [showPopularHighlight],
  );

  const cardStyles = useMemo(
    () => ({
      root: {
        display: 'flex' as const,
        flexDirection: 'column' as const,
        height: '100%',
        minHeight: 0,
        ...(showPopularHighlight ? { overflow: 'visible' as const } : {}),
      },
      body: {
        flex: 1,
        display: 'flex' as const,
        flexDirection: 'column' as const,
        minHeight: 0,
        ...(showPopularHighlight ? { overflow: 'visible' as const } : {}),
      },
    }),
    [showPopularHighlight],
  );

  return (
    <Card className={`relative overflow-visible ${cardClassName}`} styles={cardStyles}>
      {showPopularHighlight ? (
        <span
          className="bg-primary pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap text-white shadow-sm"
          data-i18n-key="badges.bestChoice"
        >
          {t('badges.bestChoice')}
        </span>
      ) : null}
      <Flex
        vertical
        gap="middle"
        className={`min-h-0 flex-1 ${showPopularHighlight ? 'pt-3' : ''}`}
      >
        <Flex
          vertical
          align="center"
          gap="small"
          className="w-full shrink-0 items-center text-center"
        >
          <Typography.Title
            level={3}
            className="text-primary mb-0! w-full text-center text-xl font-bold"
            data-i18n-key="badges.items.observer.name"
          >
            {tier.name}
          </Typography.Title>
          <Typography.Paragraph
            className="mb-0! w-full max-w-full text-center! text-gray-500"
            data-i18n-key="badges.items.observer.description"
          >
            {tier.description}
          </Typography.Paragraph>
          <Flex align="baseline" justify="center" gap={4} className="w-full">
            {tier.price === 0 ? (
              <Typography.Text
                className="text-primary text-4xl font-bold"
                data-i18n-key="badges.priceFree"
              >
                {priceLabel}
              </Typography.Text>
            ) : (
              <Typography.Text
                className="text-primary text-4xl font-bold"
                data-i18n-key="badges.priceOneTime"
              >
                {priceLabel}
              </Typography.Text>
            )}
          </Flex>
        </Flex>

        <Flex vertical gap="small" className="min-h-0 w-full flex-1">
          {tier.features.map((feature, index) => (
            <Flex key={index} align="flex-start" gap="small" className="w-full">
              <CheckOutlined className="mt-0.5 shrink-0 text-green-500" />
              <Typography.Text
                className="text-left text-gray-700"
                data-i18n-key="badges.rows.advancedStyles"
              >
                {feature.text}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>

        {!hideButton &&
          (isCurrentBadge ? (
            <Button
              type={buttonType}
              variant="outlined"
              color="default"
              block
              className="mt-auto shrink-0"
              disabled
              loading={isUpgrading}
              icon={isUpgrading ? <LoadingOutlined /> : undefined}
              onClick={handleClick}
              data-i18n-key="badges.currentBadge"
            >
              {t('badges.currentBadge')}
            </Button>
          ) : (
            <Button
              type={buttonType}
              variant="solid"
              color="primary"
              block
              className="mt-auto shrink-0"
              loading={isUpgrading}
              icon={isUpgrading ? <LoadingOutlined /> : undefined}
              onClick={handleClick}
              data-i18n-key="badges.items.explorer.buttonText"
            >
              {tier.buttonText}
            </Button>
          ))}
      </Flex>
    </Card>
  );
};

export default BadgeCard;
