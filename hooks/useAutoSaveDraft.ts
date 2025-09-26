import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from './useDebounce';

interface DraftData {
  destinationUrl?: string;
  slug?: string;
  domain?: string;
  tags?: string[];
  comments?: string;
  folderId?: string;
  title?: string;
  description?: string;
  image?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  password?: string;
  expiresAt?: Date;
  clickLimit?: number;
  iosUrl?: string;
  androidUrl?: string;
  geoTargeting?: any;
  deviceTargeting?: any;
  qrCodeSettings?: any;
  conversionTracking?: any;
}

interface UseAutoSaveDraftOptions {
  enabled?: boolean;
  debounceMs?: number;
  maxIntervalMs?: number;
  workspaceId?: string;
  draftId?: string;
  initialValues?: Partial<DraftData>; // Track all initial/auto-generated values
  onSaveSuccess?: (data: DraftData) => Promise<void>;
  onSaveError?: (error: any) => void;
}

export function useAutoSaveDraft(
  data: DraftData,
  options: UseAutoSaveDraftOptions = {}
) {
  const {
    enabled = true,
    debounceMs = 2000, // 2 seconds after user stops typing
    maxIntervalMs = 30000, // Max 30 seconds between saves
    workspaceId,
    draftId,
    initialValues = {},
    onSaveSuccess,
    onSaveError
  } = options;

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const lastSavedDataRef = useRef<string>('');
  const saveTimerRef = useRef<NodeJS.Timeout>();

  // Debounced data for triggering saves after inactivity
  const debouncedData = useDebounce(data, debounceMs);

  // Check if data has actually changed
  const hasDataChanged = useCallback((newData: DraftData) => {
    const newDataString = JSON.stringify(newData);
    const hasChanged = newDataString !== lastSavedDataRef.current;
    return hasChanged;
  }, []);

  // Save draft function
  const saveDraft = useCallback(async (draftData: DraftData) => {
    if (!enabled || !workspaceId) return;

    // Don't save if data hasn't changed
    if (!hasDataChanged(draftData)) {
      return;
    }


    // Check if any field has meaningful user-entered content
    // Exclude any field that matches its initial/auto-generated value
    const hasUserContent = Object.entries(draftData).some(([key, value]) => {
      // Skip fields that shouldn't trigger autosave by themselves
      // These are auto-generated or default values that don't represent user intent
      const skipFields = ['slug', 'domain', 'qrCodeSettings', 'folderId', 'geoTargeting', 'deviceTargeting', 'conversionTracking'];
      if (skipFields.includes(key)) {
        return false;
      }

      // Get the initial value for this field
      const initialValue = initialValues[key as keyof DraftData];

      // Compare with initial value
      if (typeof value === 'object' && value !== null && typeof initialValue === 'object' && initialValue !== null) {
        // Deep comparison for objects/arrays
        const currentStr = JSON.stringify(value);
        const initialStr = JSON.stringify(initialValue);

        // If it's the same as initial, it's not user content
        if (currentStr === initialStr) {
          return false;
        }

        // Special handling for empty objects vs objects with default values
        // If the initial value has properties but current value matches them exactly, it's not user content
        if (!Array.isArray(value) && !Array.isArray(initialValue)) {
          const hasChanged = JSON.stringify(value) !== JSON.stringify(initialValue);
          if (!hasChanged) {
            return false;
          }
        }

        // For arrays, check if non-empty
        if (Array.isArray(value) && value.length === 0) {
          return false;
        }

        // For objects, check if only has default properties
        if (!Array.isArray(value) && Object.keys(value).length === 0) {
          return false;
        }

        // Has user content
        return true;
      }

      // For primitive values
      if (value === initialValue) {
        return false;
      }

      // Check if value is meaningful (not empty)
      if (value === undefined || value === null || value === '') {
        return false;
      }

      if (typeof value === 'string' && value.trim().length === 0) {
        return false;
      }

      // Has user content
      return true;
    });

    if (!hasUserContent) {
      return;
    }

    setIsSaving(true);

    try {
      const draft = {
        ...draftData,
        savedAt: new Date().toISOString()
      };

      // Store in localStorage for immediate feedback
      localStorage.setItem(`link_draft_${workspaceId}_${draftId || 'new'}`, JSON.stringify(draft));

      // Call the onSaveSuccess callback which will handle the API call
      if (onSaveSuccess) {
        await onSaveSuccess(draftData);
      }

      lastSavedDataRef.current = JSON.stringify(draftData);
      setSavedAt(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('[AutoSave] Failed to save draft:', error);
      if (onSaveError) {
        onSaveError(error);
      }
    } finally {
      setIsSaving(false);
    }
  }, [enabled, workspaceId, draftId, hasDataChanged, onSaveSuccess, onSaveError]);

  // Restore draft function
  const restoreDraft = useCallback((targetDraftId?: string) => {
    if (!enabled || !workspaceId) return null;

    try {
      const storageKey = `link_draft_${workspaceId}_${targetDraftId || draftId || 'new'}`;
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        lastSavedDataRef.current = JSON.stringify(draft);
        return draft;
      }
    } catch (error) {
      console.error('[AutoSave] Failed to restore draft:', error);
    }
    return null;
  }, [enabled, workspaceId, draftId]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    if (!enabled || !workspaceId) return;

    try {
      const storageKey = `link_draft_${workspaceId}_${draftId || 'new'}`;
      localStorage.removeItem(storageKey);
      lastSavedDataRef.current = '';
      setSavedAt(null);
      setIsDirty(false);
    } catch (error) {
      console.error('[AutoSave] Failed to clear draft:', error);
    }
  }, [enabled, workspaceId, draftId]);

  // Effect for debounced autosave
  useEffect(() => {
    if (!enabled) return;

    if (hasDataChanged(debouncedData)) {
      setIsDirty(true);
      saveDraft(debouncedData);
    }
  }, [debouncedData, enabled, hasDataChanged, saveDraft]);

  // Effect for maximum interval autosave
  useEffect(() => {
    if (!enabled || !isDirty) return;

    // Clear existing timer
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
    }

    // Set up max interval save
    saveTimerRef.current = setInterval(() => {
      if (isDirty && hasDataChanged(data)) {
        saveDraft(data);
      }
    }, maxIntervalMs);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
    };
  }, [enabled, isDirty, data, hasDataChanged, saveDraft, maxIntervalMs]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty && hasDataChanged(data)) {
        saveDraft(data);
      }
    };
  }, []);

  return {
    savedAt,
    isSaving,
    isDirty,
    saveDraft: () => saveDraft(data),
    restoreDraft,
    clearDraft
  };
}