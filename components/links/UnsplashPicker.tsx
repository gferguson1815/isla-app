'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { searchUnsplashImages, getPopularImages, trackUnsplashDownload, type UnsplashImage } from '@/lib/unsplash';

interface UnsplashPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function UnsplashPicker({ isOpen, onClose, onSelect }: UnsplashPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load popular images on mount
  useEffect(() => {
    if (isOpen && images.length === 0) {
      loadPopularImages();
    }
  }, [isOpen]);

  const loadPopularImages = async () => {
    setIsLoading(true);
    try {
      const popularImages = await getPopularImages(1, 12);
      setImages(popularImages);
    } catch (error) {
      console.error('Error loading popular images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (searchQuery.trim()) {
        const searchResults = await searchUnsplashImages(searchQuery, 1, 12);
        setImages(searchResults);
      } else {
        await loadPopularImages();
      }
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = async (image: UnsplashImage) => {
    // Track download per Unsplash API guidelines
    if (image.links?.download_location) {
      await trackUnsplashDownload(image.links.download_location);
    }

    // Use the regular size for the link preview
    onSelect(image.urls.regular);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Choose from Unsplash</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for an image..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10"
            />
          </form>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {images.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleImageSelect(image)}
                  className="relative group aspect-video overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                >
                  <img
                    src={image.urls.small}
                    alt={image.alt_description || 'Unsplash image'}
                    className="w-full h-full object-cover"
                  />
                  {/* Author overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs">
                      by {image.user.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p>No images found</p>
              <p className="text-sm mt-1">Try searching for something else</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Photos provided by{' '}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              Unsplash
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}