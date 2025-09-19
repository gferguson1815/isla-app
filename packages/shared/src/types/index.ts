export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export * from './utm';
export * from './workspace';
export * from './folder';
export * from './tag';