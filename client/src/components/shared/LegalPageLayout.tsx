import { type FC, type ReactNode } from 'react';
import { Flex, Typography } from 'antd';

type Props = {
  title: string;
  lastUpdated: string;
  children: ReactNode;
};

export const LegalPageLayout: FC<Props> = ({ title, lastUpdated, children }) => (
  <>
    <section className="bg-primary px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <Flex vertical gap="small">
          <Typography.Title level={1} className="mb-0! text-3xl font-bold text-white! md:text-4xl">
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
