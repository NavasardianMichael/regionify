const CLIENT_URL = import.meta.env.CLIENT_URL ?? '';

function withUtm(path: string, medium: string, campaign: string): string {
  return `${CLIENT_URL}${path}?utm_source=marketing&utm_medium=${medium}&utm_campaign=${campaign}`;
}

export const MARKETING_LINKS_TO_APP = {
  nav: {
    logo: withUtm('/', 'nav', 'logo'),
    generateMap: withUtm('/projects/new', 'nav', 'generate_map'),
  },
  hero: {
    generateMap: withUtm('/projects/new', 'hero', 'generate_map'),
    seePlans: withUtm('/billing', 'hero', 'see_plans'),
  },
  footer: {
    logo: withUtm('/', 'footer', 'logo'),
    home: withUtm('/', 'footer', 'home'),
    pricing: withUtm('/pricing', 'footer', 'pricing'),
    contact: withUtm('/contact', 'footer', 'contact'),
  },
  ctaSection: {
    generateMap: withUtm('/projects/new', 'cta_section', 'generate_map'),
    seePlans: withUtm('/billing', 'cta_section', 'see_plans'),
  },
  aiSection: {
    generateMap: withUtm('/projects/new', 'ai_section', 'generate_map'),
  },
  showcase: {
    logo: withUtm('/', 'showcase', 'logo'),
    generateMap: withUtm('/projects/new', 'showcase', 'generate_map'),
  },
} as const;
