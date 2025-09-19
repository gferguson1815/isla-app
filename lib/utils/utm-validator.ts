import { UTM_SOURCES, UTM_MEDIUMS } from '@/packages/shared/src/types/utm';

export interface UtmValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface UtmBestPractices {
  source: string[];
  medium: string[];
  campaign: string[];
}

export const UTM_BEST_PRACTICES: UtmBestPractices = {
  source: [
    'Use lowercase for consistency (e.g., "google" not "Google")',
    'Be specific about the platform (e.g., "facebook" vs "meta")',
    'Use descriptive names for internal sources (e.g., "newsletter" vs "email")',
  ],
  medium: [
    'Use standard mediums when possible (cpc, cpm, email, social, etc.)',
    'Be consistent with naming conventions across campaigns',
    'Avoid spaces - use hyphens or underscores instead',
  ],
  campaign: [
    'Use descriptive campaign names (e.g., "spring-sale-2024")',
    'Include dates for time-sensitive campaigns',
    'Keep names short but meaningful',
    'Use consistent naming patterns across similar campaigns',
  ],
};

export function validateUtmParameter(
  value: string | null | undefined,
  paramName: string
): { isValid: boolean; error?: string } {
  if (!value) {
    return { isValid: true }; // Empty is valid (optional parameter)
  }

  // Check for spaces
  if (/\s/.test(value)) {
    return {
      isValid: false,
      error: `${paramName} cannot contain spaces. Use hyphens or underscores instead.`,
    };
  }

  // Check for valid characters
  if (!/^[a-zA-Z0-9_\-]+$/.test(value)) {
    return {
      isValid: false,
      error: `${paramName} can only contain letters, numbers, underscores, and hyphens.`,
    };
  }

  // Check max length
  if (value.length > 255) {
    return {
      isValid: false,
      error: `${paramName} must be 255 characters or less.`,
    };
  }

  return { isValid: true };
}

