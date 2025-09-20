import { router } from "../trpc";
import { linkRouter } from "./link";
import { analyticsRouter } from "./analytics";
import { utmTemplateRouter } from "./utm-template";
import { workspaceRouter } from "./workspace";
import { userRouter } from "./user";
import { folderRouter } from "./folder";
import { tagRouter } from "./tag";
import { billingRouter } from "./billing";
import { domainRouter } from "./domain";

export const appRouter = router({
  link: linkRouter,
  analytics: analyticsRouter,
  utmTemplate: utmTemplateRouter,
  workspace: workspaceRouter,
  user: userRouter,
  folder: folderRouter,
  tag: tagRouter,
  billing: billingRouter,
  domain: domainRouter,
});

export type AppRouter = typeof appRouter;
