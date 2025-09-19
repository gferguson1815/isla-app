'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useDragStore } from '@/lib/stores/drag-store';
import { Checkbox } from '@/components/ui/checkbox';

interface DraggableLinkProps {
  linkId: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggableLink({
  linkId,
  children,
  className
}: DraggableLinkProps) {
  const {
    selectedLinkIds,
    toggleLinkSelection,
    setDragging
  } = useDragStore();

  const isSelected = selectedLinkIds.has(linkId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: linkId,
    data: {
      type: 'link',
      linkId,
      selectedIds: isSelected ? Array.from(selectedLinkIds) : [linkId],
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  React.useEffect(() => {
    setDragging(isDragging, isDragging ? linkId : null);
  }, [isDragging, linkId, setDragging]);

  const handleCheckboxChange = (checked: boolean) => {
    toggleLinkSelection(linkId);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'opacity-50',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div
        {...attributes}
        {...listeners}
        className="cursor-move"
      >
        {children}
      </div>
    </div>
  );
}