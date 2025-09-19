import { router } from '../trpc';
import { linkRouter } from './link';
import { analyticsRouter } from './analytics';
import { utmTemplateRouter } from './utm-template';

export const appRouter = router({
  link: linkRouter,
  analytics: analyticsRouter,
  utmTemplate: utmTemplateRouter,
});

export type AppRouter = typeof appRouter;