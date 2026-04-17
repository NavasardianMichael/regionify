import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AimOutlined,
  ExperimentOutlined,
  GlobalOutlined,
  LaptopOutlined,
  SafetyOutlined,
  TagOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { SVG_PATH_COORD_REGEX, SVG_PATH_NUMBERS_REGEX } from '@/constants/svgPath';
import { loadMapSvg } from '@/helpers/mapLoader';

function computeViewBox(svgEl: SVGSVGElement): string | null {
  const paths = svgEl.querySelectorAll<SVGPathElement>('path');
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  paths.forEach((path) => {
    const d = path.getAttribute('d');
    if (!d) return;
    const coordRegex = new RegExp(SVG_PATH_COORD_REGEX.source, 'gi');
    let match,
      cx = 0,
      cy = 0;
    while ((match = coordRegex.exec(d)) !== null) {
      const cmd = match[1].toUpperCase();
      const isRel = match[1] !== match[1].toUpperCase() && match[1] !== 'Z';
      const nums = (match[2].match(new RegExp(SVG_PATH_NUMBERS_REGEX.source, 'g')) ?? []).map(
        Number,
      );
      if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
        for (let i = 0; i + 1 < nums.length; i += 2) {
          const x = isRel ? cx + nums[i] : nums[i];
          const y = isRel ? cy + nums[i + 1] : nums[i + 1];
          cx = x;
          cy = y;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
  });
  if (!isFinite(minX)) return null;
  const pad = 4;
  return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
}

const AboutPage: FC = () => {
  const navigate = useNavigate();
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMapSvg('worldRussiaSplit')
      .then((raw) => {
        if (!raw || cancelled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(raw, 'image/svg+xml');
        const svgEl = doc.querySelector('svg');
        if (!svgEl) return;
        const viewBox = computeViewBox(svgEl as SVGSVGElement);
        if (viewBox) svgEl.setAttribute('viewBox', viewBox);
        svgEl.querySelectorAll('path').forEach((p) => {
          p.setAttribute('fill', 'white');
          p.removeAttribute('style');
        });
        const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], {
          type: 'image/svg+xml',
        });
        const url = URL.createObjectURL(blob);
        if (!cancelled) setMapUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFaq = useCallback(() => {
    void navigate(ROUTES.FAQ);
  }, [navigate]);

  const handleContact = useCallback(() => {
    void navigate(ROUTES.CONTACT);
  }, [navigate]);

  const handlePlans = useCallback(() => {
    void navigate(ROUTES.BILLING);
  }, [navigate]);

  return (
    <>
      {/* Hero / mission */}
      <section className="bg-primary relative overflow-hidden px-6 py-16 md:py-24">
        {mapUrl && (
          <img
            src={mapUrl}
            aria-hidden="true"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 select-none"
          />
        )}
        <div className="relative z-10 mx-auto w-full max-w-5xl">
          <Flex vertical gap="middle" align="center" className="text-center">
            <Typography.Title
              level={1}
              className="mb-0! text-3xl font-bold text-white! md:text-4xl"
            >
              About Regionify
            </Typography.Title>
            <Typography.Paragraph
              className="mb-0! max-w-2xl text-lg text-balance"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              Make it easy for anyone — not just GIS specialists — to turn a spreadsheet into a
              meaningful, publication-ready choropleth map.
            </Typography.Paragraph>
          </Flex>
        </div>
      </section>

      {/* Why it exists */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <Flex vertical gap="large">
            <Flex vertical gap="small" align="center" className="text-center">
              <Typography.Title
                level={2}
                className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              >
                Why it exists
              </Typography.Title>
              <Typography.Paragraph className="mb-0! max-w-3xl text-gray-500">
                Choropleth maps — regions shaded by a value — show up everywhere: data journalism,
                academic research, business reporting, public-sector dashboards. Yet most tools are
                either desktop GIS software with steep learning curves, or simple online generators
                with no real control over styling. Regionify sits in the middle: powerful enough to
                produce clean, high-quality outputs, and approachable enough to go from raw CSV to
                finished map in minutes.
              </Typography.Paragraph>
            </Flex>
          </Flex>
        </div>
      </section>

      {/* Who uses it */}
      <section className="bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <Flex vertical gap="large">
            <Flex vertical gap="small" align="center" className="text-center">
              <Typography.Title
                level={2}
                className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              >
                Who uses it
              </Typography.Title>
              <Typography.Paragraph className="mb-0! text-gray-500">
                Built for people who care about getting the data and the visual right.
              </Typography.Paragraph>
            </Flex>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <Flex vertical gap="small" align="center" className="text-center">
                <TeamOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Data journalists
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  Produce polished regional maps on tight deadlines for articles and interactive
                  stories.
                </Typography.Paragraph>
              </Flex>
              <Flex vertical gap="small" align="center" className="text-center">
                <ExperimentOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Researchers & analysts
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  Visualize regional findings for papers, presentations, and internal dashboards
                  without learning GIS.
                </Typography.Paragraph>
              </Flex>
              <Flex vertical gap="small" align="center" className="text-center">
                <GlobalOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Educators & developers
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  Create interactive geography lessons or embed live maps into web products with a
                  simple iframe.
                </Typography.Paragraph>
              </Flex>
            </div>
          </Flex>
        </div>
      </section>

      {/* How we think about it */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <Flex vertical gap="large">
            <Flex vertical gap="small" align="center" className="text-center">
              <Typography.Title
                level={2}
                className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              >
                How we think about it
              </Typography.Title>
            </Flex>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
              <Flex vertical gap="small" align="center" className="text-center">
                <LaptopOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Browser-first
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  Everything runs in the browser — no installs, no desktop app. Your spreadsheet is
                  parsed and visualized right on your device.
                </Typography.Paragraph>
              </Flex>
              <Flex vertical gap="small" align="center" className="text-center">
                <TagOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Simple pricing
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  No subscriptions. The free tier is genuinely useful. Paid tiers are one-time
                  purchases that unlock more formats, higher quality, and advanced features.
                </Typography.Paragraph>
              </Flex>
              <Flex vertical gap="small" align="center" className="text-center">
                <AimOutlined className="text-primary mb-sm text-4xl" />
                <Typography.Title level={3} className="mb-0! text-base! font-semibold">
                  Focused scope
                </Typography.Title>
                <Typography.Paragraph className="mb-0! text-gray-500">
                  Regionify does one thing — choropleth maps from your own data — and tries to do it
                  very well. That focus keeps the interface clean and the learning curve low.
                </Typography.Paragraph>
              </Flex>
            </div>
          </Flex>
        </div>
      </section>

      {/* Privacy & trust */}
      <section className="bg-gray-50 px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-5xl">
          <Flex vertical gap="large">
            <Flex vertical gap="small" align="center" className="text-center">
              <SafetyOutlined className="text-primary mb-sm text-4xl" />
              <Typography.Title
                level={2}
                className="text-primary mb-0! text-2xl font-bold md:text-3xl"
              >
                Your data stays yours
              </Typography.Title>
              <Typography.Paragraph className="mb-0! max-w-2xl text-gray-500">
                Your spreadsheet is parsed and visualized in the browser. When you save a project,
                the processed dataset and your styling choices are stored securely on our servers so
                you can pick up where you left off. We never share or sell your data.
              </Typography.Paragraph>
            </Flex>
          </Flex>
        </div>
      </section>

      {/* CTA / links */}
      <section className="bg-primary px-6 py-16 md:py-20">
        <div className="mx-auto w-full max-w-2xl">
          <Flex vertical gap="large" align="center" className="text-center">
            <Typography.Title
              level={2}
              className="mb-0! text-2xl font-bold text-white! md:text-3xl"
            >
              Learn more
            </Typography.Title>
            <Flex gap="middle" wrap="wrap" justify="center">
              <Button
                onClick={handleFaq}
                type="dashed"
                className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
              >
                Read the FAQ
              </Button>
              <Button
                onClick={handlePlans}
                type="dashed"
                className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
              >
                See plans & pricing
              </Button>
              <Button
                onClick={handleContact}
                type="dashed"
                className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
              >
                Contact us
              </Button>
            </Flex>
          </Flex>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
