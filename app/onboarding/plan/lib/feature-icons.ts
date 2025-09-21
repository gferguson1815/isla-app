import {
  MousePointer,
  Link2,
  CalendarDays,
  Globe,
  Users,
  Sparkles,
  CreditCard,
  FolderOpen,
  Link,
  BarChart3,
  UserPlus,
  Zap,
  Shield,
  TestTube,
  FileText,
  Webhook,
  Award,
  Building2,
  MessageSquare,
  Code,
  HeadphonesIcon,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Map of feature identifiers to their corresponding Lucide icons.
 * These identifiers can be stored in Stripe metadata as strings.
 */
export const FEATURE_ICON_MAP: Record<string, LucideIcon> = {
  // Core features
  "tracked-clicks": MousePointer,
  "new-links": Link2,
  "analytics-retention": CalendarDays,
  "custom-domains": Globe,
  "team-members": Users,
  "users": Users,

  // Advanced features
  "advanced-link-features": Sparkles,
  "unlimited-ai-credits": CreditCard,
  "free-link-domain": Globe,
  "link-folders": FolderOpen,
  "deep-links": Link,

  // Business features
  "partner-payouts": UserPlus,
  "real-time-events": Zap,
  "partner-management": Shield,
  "ab-testing": TestTube,
  "customer-insights": FileText,
  "event-webhooks": Webhook,

  // Advanced/Enterprise features
  "advanced-rewards": Award,
  "embedded-dashboard": Building2,
  "messaging-center": MessageSquare,
  "partners-api": Code,
  "priority-support": HeadphonesIcon,

  // Default
  "default": Check,
};

/**
 * Feature type categories for grouping related features
 */
export const FEATURE_CATEGORIES = {
  usage: ["tracked-clicks", "new-links"],
  analytics: ["analytics-retention", "customer-insights"],
  infrastructure: ["custom-domains", "team-members", "users"],
  integrations: ["event-webhooks", "partners-api", "embedded-dashboard"],
  ai: ["unlimited-ai-credits"],
  support: ["priority-support"],
  monetization: ["partner-payouts", "partner-management", "advanced-rewards"],
  experimentation: ["ab-testing"],
  organization: ["link-folders", "deep-links"],
  communication: ["messaging-center", "real-time-events"],
} as const;

/**
 * Get icon for a feature by its identifier
 * Falls back to Check icon if no specific icon is found
 */
export function getFeatureIcon(featureId: string): LucideIcon {
  return FEATURE_ICON_MAP[featureId] || FEATURE_ICON_MAP.default;
}

/**
 * Convert a feature name to a standardized identifier
 * This helps match various formats that might come from Stripe
 */
export function normalizeFeatureId(featureName: string): string {
  return featureName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Get icon by feature name with fuzzy matching
 * Tries exact match first, then normalized, then searches for partial matches
 */
export function getFeatureIconByName(featureName: string): LucideIcon {
  // Try exact match
  if (FEATURE_ICON_MAP[featureName]) {
    return FEATURE_ICON_MAP[featureName];
  }

  // Try normalized match
  const normalized = normalizeFeatureId(featureName);
  if (FEATURE_ICON_MAP[normalized]) {
    return FEATURE_ICON_MAP[normalized];
  }

  // Try partial match on common terms
  const searchTerms = [
    { term: "click", icon: "tracked-clicks" },
    { term: "link", icon: "new-links" },
    { term: "analytics", icon: "analytics-retention" },
    { term: "domain", icon: "custom-domains" },
    { term: "team", icon: "team-members" },
    { term: "user", icon: "users" },
    { term: "ai", icon: "unlimited-ai-credits" },
    { term: "credit", icon: "unlimited-ai-credits" },
    { term: "folder", icon: "link-folders" },
    { term: "partner", icon: "partner-management" },
    { term: "payout", icon: "partner-payouts" },
    { term: "webhook", icon: "event-webhooks" },
    { term: "api", icon: "partners-api" },
    { term: "support", icon: "priority-support" },
    { term: "test", icon: "ab-testing" },
    { term: "insight", icon: "customer-insights" },
    { term: "reward", icon: "advanced-rewards" },
    { term: "dashboard", icon: "embedded-dashboard" },
    { term: "message", icon: "messaging-center" },
    { term: "event", icon: "real-time-events" },
  ];

  const lowerName = featureName.toLowerCase();
  for (const { term, icon } of searchTerms) {
    if (lowerName.includes(term)) {
      return FEATURE_ICON_MAP[icon];
    }
  }

  // Default fallback
  return FEATURE_ICON_MAP.default;
}

/**
 * Example of how this would work with Stripe metadata
 *
 * In Stripe Product metadata:
 * {
 *   "features": JSON.stringify([
 *     { "id": "tracked-clicks", "value": "50K" },
 *     { "id": "new-links", "value": "1K" },
 *     { "id": "analytics-retention", "value": "1 year" }
 *   ])
 * }
 *
 * In your component:
 * const features = JSON.parse(stripeProduct.metadata.features);
 * features.forEach(feature => {
 *   const Icon = getFeatureIcon(feature.id);
 *   // render with Icon
 * });
 */