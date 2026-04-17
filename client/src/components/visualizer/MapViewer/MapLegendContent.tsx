import { type FC } from 'react';
import { Flex, Typography } from 'antd';
import type { LegendItem } from '@/store/legendData/types';
import type { LegendLabelsConfig, LegendTitleConfig } from '@/store/legendStyles/types';

type MapLegendContentProps = {
  title: LegendTitleConfig;
  labels: LegendLabelsConfig;
  legendItems: LegendItem[];
  noDataColor: string;
};

export const MapLegendContent: FC<MapLegendContentProps> = ({
  title,
  labels,
  legendItems,
  noDataColor,
}) => (
  <>
    {title.show && (
      <Flex align="center" gap={4} className="mb-xs">
        <Typography.Text className="text-xs text-green-500">●</Typography.Text>
        <Typography.Text
          className="text-xs font-medium"
          style={{
            color: labels.color,
            fontSize: `${labels.fontSize}px`,
          }}
        >
          {title.text}
        </Typography.Text>
      </Flex>
    )}
    <Flex vertical gap="small">
      {legendItems.map((item) => (
        <Flex key={item.id} align="center" gap="small">
          <div className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
          <Typography.Text
            className="truncate"
            style={{
              color: labels.color,
              fontSize: `${labels.fontSize}px`,
            }}
          >
            {item.name}
          </Typography.Text>
        </Flex>
      ))}
      <Flex align="center" gap="small">
        <div
          className="h-3 w-3 shrink-0 rounded-sm border border-gray-300"
          style={{ backgroundColor: noDataColor }}
        />
        <Typography.Text
          style={{
            color: labels.color,
            fontSize: `${labels.fontSize}px`,
          }}
        >
          No Data
        </Typography.Text>
      </Flex>
    </Flex>
  </>
);
