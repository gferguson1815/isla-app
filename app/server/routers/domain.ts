import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { promises as dns } from "dns";
import { TRPCError } from "@trpc/server";
import {
  DNSCheckResult,
  validateDomainFormat,
  sanitizeDomain,
  validateDomainSecurity,
  createDNSErrorResult,
  createDNSSuccessResult,
} from "../../../lib/utils/domain-validation";

// Simple in-memory cache for DNS results
const dnsCache = new Map<string, { result: DNSCheckResult; timestamp: number }>();
const DNS_CACHE_TTL = 60 * 1000; // 60 seconds cache

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 requests
const RATE_LIMIT_WINDOW = 60 * 1000; // Per 1 minute

async function checkDomainDNS(domain: string): Promise<DNSCheckResult> {
  try {
    // Sanitize and validate domain
    const cleanDomain = sanitizeDomain(domain);

    // Basic format validation
    if (!validateDomainFormat(cleanDomain)) {
      return createDNSErrorResult("Please enter a valid domain name");
    }

    // Security validation
    const securityCheck = validateDomainSecurity(cleanDomain);
    if (!securityCheck.valid) {
      return createDNSErrorResult(securityCheck.issues.join(", "));
    }

    // Check for A records
    let aRecords: string[] = [];
    let cnameRecords: string[] = [];
    let hasRecords = false;

    try {
      aRecords = await dns.resolve4(cleanDomain);
      hasRecords = true;
    } catch (error) {
      // No A records found, this is okay
    }

    // Check for CNAME records
    try {
      cnameRecords = await dns.resolveCname(cleanDomain);
      hasRecords = true;
    } catch (error) {
      // No CNAME records found, this is okay
    }

    // If no records at all, domain might not exist or is not configured
    if (!hasRecords) {
      // Try to resolve the domain's nameservers to see if it exists
      try {
        await dns.resolveNs(cleanDomain.split(".").slice(-2).join("."));
        return createDNSSuccessResult("available", "Domain is available for configuration");
      } catch (error) {
        return createDNSErrorResult("Domain does not exist or cannot be resolved");
      }
    }

    // Check if it's pointing to common services
    const isPointingElsewhere = aRecords.length > 0 || cnameRecords.length > 0;

    if (isPointingElsewhere) {
      // Get the current target for display
      let currentTarget = "";
      if (cnameRecords.length > 0) {
        currentTarget = cnameRecords[0];
      } else if (aRecords.length > 0) {
        currentTarget = aRecords[0];
      }

      return createDNSSuccessResult(
        "pointing_elsewhere",
        `The domain ${cleanDomain} is currently pointing to an existing website. Only proceed if you&apos;re sure you want to use this domain for short links on Isla.`,
        { a: aRecords, cname: cnameRecords },
        currentTarget
      );
    }

    return createDNSSuccessResult("available", "Domain is ready to be configured");
  } catch (error) {
    console.error("DNS check error:", error);
    return createDNSErrorResult("Unable to verify domain. Please try again.");
  }
}

export const domainRouter = router({
  checkDNS: publicProcedure
    .input(
      z.object({
        domain: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Rate limiting check
        const clientId = (ctx.headers?.["x-forwarded-for"] as string) || "unknown";
        const now = Date.now();
        const rateLimit = rateLimitMap.get(clientId);

        if (rateLimit) {
          if (now < rateLimit.resetTime) {
            if (rateLimit.count >= RATE_LIMIT_MAX) {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "Too many DNS checks. Please wait before trying again.",
              });
            }
            rateLimit.count++;
          } else {
            // Reset rate limit window
            rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
          }
        } else {
          rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        }

        // Check cache first
        const cacheKey = input.domain.toLowerCase();
        const cached = dnsCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < DNS_CACHE_TTL) {
          // Return cached result if still fresh
          return cached.result;
        }
        // First check if domain already exists in database
        const existingDomain = await ctx.prisma.domains.findUnique({
          where: { domain: input.domain.toLowerCase() },
        });

        if (existingDomain) {
          return {
            valid: false,
            exists: true,
            status: "invalid" as const,
            message: `The domain ${input.domain.toLowerCase()} is already in use.`,
          };
        }

        // If not in database, check DNS
        const result = await checkDomainDNS(input.domain);

        // Cache the result
        dnsCache.set(cacheKey, { result, timestamp: Date.now() });

        // Clean up old cache entries periodically
        if (dnsCache.size > 100) {
          const cutoff = Date.now() - DNS_CACHE_TTL;
          for (const [key, value] of dnsCache.entries()) {
            if (value.timestamp < cutoff) {
              dnsCache.delete(key);
            }
          }
        }

        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check domain DNS",
        });
      }
    }),

  // Add a domain to the workspace
  add: protectedProcedure
    .input(
      z.object({
        domain: z.string().min(1),
        workspaceSlug: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if domain is valid
        const dnsCheck = await checkDomainDNS(input.domain);
        if (!dnsCheck.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: dnsCheck.message || "Invalid domain",
          });
        }

        // Get workspace by slug
        const workspace = await ctx.prisma.workspaces.findUnique({
          where: { slug: input.workspaceSlug },
        });

        if (!workspace) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Workspace not found",
          });
        }

        // Check if user has access to this workspace
        const membership = await ctx.prisma.workspace_memberships.findFirst({
          where: {
            workspace_id: workspace.id,
            user_id: ctx.userId,
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this workspace",
          });
        }

        // Check if domain already exists
        const existingDomain = await ctx.prisma.domains.findUnique({
          where: { domain: input.domain.toLowerCase() },
        });

        if (existingDomain) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This domain is already registered",
          });
        }

        // Generate a verification token
        const verificationToken = `isla-verify-${Math.random().toString(36).substring(2, 15)}`;

        // Create the domain record
        const domain = await ctx.prisma.domains.create({
          data: {
            domain: input.domain.toLowerCase(),
            workspace_id: workspace.id,
            created_by: ctx.userId,
            verification_token: verificationToken,
            status: "pending",
            dns_configured: false,
          },
        });

        return {
          success: true,
          domain: domain.domain,
          verificationToken,
          instructions: {
            type: "TXT",
            name: "_isla-verification",
            value: verificationToken,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Error adding domain:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add domain",
        });
      }
    }),
});
