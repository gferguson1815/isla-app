import { router } from '../trpc';
import { linkRouter } from './link';
import { analyticsRouter } from './analytics';

export const appRouter = router({
  link: linkRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;