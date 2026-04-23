import type { FC } from 'react';
import type { TimelineProps } from 'antd';
import { Flex, Timeline, Typography } from 'antd';

type Step = { title: string; desc: string };

const steps: Step[] = [
  {
    title: 'Import your data',
    desc: 'Upload a CSV, Excel, or JSON file — or paste a Google Sheets URL for a live connection. Regionify uses fuzzy matching to automatically link your rows to map regions.',
  },
  {
    title: 'Pick a region map',
    desc: 'Choose from 200+ built-in maps: world countries, US states, EU regions, Brazilian states, and more — no GIS files to source or install.',
  },
  {
    title: 'Customize colors & legend',
    desc: 'Select a color scale, adjust breakpoints, fine-tune labels, strokes, and fonts until the map looks exactly right for your audience.',
  },
  {
    title: 'Export or share',
    desc: 'Download a static PNG, SVG, or JPEG — or on higher plans, export an animated GIF or MP4, publish a public page, or drop an iframe into any site.',
  },
];

const timelineItems: NonNullable<TimelineProps['items']> = steps.map(({ title, desc }, index) => ({
  color: '#18294d',
  content: (
    <Flex vertical gap="xs" className={index < steps.length - 1 ? 'pb-6 pl-2' : 'pl-2'}>
      <Typography.Title level={3} className="mb-0! text-lg! font-semibold">
        {title}
      </Typography.Title>
      <Typography.Paragraph className="mb-0! text-gray-500">{desc}</Typography.Paragraph>
    </Flex>
  ),
}));

export const HowItWorksSection: FC = () => (
  <section className="px-6 py-16 md:py-20">
    <div className="mx-auto w-full max-w-5xl">
      <Flex vertical gap="large">
        <Flex vertical gap="small" align="center" className="text-center">
          <Typography.Title level={2} className="text-primary mb-0! text-2xl font-bold md:text-3xl">
            How it works
          </Typography.Title>
          <Typography.Paragraph className="mb-0! text-gray-500">
            From raw data to a publication-ready map in four steps.
          </Typography.Paragraph>
        </Flex>
        <div className="mx-auto w-full max-w-2xl">
          <Timeline items={timelineItems} />
        </div>
      </Flex>
    </div>
  </section>
);
