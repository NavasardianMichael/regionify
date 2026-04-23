import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';

type GuardParams = {
  hasUnsavedChanges: boolean;
  onSave: () => Promise<boolean>;
};

export function useUnsavedChangesGuard({ hasUnsavedChanges, onSave }: GuardParams) {
  const blocker = useBlocker(hasUnsavedChanges);
  const [isSaving, setIsSaving] = useState(false);

  const isModalOpen = blocker.state === 'blocked';

  const handleDiscard = useCallback(() => {
    if (blocker.state === 'blocked') blocker.proceed();
  }, [blocker]);

  const handleSaveAndLeave = useCallback(async () => {
    if (blocker.state !== 'blocked') return;
    setIsSaving(true);
    try {
      const saved = await onSave();
      if (saved) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    } catch {
      blocker.reset();
    } finally {
      setIsSaving(false);
    }
  }, [blocker, onSave]);

  const handleCancel = useCallback(() => {
    if (blocker.state === 'blocked') blocker.reset();
  }, [blocker]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  return { isModalOpen, isSaving, handleDiscard, handleSaveAndLeave, handleCancel };
}
