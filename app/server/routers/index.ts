import { router } from '../trpc';
import { linkRouter } from './link';

export const appRouter = router({
  link: linkRouter,
});

export type AppRouter = typeof appRouter;