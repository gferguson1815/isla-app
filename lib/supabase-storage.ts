import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const BUCKET_NAME = 'link-previews';

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload (from file input or blob)
 * @param workspaceId - The workspace ID for organization
 * @returns The public URL of the uploaded image
 */
export async function uploadLinkPreviewImage(
  file: File | Blob,
  workspaceId: string
): Promise<string> {
  const supabase = createClientComponentClient();

  // Generate unique filename
  const fileExt = file instanceof File
    ? file.name.split('.').pop()
    : 'jpg'; // Default to jpg for blobs
  const fileName = `${workspaceId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Upload an image from a URL to Supabase Storage
 * @param imageUrl - The URL of the image to download and upload
 * @param workspaceId - The workspace ID for organization
 * @returns The public URL of the uploaded image
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  workspaceId: string
): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Get the blob
    const blob = await response.blob();

    // Upload to storage
    return await uploadLinkPreviewImage(blob, workspaceId);
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    // If upload fails, return the original URL
    return imageUrl;
  }
}

/**
 * Delete an image from Supabase Storage
 * @param imageUrl - The public URL of the image to delete
 */
export async function deleteLinkPreviewImage(imageUrl: string): Promise<void> {
  const supabase = createClientComponentClient();

  // Extract file path from URL
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split('/');
  const bucketIndex = pathParts.indexOf(BUCKET_NAME);

  if (bucketIndex === -1) {
    // Not a storage URL, nothing to delete
    return;
  }

  const filePath = pathParts.slice(bucketIndex + 1).join('/');

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting image:', error);
  }
}

/**
 * Check if a URL is from Supabase Storage
 * @param url - The URL to check
 * @returns True if the URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase') && url.includes('/storage/');
}