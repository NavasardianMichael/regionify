import { type FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Flex, Typography } from 'antd';
import { ROUTES } from '@/constants/routes';
import { SVG_PATH_COORD_REGEX, SVG_PATH_NUMBERS_REGEX } from '@/constants/svgPath';
import { useTypedTranslation } from '@/i18n/useTypedTranslation';
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

export const HeroSection: FC = () => {
  const { t } = useTypedTranslation();
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

  const handleStart = useCallback(() => {
    void navigate(ROUTES.PROJECT_NEW);
  }, [navigate]);

  const handlePlans = useCallback(() => {
    void navigate(ROUTES.BILLING);
  }, [navigate]);

  return (
    <section className="bg-primary relative overflow-hidden px-6 py-20 md:py-28 lg:py-32">
      {mapUrl && (
        <img
          src={mapUrl}
          aria-hidden="true"
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10 select-none"
        />
      )}
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Flex vertical gap="large">
          <Flex vertical gap="middle" className="max-w-2xl text-left">
            <Typography.Title
              level={1}
              className="mb-0! text-4xl font-bold text-white! md:text-5xl lg:text-6xl"
            >
              {t('home.heroHeadline')}
            </Typography.Title>
            <Typography.Paragraph
              className="mb-0! text-lg md:text-xl"
              style={{ color: 'rgba(255,255,255,0.8)' }}
            >
              {t('home.heroSubheadline')}
            </Typography.Paragraph>
          </Flex>
          <Flex gap="middle" wrap="wrap" justify="start">
            <Button
              onClick={handleStart}
              type="dashed"
              className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
            >
              {t('home.ctaStart')}
            </Button>
            <Button
              onClick={handlePlans}
              type="dashed"
              className="border-white! bg-transparent! font-semibold text-white! hover:bg-white/5!"
            >
              {t('home.ctaPlans')}
            </Button>
          </Flex>
        </Flex>
      </div>
    </section>
  );
};
