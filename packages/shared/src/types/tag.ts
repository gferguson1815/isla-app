export interface Tag {
  id: string
  workspaceId: string
  name: string
  color?: string | null
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface TagWithWorkspace extends Tag {
  workspace: {
    id: string
    name: string
  }
}