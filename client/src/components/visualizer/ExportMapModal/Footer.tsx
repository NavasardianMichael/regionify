import { type FC } from 'react';
import { Footer as CropFooter } from './Crop/Footer';

type FooterProps = {
  isCropStep: boolean;
  cropStepDisabled: boolean;
  downloadDisabled: boolean;
  isExporting: boolean;
  downloadLabel: string;
  exportProgress: number;
  totalAnimationFrames: number;
  isAnimationFormat: boolean;
  onBack: () => void;
  onDownload: () => void;
};

export const Footer: FC<FooterProps> = ({
  isCropStep,
  cropStepDisabled,
  downloadDisabled,
  isExporting,
  downloadLabel,
  exportProgress,
  totalAnimationFrames,
  isAnimationFormat,
  onBack,
  onDownload,
}) => {
  if (!isCropStep) return null;
  return (
    <CropFooter
      disabled={cropStepDisabled}
      downloadDisabled={downloadDisabled}
      isExporting={isExporting}
      downloadLabel={downloadLabel}
      exportProgress={exportProgress}
      totalAnimationFrames={totalAnimationFrames}
      isAnimationFormat={isAnimationFormat}
      onBack={onBack}
      onDownload={onDownload}
    />
  );
};
