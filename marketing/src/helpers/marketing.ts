const CLIENT_URL = import.meta.env.CLIENT_URL ?? '';

function withUtm(path: string, medium: string, campaign: string): string {
  return `${CLIENT_URL}${path}?utm_source=marketing&utm_medium=${medium}&utm_campaign=${campaign}`;
}

/**
 * Every path below must exist in the client's `ROUTES` table
 * (`client/src/constants/routes.ts`). An unlisted path falls through nginx to
 * the SPA shell and throws `No route matches URL` at runtime.
 */
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
    pricing: withUtm('/billing', 'footer', 'pricing'),
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
  // One medium per guide, so guide conversions stay distinguishable from the 190 country
  // pages in analytics — reusing `cta_section` would merge them and defeat the measurement.
  guideIndex: {
    generateMap: withUtm('/projects/new', 'guide_index', 'generate_map'),
    seePlans: withUtm('/billing', 'guide_index', 'see_plans'),
  },
  guideEmbed: {
    generateMap: withUtm('/projects/new', 'guide_embed', 'generate_map'),
    seePlans: withUtm('/billing', 'guide_embed', 'see_plans'),
  },
  guideSheets: {
    generateMap: withUtm('/projects/new', 'guide_sheets', 'generate_map'),
    seePlans: withUtm('/billing', 'guide_sheets', 'see_plans'),
  },
  guideAnimation: {
    generateMap: withUtm('/projects/new', 'guide_animation', 'generate_map'),
    seePlans: withUtm('/billing', 'guide_animation', 'see_plans'),
  },
  guideExplainer: {
    generateMap: withUtm('/projects/new', 'guide_explainer', 'generate_map'),
    seePlans: withUtm('/billing', 'guide_explainer', 'see_plans'),
    faq: withUtm('/faq', 'guide_explainer', 'faq'),
  },
} as const;
