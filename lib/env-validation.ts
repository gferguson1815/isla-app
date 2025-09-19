import { z } from 'zod';

const envSchema = z.object({
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().min(1).startsWith('sk_'),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1).startsWith('pk_'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).startsWith('whsec_'),
  
  // Stripe Price IDs
  STRIPE_PRICE_FREE: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().min(1),
  STRIPE_PRICE_GROWTH: z.string().min(1),
  
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // Upstash (optional but recommended for rate limiting)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
}

// Validate on module load in production
if (process.env.NODE_ENV === 'production') {
  validateEnv();
}