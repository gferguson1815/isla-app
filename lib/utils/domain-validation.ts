/**
 * Shared domain validation utilities
 * Extracted from domain router for reusability across the application
 */

export interface DNSCheckResult {
  valid: boolean;
  exists: boolean;
  status: "available" | "pointing_elsewhere" | "configured" | "invalid";
  message?: string;
  currentTarget?: string;
  records?: {
    a?: string[];
    cname?: string[];
  };
}

/**
 * Validates domain format using regex
 */
export function validateDomainFormat(domain: string): boolean {
  if (!domain || typeof domain !== "string") {
    return false;
  }

  const cleanDomain = domain.toLowerCase().trim();

  // Basic domain validation regex
  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;

  return domainRegex.test(cleanDomain);
}

/**
 * Sanitizes domain input
 */
export function sanitizeDomain(domain: string): string {
  if (!domain || typeof domain !== "string") {
    return "";
  }

  return domain.toLowerCase().trim();
}

/**
 * Checks if domain is a reserved or system domain
 */
export function isReservedDomain(domain: string): boolean {
  const reservedDomains = [
    "localhost",
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "invalid",
    "local",
  ];

  const sanitized = sanitizeDomain(domain);
  const baseDomain = sanitized.split(".").slice(-2).join(".");

  return reservedDomains.includes(sanitized) || reservedDomains.includes(baseDomain);
}

/**
 * Validates if domain meets security requirements
 */
export function validateDomainSecurity(domain: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const sanitized = sanitizeDomain(domain);

  // Check format
  if (!validateDomainFormat(sanitized)) {
    issues.push("Invalid domain format");
  }

  // Check for reserved domains
  if (isReservedDomain(sanitized)) {
    issues.push("Cannot use reserved or system domains");
  }

  // Check for suspicious patterns
  if (sanitized.includes("xn--")) {
    issues.push("Internationalized domains require additional validation");
  }

  // Check length
  if (sanitized.length > 253) {
    issues.push("Domain name too long (max 253 characters)");
  }

  // Check for excessive subdomains
  const parts = sanitized.split(".");
  if (parts.length > 5) {
    issues.push("Too many subdomain levels");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Creates a standardized error result
 */
export function createDNSErrorResult(message: string): DNSCheckResult {
  return {
    valid: false,
    exists: false,
    status: "invalid",
    message,
  };
}

/**
 * Creates a standardized success result
 */
export function createDNSSuccessResult(
  status: "available" | "pointing_elsewhere" | "configured",
  message?: string,
  records?: { a?: string[]; cname?: string[] },
  currentTarget?: string
): DNSCheckResult {
  return {
    valid: true,
    exists: false, // exists should only be true for domains in our database
    status,
    message,
    records,
    currentTarget,
  };
}
