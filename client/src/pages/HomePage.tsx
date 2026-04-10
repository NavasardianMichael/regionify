import type { FC } from 'react';
import { CtaSection } from '@/pages/home/CtaSection';
import { FeaturesSection } from '@/pages/home/FeaturesSection';
import { HeroSection } from '@/pages/home/HeroSection';
import { MapsSection } from '@/pages/home/MapsSection';
import { PlansSection } from '@/pages/home/PlansSection';

const HomePage: FC = () => (
  <>
    <HeroSection />
    <FeaturesSection />
    <MapsSection />
    <PlansSection />
    <CtaSection />
  </>
);

export default HomePage;
