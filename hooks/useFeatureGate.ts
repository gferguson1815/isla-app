import { api } from '@/utils/api';
import { useCallback } from 'react';

export interface FeatureInfo {
  enabled: boolean;
  limit?: number | null;
  message?: string | null;
  metadata?: any;
  name?: string;
  description?: string;
  category?: string;
  loading?: boolean;
}

export function useFeatureGate(workspaceId: string) {
  // Fetch all features for the workspace's plan
  const { data: features, isLoading, error } = api.features.getWorkspaceFeatures.useQuery(
    { workspace_id: workspaceId },
    {
      enabled: !!workspaceId,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      retry: 2
    }
  );

  // Mutation for tracking feature usage
  const trackUsage = api.features.trackUsage.useMutation();

  // Check if a specific feature is enabled
  const checkFeature = useCallback((featureKey: string): FeatureInfo => {
    if (!features || isLoading) {
      return {
        enabled: false,
        limit: 0,
        message: 'Loading features...',
        loading: true
      };
    }

    const feature = features[featureKey];
    if (!feature) {
      return {
        enabled: false,
        limit: 0,
        message: 'This feature is not available on your current plan',
        loading: false
      };
    }

    return {
      ...feature,
      loading: false
    };
  }, [features, isLoading]);

  // Use a feature (checks if enabled and tracks usage)
  const useFeature = useCallback(async (featureKey: string): Promise<FeatureInfo> => {
    const feature = checkFeature(featureKey);

    if (feature.enabled && workspaceId) {
      // Track usage in the background (don't wait for it)
      trackUsage.mutate({
        workspace_id: workspaceId,
        feature_key: featureKey
      });
    }

    return feature;
  }, [checkFeature, trackUsage, workspaceId]);

  // Helper functions for common features
  const canUseFolders = useCallback(() => {
    const feature = checkFeature('folders');
    return feature.enabled;
  }, [checkFeature]);

  const canUseCustomDomains = useCallback(() => {
    const feature = checkFeature('custom_domains');
    return feature.enabled;
  }, [checkFeature]);

  const canUsePasswordProtection = useCallback(() => {
    const feature = checkFeature('password_protection');
    return feature.enabled;
  }, [checkFeature]);

  const canUseLinkExpiration = useCallback(() => {
    const feature = checkFeature('link_expiration');
    return feature.enabled;
  }, [checkFeature]);

  const canUseUtmBuilder = useCallback(() => {
    const feature = checkFeature('utm_builder');
    return feature.enabled;
  }, [checkFeature]);

  const canUseQrCodeCustomization = useCallback(() => {
    const feature = checkFeature('qr_code_customization');
    return feature.enabled;
  }, [checkFeature]);

  const canUseBulkImport = useCallback(() => {
    const feature = checkFeature('bulk_import');
    return feature.enabled;
  }, [checkFeature]);

  const canUseApiAccess = useCallback(() => {
    const feature = checkFeature('api_access');
    return feature.enabled;
  }, [checkFeature]);

  const canUseLinkPreviewCustomization = useCallback(() => {
    const feature = checkFeature('link_preview_customization');
    return feature.enabled;
  }, [checkFeature]);

  return {
    features,
    isLoading,
    error,
    checkFeature,
    useFeature,
    // Helper functions
    canUseFolders,
    canUseCustomDomains,
    canUsePasswordProtection,
    canUseLinkExpiration,
    canUseUtmBuilder,
    canUseQrCodeCustomization,
    canUseBulkImport,
    canUseApiAccess,
    canUseLinkPreviewCustomization,
  };
}