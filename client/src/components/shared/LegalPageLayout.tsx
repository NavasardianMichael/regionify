import { type FC, type ReactNode } from 'react';
import { Flex, Typography } from 'antd';
import { useWorldMapUrl } from '@/hooks/useWorldMapUrl';

type Props = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export const LegalPageLayout: FC<Props> = ({ title, lastUpdated, children }) => {
  const mapUrl = useWorldMapUrl();

  return (
    <>
      <section className="bg-primary relative overflow-hidden px-6 py-16 md:py-20">
        {mapUrl && (
          <img
            src={mapUrl}
            aria-hidden="true"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 select-none"
          />
        )}
        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <Flex vertical gap="small">
            <Typography.Title
              level={1}
              className="mb-0! text-3xl font-bold text-white! md:text-4xl"
            >
              {title}
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.7)' }}>
              Last updated: {lastUpdated}
            </Typography.Text>
          </Flex>
        </div>
      </section>
      <section className="bg-white px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <Flex vertical gap="large">
            {children}
          </Flex>
        </div>
      </section>
    </>
  );
};
