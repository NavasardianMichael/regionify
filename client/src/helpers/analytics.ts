/**
 * GA4 via gtag.js. Loads only when `VITE_GA_MEASUREMENT_ID` is set.
 * The gtag stub must push the real `arguments` object (not a spread array) so GA4 parses commands correctly.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

let gaInitialized = false;

export function getGaMeasurementId(): string | undefined {
  const raw = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!raw) return undefined;
  if (!GA_MEASUREMENT_ID_PATTERN.test(raw)) {
    if (import.meta.env.DEV) {
      console.warn(
        '[analytics] VITE_GA_MEASUREMENT_ID is set but does not look like a GA4 Measurement ID (expected G-XXXXXXXX).',
      );
    }
    return undefined;
  }
  return raw;
}

export function initGa4(measurementId: string): void {
  if (gaInitialized) return;
  gaInitialized = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params -- GA4 requires the native Arguments object
    window.dataLayer.push(arguments);
  } as Window['gtag'];

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    ...(import.meta.env.DEV ? { debug_mode: true } : {}),
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
}

export function trackGa4PageView(pagePath: string): void {
  const id = getGaMeasurementId();
  if (!id || typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: `${window.location.origin}${pagePath}`,
  });
}

type Ga4FileDownloadParams = {
  fileExtension: string;
  assetType: 'map_image' | 'map_pdf' | 'map_animation' | 'dataset' | 'sample_dataset';
  country?: string;
  userPlan?: string;
  // pdf
  pdfPageFormat?: string;
  pdfOrientation?: string;
  isMultiPage?: boolean;
  // animation
  animationSmooth?: boolean;
  animationSpeed?: number;
  periodCount?: number;
};

export function trackGa4FileDownload(params: Ga4FileDownloadParams): void {
  const id = getGaMeasurementId();
  if (!id || typeof window.gtag !== 'function') return;

  const eventParams: Record<string, string | number | boolean> = {
    file_extension: params.fileExtension,
    asset_type: params.assetType,
  };

  if (params.country !== undefined) eventParams.country = params.country;
  if (params.userPlan !== undefined) eventParams.user_plan = params.userPlan;
  if (params.pdfPageFormat !== undefined) eventParams.pdf_page_format = params.pdfPageFormat;
  if (params.pdfOrientation !== undefined) eventParams.pdf_orientation = params.pdfOrientation;
  if (params.isMultiPage !== undefined) eventParams.is_multi_page = params.isMultiPage;
  if (params.animationSmooth !== undefined) eventParams.animation_smooth = params.animationSmooth;
  if (params.animationSpeed !== undefined) eventParams.animation_speed = params.animationSpeed;
  if (params.periodCount !== undefined) eventParams.period_count = params.periodCount;

  window.gtag('event', 'file_download', eventParams);
}
