'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/trpc/client';
import type { WorkspaceRole } from '@/packages/shared/src/types/workspace';

const inviteSchema = z.object({
  emails: z.string().min(1, 'Please enter at least one email address'),
  role: z.enum(['admin', 'member']),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  currentMemberCount: number;
  maxUsers: number;
}

export function InviteMembersModal({
  open,
  onOpenChange,
  workspaceId,
  currentMemberCount,
  maxUsers,
}: InviteMembersModalProps) {
  const { toast } = useToast();
  const [emailList, setEmailList] = useState<string[]>([]);
  const utils = api.useUtils();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      emails: '',
      role: 'member',
    },
  });

  const sendInvitations = api.workspace.sendInvitations.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Invitations sent',
        description: `${data.invitations} invitation(s) sent successfully${
          data.skipped > 0 ? ` (${data.skipped} skipped - already members or invited)` : ''
        }`,
      });
      form.reset();
      setEmailList([]);
      onOpenChange(false);
      utils.workspace.getPendingInvitations.invalidate({ workspaceId });
      utils.workspace.getMembers.invalidate({ workspaceId });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send invitations',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const parseEmails = (value: string) => {
    const emails = value
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .filter((email, index, self) => self.indexOf(email) === index);

    const validEmails = emails.filter(email => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    });

    return validEmails;
  };

  const handleEmailChange = (value: string) => {
    const emails = parseEmails(value);
    setEmailList(emails);
  };

  const onSubmit = async (data: InviteFormData) => {
    const emails = parseEmails(data.emails);

    if (emails.length === 0) {
      toast({
        title: 'Invalid emails',
        description: 'Please enter valid email addresses',
        variant: 'destructive',
      });
      return;
    }

    if (currentMemberCount + emails.length > maxUsers) {
      toast({
        title: 'Member limit exceeded',
        description: `This workspace can only have ${maxUsers} members. Current: ${currentMemberCount}, Trying to add: ${emails.length}`,
        variant: 'destructive',
      });
      return;
    }

    await sendInvitations.mutateAsync({
      workspaceId,
      emails,
      role: data.role,
    });
  };

  const remainingSlots = maxUsers - currentMemberCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Send email invitations to add new members to your workspace.
            {remainingSlots > 0 ? (
              <span className="block mt-1 text-sm">
                You can invite up to {remainingSlots} more member{remainingSlots !== 1 ? 's' : ''}.
              </span>
            ) : (
              <span className="block mt-1 text-sm text-orange-600">
                Your workspace has reached its member limit.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Addresses</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="john@example.com, jane@company.com&#10;bob@team.com"
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleEmailChange(e.target.value);
                      }}
                      disabled={sendInvitations.isPending || remainingSlots === 0}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter email addresses separated by commas or new lines
                  </FormDescription>
                  <FormMessage />
                  {emailList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {emailList.map((email, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Mail className="h-3 w-3 mr-1" />
                          {email}
                        </Badge>
                      ))}
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={sendInvitations.isPending || remainingSlots === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Admins can manage workspace settings and invite other members
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sendInvitations.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendInvitations.isPending || emailList.length === 0 || remainingSlots === 0}
              >
                {sendInvitations.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send {emailList.length > 0 ? `${emailList.length} ` : ''}Invitation{emailList.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}