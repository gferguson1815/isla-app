import { z } from 'zod';

export const FolderSchema = z.object({
  id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  level: z.number().int().min(0).max(2),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateFolderSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

export const UpdateFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  parent_id: z.string().uuid().optional(),
});

export const DeleteFolderSchema = z.object({
  id: z.string().uuid(),
  cascade: z.boolean().default(false),
});

export const MoveFolderSchema = z.object({
  id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
});

export type Folder = z.infer<typeof FolderSchema>;
export type CreateFolder = z.infer<typeof CreateFolderSchema>;
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;
export type DeleteFolder = z.infer<typeof DeleteFolderSchema>;
export type MoveFolder = z.infer<typeof MoveFolderSchema>;

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
  _count?: {
    links: number;
  };
}