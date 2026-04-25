declare module 'gif-encoder-2' {
  export default class GIFEncoder {
    constructor(width: number, height: number, algorithm?: string, useOptimizer?: boolean);
    start(): void;
    setRepeat(n: number): void;
    setDelay(ms: number): void;
    setQuality(q: number): void;
    addFrame(pixels: Uint8ClampedArray, force?: boolean): void;
    finish(): void;
    out: { getData(): Uint8Array };
  }
}
