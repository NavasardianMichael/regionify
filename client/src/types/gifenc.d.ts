declare module 'gifenc' {
  type RGB = [number, number, number];
  type RGBA = [number, number, number, number];
  type Palette = RGB[] | RGBA[];

  interface GIFEncoderStream {
    reset(): void;
    bytesView(): Uint8Array;
    bytes(): Uint8Array;
    writeByte(byte: number): void;
    writeBytes(data: Uint8Array | number[], offset?: number, length?: number): void;
    readonly buffer: ArrayBuffer;
  }

  interface WriteFrameOptions {
    /** Whether this frame has transparency */
    transparent?: boolean;
    /** Index of the transparent color in the palette */
    transparentIndex?: number;
    /** Delay in milliseconds between frames */
    delay?: number;
    /** Color palette for this frame */
    palette?: Palette;
    /** Number of times to loop. 0 = infinite, -1 = no repeat */
    repeat?: number;
    /** Color depth (bits per pixel) */
    colorDepth?: number;
    /** Disposal method: 0 = none, 1 = leave, 2 = restore to bg, 3 = restore to previous */
    dispose?: number;
    /** Whether this is the first frame (auto-detected when auto=true) */
    first?: boolean;
  }

  interface GIFEncoderInstance {
    reset(): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    readonly buffer: ArrayBuffer;
    readonly stream: GIFEncoderStream;
    writeHeader(): void;
    writeFrame(index: Uint8Array, width: number, height: number, options?: WriteFrameOptions): void;
  }

  interface GIFEncoderOptions {
    /** Initial buffer capacity in bytes */
    initialCapacity?: number;
    /** Auto-write GIF header on first frame */
    auto?: boolean;
  }

  interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444';
    clearAlpha?: boolean;
    clearAlphaColor?: number;
    clearAlphaThreshold?: number;
    oneBitAlpha?: boolean | number;
    useSqrt?: boolean;
    roundRGB?: number;
    roundAlpha?: number;
  }

  export function GIFEncoder(options?: GIFEncoderOptions): GIFEncoderInstance;
  export function quantize(
    data: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: QuantizeOptions,
  ): Palette;
  export function applyPalette(
    data: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: 'rgb565' | 'rgb444' | 'rgba4444',
  ): Uint8Array;
  export function prequantize(
    data: Uint8Array | Uint8ClampedArray,
    options?: { roundRGB?: number; roundAlpha?: number; oneBitAlpha?: boolean | number },
  ): void;
  export function snapColorsToPalette(
    palette: Palette,
    knownColors: Palette,
    threshold?: number,
  ): void;
  export function nearestColorIndex(palette: Palette, color: RGB | RGBA): number;
  export function nearestColor(palette: Palette, color: RGB | RGBA): RGB | RGBA;

  const _default: typeof GIFEncoder;
  export default _default;
}
