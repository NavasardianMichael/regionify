export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/** Coarse device classification from a User-Agent string. Best-effort, not exhaustive. */
export function getDeviceType(userAgent: string | undefined): DeviceType {
  if (!userAgent) return 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}
