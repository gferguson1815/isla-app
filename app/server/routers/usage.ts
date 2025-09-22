import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";
import { getWorkspaceUsage } from "@/packages/api/src/services/usage-tracking";

export const usageRouter = router({
  getMetrics: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this workspace
      const membership = await ctx.prisma.workspace_memberships.findFirst({
        where: {
          user_id: ctx.user.id,
          workspace_id: input.workspaceId,
        },
      });

      if (!membership) {
        throw new Error("Unauthorized");
      }

      // Get workspace to determine reset date
      const workspace = await ctx.prisma.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          created_at: true,
          plan: true,
        }
      });

      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // Get usage metrics from the tracking service
      // This will handle the monthly reset logic internally
      const usage = await getWorkspaceUsage(input.workspaceId);

      // For now, we're using workspace creation date for reset calculation
      // In the future, this should use subscription.current_period_end for paid users
      const now = new Date();
      const startDate = new Date(workspace.created_at);

      // Calculate months since workspace creation
      let monthsSinceCreation = (now.getFullYear() - startDate.getFullYear()) * 12;
      monthsSinceCreation += now.getMonth() - startDate.getMonth();

      // If we're past the day of the month when workspace was created, we're in the next cycle
      if (now.getDate() >= startDate.getDate()) {
        monthsSinceCreation++;
      }

      return {
        links: usage.links,
        clicks: usage.clicks,
        linkLimit: usage.linkLimit,
        clickLimit: usage.clickLimit,
        plan: usage.plan,
        resetDate: workspace.created_at, // Frontend will calculate next reset from this
      };
    }),
});