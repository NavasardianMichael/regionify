import { useEffect, useState } from 'react';
import { getPricingPreview } from '@/api/payments';
import type { LocalizedPrices } from '@/api/payments/types';

export function usePricingPreview(): {
  prices: LocalizedPrices | null;
  isLoading: boolean;
  hasError: boolean;
} {
  const [prices, setPrices] = useState<LocalizedPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPricingPreview()
      .then((data) => {
        if (!cancelled) {
          setPrices(data);
          setHasError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { prices, isLoading, hasError };
}
