import type { PictureConfig } from '@/store/mapStyles/types';

/** Default map canvas background when not transparent (view/export). */
export const DEFAULT_MAP_PICTURE: PictureConfig = {
  transparentBackground: false,
  backgroundColor: '#FFFFFF',
  showWatermark: false,
};

/** Solid fill behind the map when not transparent; defaults to white if missing. */
export function resolveOpaqueMapBackgroundColor(picture: PictureConfig): string {
  return picture.backgroundColor || DEFAULT_MAP_PICTURE.backgroundColor;
}
