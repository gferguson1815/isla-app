export interface UtmTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export interface UtmBuilderFormData {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export const UTM_SOURCES = [
  'google',
  'facebook',
  'twitter',
  'linkedin',
  'instagram',
  'youtube',
  'email',
  'newsletter',
  'partner',
  'affiliate',
  'referral',
  'direct',
] as const;

export const UTM_MEDIUMS = [
  'cpc',
  'cpm',
  'display',
  'email',
  'social',
  'organic',
  'paid-social',
  'referral',
  'affiliate',
  'video',
  'banner',
  'retargeting',
] as const;

export const UTM_VALIDATION_RULES = {
  maxLength: 255,
  pattern: /^[a-zA-Z0-9_\-]+$/,
  noSpaces: true,
} as const;

export type UtmSource = typeof UTM_SOURCES[number];
export type UtmMedium = typeof UTM_MEDIUMS[number];