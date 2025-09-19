import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/app/server/routers';
import { createContext } from '@/app/server/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError: ({ error, type, path, input, ctx, req }) => {
      console.error('tRPC Error:', {
        type,
        path,
        error: error.message,
      });
    },
  });

export { handler as GET, handler as POST };