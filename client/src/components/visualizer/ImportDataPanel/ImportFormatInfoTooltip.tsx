import { type FC } from 'react';

/**
 * Static content for the "expected format" info tooltip in Import Data panel.
 */
export const ImportFormatInfoTooltip: FC = () => (
  <ul className="m-0 list-disc space-y-2 p-3 ps-8 text-sm text-white">
    <li>
      <strong>id</strong> — Region ID; must exactly match the expected IDs (e.g. from sample data)
    </li>
    <li>
      <strong>label</strong> — Display label for the region
    </li>
    <li>
      <strong>value</strong> — Numeric value for the region
    </li>
    <li>Labels are displayed on the map when &quot;Show Labels&quot; is enabled</li>
  </ul>
);
