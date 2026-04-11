import type { FC } from 'react';
import { CtaSection } from '@/pages/home/CtaSection';
import { DataModesSection } from '@/pages/home/DataModesSection';
import { FeaturesSection } from '@/pages/home/FeaturesSection';
import { HeroSection } from '@/pages/home/HeroSection';
import { MapsSection } from '@/pages/home/MapsSection';
import { PlansSection } from '@/pages/home/PlansSection';
import { ShowcaseSection } from '@/pages/home/ShowcaseSection';

const HomePage: FC = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <MapsSection />
    <DataModesSection />
    <ShowcaseSection />
    <PlansSection />
    <CtaSection />
  </>
);

export default HomePage;
