"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { useRateLimit } from "@/lib/hooks/useRateLimit";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const inviteSchema = z.object({
  invites: z.array(
    z.object({
      email: z.union([
        z.string().email("Please enter a valid email address"),
        z.literal("")
      ]),
      role: z.enum(["member", "admin"]),
    })
  ).min(1, "At least one email is required").max(10, "Maximum 10 invites at once"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteFormProps {
  workspaceId: string;
  workspaceSlug: string;
  onSuccess: () => void;
  onSkip: () => void;
}

export default function InviteForm({
  workspaceId,
  onSuccess,
  onSkip,
}: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Rate limiting: max 3 invitation batches per 5 minutes
  const rateLimit = useRateLimit({
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    onRateLimitExceeded: () => {
      const resetTime = rateLimit.getResetTime();
      const minutesUntilReset = resetTime
        ? Math.ceil((resetTime - Date.now()) / 60000)
        : 5;
      toast.error(
        `Too many invitation requests. Please wait ${minutesUntilReset} minute${
          minutesUntilReset !== 1 ? 's' : ''
        } before sending more invitations.`
      );
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      invites: [{ email: "", role: "member" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invites",
  });

  const sendInvitationsMutation = trpc.workspace.sendInvitations.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully sent ${data.invitations} invitation(s)`);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send invitations");
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    // Check rate limit before proceeding
    if (!rateLimit.checkRateLimit()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty emails
      const validInvites = data.invites.filter(invite => invite.email.trim());

      if (validInvites.length === 0) {
        toast.error("Please enter at least one email address");
        setIsSubmitting(false);
        return;
      }

      // Group by role for batch sending
      const adminEmails = validInvites
        .filter(i => i.role === "admin")
        .map(i => i.email);

      const memberEmails = validInvites
        .filter(i => i.role === "member")
        .map(i => i.email);

      // Send invitations
      const promises = [];

      if (adminEmails.length > 0) {
        promises.push(
          sendInvitationsMutation.mutateAsync({
            workspaceId,
            emails: adminEmails,
            role: "admin",
          })
        );
      }

      if (memberEmails.length > 0) {
        promises.push(
          sendInvitationsMutation.mutateAsync({
            workspaceId,
            emails: memberEmails,
            role: "member",
          })
        );
      }

      await Promise.all(promises);

    } catch (error) {
      console.error("Error sending invitations:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEmail = () => {
    if (fields.length < 10) {
      append({ email: "", role: "member" });
    } else {
      toast.error("Maximum 10 invites at once");
    }
  };

  const watchedInvites = watch("invites");
  const hasValidEmail = watchedInvites.some(invite => invite.email.trim());
  const hasErrors = !!errors.invites;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Emails</label>

        <div className="space-y-3 max-w-lg">
          {fields.map((field, index) => (
            <div key={field.id} className="relative">
              <div className="flex items-center gap-2 pr-12">
                <input
                  {...register(`invites.${index}.email`)}
                  type="email"
                  placeholder="panic@thedis.co"
                  aria-label={`Email address ${index + 1}`}
                  aria-invalid={!!errors.invites?.[index]?.email}
                  aria-describedby={errors.invites?.[index]?.email ? `email-error-${index}` : undefined}
                  className={`flex-1 px-4 py-2.5 text-sm border rounded-lg outline-none placeholder:text-gray-400 transition-colors ${
                    errors.invites?.[index]?.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-gray-400"
                  }`}
                />

                <Select
                  value={watchedInvites[index]?.role || "member"}
                  onValueChange={(value: "member" | "admin") => {
                    setValue(`invites.${index}.role`, value);
                  }}
                  aria-label={`Role for email ${index + 1}`}
                >
                  <SelectTrigger className="w-[110px] h-[42px] border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 focus:border-gray-400 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {index > 0 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove email ${index + 1}`}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}

              {errors.invites?.[index]?.email && (
                <p id={`email-error-${index}`} className="absolute -bottom-5 left-0 text-xs text-red-500 pl-4" role="alert">
                  {errors.invites[index]?.email?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {fields.length < 10 && (
          <button
            type="button"
            onClick={handleAddEmail}
            aria-label="Add another email address"
            className="flex items-center gap-2 px-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add email
          </button>
        )}
      </div>

      {errors.invites && !Array.isArray(errors.invites) && (
        <p className="text-xs text-red-500">{errors.invites.message}</p>
      )}

      <div className="pt-2 space-y-3">
        <Button
          type="submit"
          disabled={!hasValidEmail || isSubmitting || hasErrors}
          aria-label={isSubmitting ? "Sending invitations" : "Send invitations"}
          className="w-full h-10 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending invitations..." : "Continue"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            aria-label="Skip invitation step"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </form>
  );
}