import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createClient } from '@/lib/supabase/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';

export async function createContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  try {
    const supabase = await createClient();

    // Get the session first to check if there's a token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // If there's a session, validate it with getUser()
    let validatedSession = null;
    if (session) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        validatedSession = { ...session, user };
      } else if (error) {
        console.error('User validation error:', error);
      }
    }

    return {
      supabase,
      prisma,
      session: validatedSession,
      req,
      resHeaders,
    };
  } catch (error) {
    console.error('Context creation error:', error);
    throw error;
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  console.log('Protected procedure check:', {
    hasSession: !!ctx.session,
    hasUser: !!ctx.session?.user,
    userId: ctx.session?.user?.id
  });

  if (!ctx.session || !ctx.session.user) {
    console.error('Unauthorized access attempt - no session or user');
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
      user: ctx.session.user,
    },
  });
});