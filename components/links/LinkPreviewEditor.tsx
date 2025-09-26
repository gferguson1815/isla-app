'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Link, Crown, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UnsplashIcon } from '@/components/ui/social-icons';
import { UnsplashPicker } from '@/components/links/UnsplashPicker';
import { uploadLinkPreviewImage, uploadImageFromUrl } from '@/lib/supabase-storage';
import { useFeatureGate } from '@/hooks/useFeatureGate';

interface LinkPreviewEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    image?: string;
    title?: string;
    description?: string;
  }) => void;
  onPreviewUpdate?: (data: {
    image?: string;
    title?: string;
    description?: string;
  }) => void;
  currentData?: {
    image?: string;
    title?: string;
    description?: string;
  };
  workspaceId: string;
}

export function LinkPreviewEditor({
  isOpen,
  onClose,
  onSave,
  onPreviewUpdate,
  currentData = {},
  workspaceId
}: LinkPreviewEditorProps) {
  const [image, setImage] = useState(currentData.image || '');
  const [title, setTitle] = useState(currentData.title || '');
  const [description, setDescription] = useState(currentData.description || '');
  const [isDragging, setIsDragging] = useState(false);
  const [showUnsplashPicker, setShowUnsplashPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Check if link preview customization is enabled
  const { checkFeature } = useFeatureGate(workspaceId);
  const feature = checkFeature('link_preview_customization');

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textareas on mount and when values change
  useEffect(() => {
    const adjustHeight = (element: HTMLTextAreaElement | null) => {
      if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      }
    };

    adjustHeight(titleRef.current);
    adjustHeight(descriptionRef.current);
  }, [title, description, isOpen]);

  // Update preview in real-time
  useEffect(() => {
    if (onPreviewUpdate && isOpen) {
      onPreviewUpdate({ image, title, description });
    }
  }, [image, title, description, isOpen, onPreviewUpdate]);

  const handleReset = () => {
    setImage('');
    setTitle('');
    setDescription('');
    // Update preview immediately
    if (onPreviewUpdate) {
      onPreviewUpdate({ image: '', title: '', description: '' });
    }
  };

  const handleSave = async () => {
    // Only upload to storage when saving
    let finalImageUrl = image;

    if (image && !image.startsWith('https://supabase')) {
      setIsUploading(true);
      try {
        // Upload the image to Supabase Storage if it's not already there
        if (image.startsWith('data:')) {
          // It's a data URL from direct upload, convert to blob and upload
          const response = await fetch(image);
          const blob = await response.blob();
          finalImageUrl = await uploadLinkPreviewImage(blob, workspaceId);
        } else {
          // It's an external URL (from Unsplash or URL paste), upload it
          finalImageUrl = await uploadImageFromUrl(image, workspaceId);
        }
      } catch (error) {
        console.error('Error uploading image on save:', error);
        // Keep the original URL if upload fails
        finalImageUrl = image;
      } finally {
        setIsUploading(false);
      }
    }

    onSave({ image: finalImageUrl, title, description });
    onClose();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Convert to data URL for preview, upload will happen on save
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Convert to data URL for preview, upload will happen on save
        const reader = new FileReader();
        reader.onload = (event) => {
          setImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Link Preview</h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full border border-gray-200">
              <Crown className="h-3 w-3" />
              PRO
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload Section */}
          <div>
            <div className={`flex items-center justify-between ${image ? 'mb-4' : 'mb-2'}`}>
              <Label className="text-sm font-medium text-gray-900">
                Image
              </Label>
              {image ? (
                <button
                  onClick={() => setImage('')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Remove
                </button>
              ) : (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => {
                      const url = prompt('Paste a URL to an image:');
                      if (url) {
                        // Just set the URL, don't upload yet
                        setImage(url);
                      }
                    }}
                  >
                    <Link className="h-4 w-4 text-gray-500" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    <div className="bg-white text-sm text-gray-700 rounded-lg py-2 px-3 whitespace-nowrap border border-gray-200 shadow-lg">
                      Paste a URL to an image
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <svg className="w-2 h-1" viewBox="0 0 8 4">
                          <path d="M4 4L0 0h8z" fill="white" />
                          <path d="M4 3L0.5 0h7L4 3z" fill="#e5e7eb" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative group">
                  <button
                    type="button"
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={() => setShowUnsplashPicker(true)}
                  >
                    <UnsplashIcon className="h-4 w-4 text-gray-500" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                    <div className="bg-white text-sm text-gray-700 rounded-lg py-2 px-3 whitespace-nowrap border border-gray-200 shadow-lg">
                      Choose an image from Unsplash
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <svg className="w-2 h-1" viewBox="0 0 8 4">
                          <path d="M4 4L0 0h8z" fill="white" />
                          <path d="M4 3L0.5 0h7L4 3z" fill="#e5e7eb" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {image ? (
              <div className="relative rounded-lg overflow-hidden">
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}
                <img
                  src={image}
                  alt="Preview"
                  className="w-full object-cover"
                  style={{ aspectRatio: '1200 / 630' }}
                />
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-white'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />

                <label htmlFor="image-upload" className="cursor-pointer">
                  <svg className="h-8 w-8 text-gray-400 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p className="text-sm text-gray-600">
                    Drag and drop or click to upload.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended: 1200 x 630 pixels
                  </p>
                </label>
              </div>
            )}
          </div>

          {/* Title Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-900">
                Title
              </Label>
              <span className="text-xs text-gray-500">
                {title.length}/120
              </span>
            </div>
            <Textarea
              ref={titleRef}
              id="title"
              placeholder="Add a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              maxLength={120}
              className="resize-none overflow-hidden min-h-[40px] py-2"
              style={{
                height: 'auto',
                minHeight: '40px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              rows={1}
            />
          </div>

          {/* Description Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-900">
                Description
              </Label>
              <span className="text-xs text-gray-500">
                {description.length}/240
              </span>
            </div>
            <Textarea
              ref={descriptionRef}
              id="description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 240))}
              maxLength={240}
              className="resize-none overflow-hidden min-h-[60px] py-2"
              style={{
                height: 'auto',
                minHeight: '60px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="text-gray-600 hover:text-gray-900"
            >
              Reset to default
            </Button>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Cancel
              </Button>
              <div className="relative">
                <Button
                  onClick={feature.enabled ? handleSave : undefined}
                  disabled={!feature.enabled || isUploading || feature.loading}
                  className="px-6 bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseEnter={() => !feature.enabled && setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {isUploading ? 'Saving...' : 'Save changes'}
                </Button>

                {/* Tooltip for disabled state */}
                {showTooltip && !feature.enabled && (
                  <div className="absolute bottom-full right-0 mb-2 z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 w-64">
                      <p className="text-sm text-gray-700 mb-2">
                        {feature.message || 'Custom link previews require a Pro plan'}
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-black text-white hover:bg-gray-800"
                        onClick={() => {
                          window.location.href = '/billing/upgrade';
                        }}
                      >
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsplash Picker Modal */}
      <UnsplashPicker
        isOpen={showUnsplashPicker}
        onClose={() => setShowUnsplashPicker(false)}
        onSelect={(imageUrl) => {
          // Just set the URL, don't upload yet
          setImage(imageUrl);
        }}
      />
    </div>
  );
}