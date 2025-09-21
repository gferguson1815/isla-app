import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

export const onboardingRouter = router({
  getStatus: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          onboarding_completed: true,
          onboarding_steps: true,
          onboarding_completed_at: true,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      // Parse the onboarding steps JSON
      const steps = workspace.onboarding_steps as Record<string, boolean> || {
        workspace_created: true,
        team_invited: false,
        domain_added: false,
        first_link: false,
        plan_selected: false,
      };

      return {
        completed: workspace.onboarding_completed,
        completedAt: workspace.onboarding_completed_at,
        steps,
      };
    }),

  updateStep: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
      step: z.enum([
        "workspace_created",
        "team_invited",
        "domain_added",
        "first_link",
        "plan_selected",
      ]),
      completed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get current workspace
      const workspace = await ctx.db.workspaces.findUnique({
        where: { id: input.workspaceId },
        select: {
          onboarding_steps: true,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      // Update the specific step
      const currentSteps = (workspace.onboarding_steps as Record<string, boolean>) || {
        workspace_created: true,
        team_invited: false,
        domain_added: false,
        first_link: false,
        plan_selected: false,
      };

      currentSteps[input.step] = input.completed;

      // Check if all required steps are completed
      const requiredSteps = ["workspace_created", "plan_selected"];
      const allRequiredCompleted = requiredSteps.every(step => currentSteps[step]);

      // Update workspace
      const updated = await ctx.db.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          onboarding_steps: currentSteps,
          onboarding_completed: allRequiredCompleted,
          onboarding_completed_at: allRequiredCompleted && !workspace.onboarding_steps
            ? new Date()
            : undefined,
        },
      });

      return {
        completed: updated.onboarding_completed,
        steps: currentSteps,
      };
    }),

  completeOnboarding: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          onboarding_completed: true,
          onboarding_completed_at: new Date(),
          onboarding_steps: {
            workspace_created: true,
            team_invited: false,
            domain_added: false,
            first_link: false,
            plan_selected: true,
          },
        },
      });

      return {
        completed: updated.onboarding_completed,
        completedAt: updated.onboarding_completed_at,
      };
    }),

  resetOnboarding: protectedProcedure
    .input(z.object({
      workspaceId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db.workspaces.update({
        where: { id: input.workspaceId },
        data: {
          onboarding_completed: false,
          onboarding_completed_at: null,
          onboarding_steps: {
            workspace_created: true,
            team_invited: false,
            domain_added: false,
            first_link: false,
            plan_selected: false,
          },
        },
      });

      return {
        completed: updated.onboarding_completed,
        steps: updated.onboarding_steps,
      };
    }),
});