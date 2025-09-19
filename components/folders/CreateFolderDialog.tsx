'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import type { FolderWithChildren } from '@/packages/shared/src/types/folder';

const createFolderSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

type CreateFolderValues = z.infer<typeof createFolderSchema>;

interface CreateFolderDialogProps {
  workspaceId: string;
  folders?: FolderWithChildren[];
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateFolderDialog({
  workspaceId,
  folders = [],
  onSuccess,
  trigger
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = trpc.useContext();

  const form = useForm<CreateFolderValues>({
    resolver: zodResolver(createFolderSchema),
    defaultValues: {
      name: '',
      description: '',
      parent_id: undefined,
    },
  });

  const createFolder = trpc.folder.create.useMutation({
    onSuccess: () => {
      toast.success('Folder created successfully');
      utils.folder.list.invalidate({ workspace_id: workspaceId });
      form.reset();
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create folder');
    },
  });

  const onSubmit = (values: CreateFolderValues) => {
    createFolder.mutate({
      workspace_id: workspaceId,
      ...values,
    });
  };

  // Flatten folders for select options
  const getFlatFolders = (
    items: FolderWithChildren[],
    level = 0
  ): { id: string; name: string; level: number }[] => {
    return items.reduce((acc, folder) => {
      acc.push({ id: folder.id, name: folder.name, level });
      if (folder.children && folder.children.length > 0) {
        acc.push(...getFlatFolders(folder.children, level + 1));
      }
      return acc;
    }, [] as { id: string; name: string; level: number }[]);
  };

  const flatFolders = getFlatFolders(folders);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Organize your links by creating folders. You can nest folders up to 3 levels deep.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Marketing Links" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Links for marketing campaigns and promotions"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {flatFolders.length > 0 && (
              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Folder (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a parent folder" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flatFolders
                          .filter((f) => f.level < 2) // Only show folders that can have children
                          .map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {'  '.repeat(folder.level)}
                              {folder.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createFolder.isPending}>
                {createFolder.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}