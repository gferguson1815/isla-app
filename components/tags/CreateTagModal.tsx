"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Backdrop } from "@/components/ui/modal-overlay";
import { ModalHeader, ModalContent, ModalContainer } from "@/components/ui/modal-header";
import { ExternalLink } from "@/components/ui/link";
import { api } from "@/utils/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  workspaceSlug?: string;
  editingTag?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

const tagColors = [
  { name: "Red", value: "#EF4444", bgClass: "bg-red-500", textClass: "text-red-600", bgLightClass: "bg-red-100" },
  { name: "Yellow", value: "#F59E0B", bgClass: "bg-yellow-500", textClass: "text-yellow-600", bgLightClass: "bg-yellow-100" },
  { name: "Green", value: "#10B981", bgClass: "bg-green-500", textClass: "text-green-600", bgLightClass: "bg-green-100" },
  { name: "Blue", value: "#3B82F6", bgClass: "bg-blue-500", textClass: "text-blue-600", bgLightClass: "bg-blue-100" },
  { name: "Purple", value: "#8B5CF6", bgClass: "bg-purple-500", textClass: "text-purple-600", bgLightClass: "bg-purple-100" },
  { name: "Brown", value: "#92400E", bgClass: "bg-amber-700", textClass: "text-amber-700", bgLightClass: "bg-amber-100" },
];

export function CreateTagModal({ isOpen, onClose, workspaceId, workspaceSlug, editingTag }: CreateTagModalProps) {
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#F59E0B"); // Default to yellow hex
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  // Prefill form when editing
  React.useEffect(() => {
    if (editingTag) {
      setTagName(editingTag.name);
      setSelectedColor(editingTag.color || "#F59E0B");
    } else {
      setTagName("");
      setSelectedColor("#F59E0B");
    }
  }, [editingTag, isOpen]);

  // API mutations for creating and updating tag
  const createTag = api.tag.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created successfully");
      onClose();
      setTagName("");
      setSelectedColor("#F59E0B"); // Reset to yellow hex
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to create tag:", error);
      if (error.message?.includes("already exists")) {
        toast.error("A tag with this name already exists");
      } else {
        toast.error("Failed to create tag");
      }
      setIsCreating(false);
    },
  });

  const updateTag = api.tag.update.useMutation({
    onSuccess: () => {
      toast.success("Tag updated successfully");
      onClose();
      setTagName("");
      setSelectedColor("#F59E0B");
      router.refresh();
    },
    onError: (error) => {
      console.error("Failed to update tag:", error);
      if (error.message?.includes("already exists")) {
        toast.error("A tag with this name already exists");
      } else {
        toast.error("Failed to update tag");
      }
      setIsCreating(false);
    },
  });

  const handleCreate = async () => {
    if (!tagName.trim()) {
      toast.error("Please enter a tag name");
      return;
    }

    setIsCreating(true);
    try {
      if (editingTag) {
        await updateTag.mutateAsync({
          id: editingTag.id,
          workspaceId,
          name: tagName.trim().toLowerCase(),
          color: selectedColor,
        });
      } else {
        await createTag.mutateAsync({
          workspaceId,
          name: tagName.trim().toLowerCase(),
          color: selectedColor,
        });
      }
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - using consistent global styling */}
      <Backdrop onClick={onClose} />

      {/* Modal - using consistent global components */}
      <ModalContainer>
        <ModalHeader onClose={onClose} />

        <ModalContent>
          <h2 className="text-xl font-semibold text-center mb-2">
            {editingTag ? "Edit tag" : "Create tag"}
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Use tags to organize your links.{" "}
            <ExternalLink href="https://isla.so/help/article/how-to-use-tags#what-is-a-tag">
              Learn more
            </ExternalLink>
          </p>

          {/* Tag Name Input */}
          <div className="mb-6">
            <label htmlFor="tagName" className="block text-sm font-medium text-gray-700 mb-2">
              Tag Name
            </label>
            <Input
              id="tagName"
              type="text"
              placeholder="New Tag"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-full h-10"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          {/* Color Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-3">
              <label className="text-sm font-medium text-gray-700">
                Tag Color
              </label>
              <InfoTooltip
                content="Choose a color to help visually distinguish this tag from others"
                side="right"
                align="center"
              />
            </div>
            <div className="flex gap-1.5">
              {tagColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                    selectedColor === color.value
                      ? `${color.bgLightClass} ${color.textClass} ring-2 ring-offset-1 ${
                          color.value === "#F59E0B" ? "ring-yellow-500" :
                          color.value === "#EF4444" ? "ring-red-500" :
                          color.value === "#10B981" ? "ring-green-500" :
                          color.value === "#3B82F6" ? "ring-blue-500" :
                          color.value === "#8B5CF6" ? "ring-purple-500" :
                          "ring-amber-700"
                        }`
                      : `bg-gray-100 text-gray-600 hover:bg-gray-200`
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreate}
            disabled={!tagName.trim() || isCreating}
            className="w-full h-10 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (editingTag ? "Updating..." : "Creating...") : (editingTag ? "Update tag" : "Create tag")}
          </Button>
        </ModalContent>
      </ModalContainer>
    </div>
  );
}