export function validateAllUtmParameters(params: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
}): UtmValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate each parameter
  const sourceValidation = validateUtmParameter(params.utmSource, 'Source');
  if (!sourceValidation.isValid && sourceValidation.error) {
    errors.push(sourceValidation.error);
  }

  const mediumValidation = validateUtmParameter(params.utmMedium, 'Medium');
  if (!mediumValidation.isValid && mediumValidation.error) {
    errors.push(mediumValidation.error);
  }

  const campaignValidation = validateUtmParameter(params.utmCampaign, 'Campaign');
  if (!campaignValidation.isValid && campaignValidation.error) {
    errors.push(campaignValidation.error);
  }

  const termValidation = validateUtmParameter(params.utmTerm, 'Term');
  if (!termValidation.isValid && termValidation.error) {
    errors.push(termValidation.error);
  }

  const contentValidation = validateUtmParameter(params.utmContent, 'Content');
  if (!contentValidation.isValid && contentValidation.error) {
    errors.push(contentValidation.error);
  }

  // Check for best practices
  if (params.utmSource && params.utmSource !== params.utmSource.toLowerCase()) {
    warnings.push('Consider using lowercase for utm_source for consistency.');
  }

  if (params.utmMedium && params.utmMedium !== params.utmMedium.toLowerCase()) {
    warnings.push('Consider using lowercase for utm_medium for consistency.');
  }

  // Check for missing recommended parameters
  if (params.utmSource && !params.utmMedium) {
    warnings.push('Consider adding utm_medium when utm_source is present.');
  }

  if (params.utmMedium && !params.utmSource) {
    errors.push('utm_source is required when utm_medium is present.');
  }

  if ((params.utmTerm || params.utmContent) && !params.utmCampaign) {
    warnings.push('Consider adding utm_campaign when utm_term or utm_content is present.');
  }

  // Generate suggestions based on input
  if (params.utmSource && !UTM_SOURCES.includes(params.utmSource as typeof UTM_SOURCES[number])) {
    const similarSource = findSimilarValue(params.utmSource, UTM_SOURCES);
    if (similarSource) {
      suggestions.push(`Did you mean "${similarSource}" for utm_source?`);
    }
  }

  if (params.utmMedium && !UTM_MEDIUMS.includes(params.utmMedium as typeof UTM_MEDIUMS[number])) {
    const similarMedium = findSimilarValue(params.utmMedium, UTM_MEDIUMS);
    if (similarMedium) {
      suggestions.push(`Did you mean "${similarMedium}" for utm_medium?`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

export function getSuggestionsForValue(
  value: string,
  paramType: 'source' | 'medium'
): string[] {
  const suggestions: string[] = [];
  const lowercaseValue = value.toLowerCase();

  if (paramType === 'source') {
    // Check for common misspellings or variations
    const sourceMap: Record<string, string[]> = {
      google: ['gogle', 'googl', 'goog'],
      facebook: ['fb', 'face', 'fbook', 'facbook'],
      twitter: ['twit', 'twtr', 'x'],
      linkedin: ['linked', 'linkdin', 'li'],
      instagram: ['insta', 'ig', 'instgram'],
      youtube: ['yt', 'youtub', 'utube'],
      email: ['mail', 'emai'],
      newsletter: ['news', 'newsletter', 'nl'],
    };

    for (const [correct, variations] of Object.entries(sourceMap)) {
      if (variations.some(v => lowercaseValue.includes(v))) {
        suggestions.push(correct);
      }
    }
  }

  if (paramType === 'medium') {
    // Check for common medium variations
    const mediumMap: Record<string, string[]> = {
      cpc: ['ppc', 'paid', 'ads'],
      email: ['mail', 'newsletter'],
      social: ['organic-social', 'social-media'],
      'paid-social': ['paid_social', 'social-paid'],
      referral: ['refer', 'ref'],
      affiliate: ['aff', 'affiliat'],
    };

    for (const [correct, variations] of Object.entries(mediumMap)) {
      if (variations.some(v => lowercaseValue.includes(v))) {
        suggestions.push(correct);
      }
    }
  }

  return suggestions;
}

function findSimilarValue(
  input: string,
  options: readonly string[]
): string | null {
  const lowercaseInput = input.toLowerCase();

  // Exact match (case-insensitive)
  const exactMatch = options.find(opt => opt.toLowerCase() === lowercaseInput);
  if (exactMatch) return exactMatch;

  // Partial match
  const partialMatch = options.find(opt =>
    opt.toLowerCase().includes(lowercaseInput) ||
    lowercaseInput.includes(opt.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // Levenshtein distance for close matches
  const closeMatch = options.find(opt => {
    const distance = levenshteinDistance(lowercaseInput, opt.toLowerCase());
    return distance <= 2; // Allow up to 2 character differences
  });
  if (closeMatch) return closeMatch;

  return null;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export function getInconsistentParameterWarnings(
  existingParams: Array<{
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
  }>,
  newParams: {
    utmSource?: string | null;
    utmMedium?: string | null;
    utmCampaign?: string | null;
  }
): string[] {
  const warnings: string[] = [];

  // Check for inconsistent source/medium combinations
  const existingCombos = existingParams.map(p =>
    `${p.utmSource || ''}-${p.utmMedium || ''}`
  ).filter(c => c !== '-');

  const newCombo = `${newParams.utmSource || ''}-${newParams.utmMedium || ''}`;

  // Check if new combo makes sense (regardless of existing combos)
  if (newParams.utmSource === 'google' && newParams.utmMedium === 'social') {
    warnings.push('Unusual combination: Google is typically used with "cpc" or "organic" medium.');
  }

  if (newParams.utmSource === 'facebook' && newParams.utmMedium === 'cpc') {
    warnings.push('Consider using "paid-social" medium for Facebook instead of "cpc".');
  }

  // Additional checks when there are existing combos
  if (newCombo !== '-' && existingCombos.length > 0) {
    // Could add more consistency checks here if needed
  }

  return warnings;
}