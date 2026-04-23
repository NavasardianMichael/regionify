import type { FC } from 'react';
import { BadgesSection } from '@/pages/home/BadgesSection';
import { CtaSection } from '@/pages/home/CtaSection';
import { DataModesSection } from '@/pages/home/DataModesSection';
import { FeaturesSection } from '@/pages/home/FeaturesSection';
import { HeroSection } from '@/pages/home/HeroSection';
import { HowItWorksSection } from '@/pages/home/HowItWorksSection';
import { MapsSection } from '@/pages/home/MapsSection';
import { ShowcaseSection } from '@/pages/home/ShowcaseSection';

const HomePage: FC = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <MapsSection />
    <ShowcaseSection />
    <DataModesSection />
    <BadgesSection />
    <CtaSection />
  </>
);

export default HomePage;
