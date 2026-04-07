import { type FC } from 'react';
import { Footer as CropFooter } from './Crop/Footer';

type FooterProps = {
  isCropStep: boolean;
  cropStepDisabled: boolean;
  downloadDisabled: boolean;
  isExporting: boolean;
  downloadLabel: string;
  onBack: () => void;
  onDownload: () => void;
};

export const Footer: FC<FooterProps> = ({
  isCropStep,
  cropStepDisabled,
  downloadDisabled,
  isExporting,
  downloadLabel,
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
      onBack={onBack}
      onDownload={onDownload}
    />
  );
};
