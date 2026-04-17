import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type CropperRef } from 'react-advanced-cropper';
import { type CropRect } from '@/helpers/mapExport';

export type AspectRatioPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

const ASPECT_RATIO_VALUES: Record<AspectRatioPreset, number | undefined> = {
  free: undefined,
  '1:1': 1,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '16:9': 16 / 9,
  '9:16': 9 / 16,
};

export const ASPECT_RATIO_OPTIONS: { value: AspectRatioPreset; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
];

type UseExportCropParams = {
  generatePreviewCanvas: () => Promise<HTMLCanvasElement | null>;
};

export function useExportCrop({ generatePreviewCanvas }: UseExportCropParams) {
  const cropperRef = useRef<CropperRef>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [aspectRatioPreset, setAspectRatioPreset] = useState<AspectRatioPreset>('free');
  const [cropWidth, setCropWidth] = useState<number | null>(null);
  const [cropHeight, setCropHeight] = useState<number | null>(null);
  /** Full image dimensions for computing max crop bounds. */
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const aspectRatio = useMemo(() => ASPECT_RATIO_VALUES[aspectRatioPreset], [aspectRatioPreset]);

  const generatePreview = useCallback(async () => {
    setIsGeneratingPreview(true);
    try {
      const canvas = await generatePreviewCanvas();
      if (!canvas) return;

      setImageSize({ width: canvas.width, height: canvas.height });
      setCropWidth(canvas.width);
      setCropHeight(canvas.height);
      setAspectRatioPreset('free');

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
      if (!blob) return;

      setPreviewSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [generatePreviewCanvas]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      setPreviewSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const handleCropChange = useCallback((_cropper: CropperRef) => {
    const coords = _cropper.getCoordinates();
    if (!coords) return;
    setCropWidth(Math.round(coords.width));
    setCropHeight(Math.round(coords.height));
  }, []);

  const handleAspectRatioChange = useCallback((preset: AspectRatioPreset) => {
    setAspectRatioPreset(preset);
    // The cropper will automatically adjust when the stencilProps.aspectRatio changes
    // via the React render cycle. We also reset crop size so width/height inputs stay fresh.
  }, []);

  const handleWidthChange = useCallback(
    (value: number | null) => {
      if (value === null || !imageSize) {
        setCropWidth(value);
        return;
      }

      const clamped = Math.max(1, Math.min(value, imageSize.width));
      setCropWidth(clamped);

      if (aspectRatio) {
        const newHeight = Math.round(clamped / aspectRatio);
        setCropHeight(Math.max(1, Math.min(newHeight, imageSize.height)));
      }

      const cropper = cropperRef.current;
      if (!cropper) return;

      const coords = cropper.getCoordinates();
      if (!coords) return;

      const newHeight = aspectRatio ? Math.round(clamped / aspectRatio) : coords.height;

      cropper.setCoordinates({
        width: clamped,
        height: Math.max(1, Math.min(newHeight, imageSize.height)),
      });
    },
    [aspectRatio, imageSize],
  );

  const handleHeightChange = useCallback(
    (value: number | null) => {
      if (value === null || !imageSize) {
        setCropHeight(value);
        return;
      }

      const clamped = Math.max(1, Math.min(value, imageSize.height));
      setCropHeight(clamped);

      if (aspectRatio) {
        const newWidth = Math.round(clamped * aspectRatio);
        setCropWidth(Math.max(1, Math.min(newWidth, imageSize.width)));
      }

      const cropper = cropperRef.current;
      if (!cropper) return;

      const coords = cropper.getCoordinates();
      if (!coords) return;

      const newWidth = aspectRatio ? Math.round(clamped * aspectRatio) : coords.width;

      cropper.setCoordinates({
        width: Math.max(1, Math.min(newWidth, imageSize.width)),
        height: clamped,
      });
    },
    [aspectRatio, imageSize],
  );

  const getCroppedCanvas = useCallback((): HTMLCanvasElement | null => {
    const cropper = cropperRef.current;
    if (!cropper) return null;
    return cropper.getCanvas() ?? null;
  }, []);

  const getCropRect = useCallback((): CropRect | null => {
    const cropper = cropperRef.current;
    if (!cropper) return null;
    const coords = cropper.getCoordinates();
    if (!coords) return null;

    // If crop covers the full image, return null (no crop needed)
    if (
      imageSize &&
      Math.abs(coords.width - imageSize.width) < 2 &&
      Math.abs(coords.height - imageSize.height) < 2
    ) {
      return null;
    }

    return {
      x: Math.round(coords.left),
      y: Math.round(coords.top),
      width: Math.round(coords.width),
      height: Math.round(coords.height),
    };
  }, [imageSize]);

  const reset = useCallback(() => {
    setPreviewSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAspectRatioPreset('free');
    setCropWidth(null);
    setCropHeight(null);
    setImageSize(null);
  }, []);

  return {
    cropperRef,
    previewSrc,
    isGeneratingPreview,
    aspectRatioPreset,
    aspectRatio,
    cropWidth,
    cropHeight,
    imageSize,
    generatePreview,
    handleCropChange,
    handleAspectRatioChange,
    handleWidthChange,
    handleHeightChange,
    getCroppedCanvas,
    getCropRect,
    reset,
  };
}

export type ExportCropState = ReturnType<typeof useExportCrop>;
