import { BaseEntity } from './index';

export type WorkspacePlan = 'free' | 'pro' | 'business';
export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface Workspace extends BaseEntity {
  name: string;
  slug: string;
  domain?: string;
  plan: WorkspacePlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  maxLinks: number;
  maxClicks: number;
  maxUsers: number;
  logo_url?: string;
}

export interface WorkspaceMembership extends BaseEntity {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  joinedAt: Date;
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
  workspace?: Workspace;
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  domain?: string;
}

export interface WorkspaceSettings {
  name: string;
  description?: string;
  domain?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    favicon?: string;
  };
}

export interface WorkspaceWithMembership extends Workspace {
  membership: WorkspaceMembership;
  _count?: {
    links: number;
    members: number;
  };
}

export interface WorkspaceInvitation extends BaseEntity {
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, 'owner'>;
  token: string;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt?: Date;
  revokedAt?: Date;
  workspace?: Workspace;
  inviter?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface SendInvitationsInput {
  workspaceId: string;
  emails: string[];
  role: Exclude<WorkspaceRole, 'owner'>;
}

export interface AcceptInvitationInput {
  token: string;
}

export interface RevokeInvitationInput {
  invitationId: string;
  workspaceId: string;
}

export interface RemoveMemberInput {
  userId: string;
  workspaceId: string;
}