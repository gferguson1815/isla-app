import { createApi } from 'unsplash-js';

// Types for Unsplash API responses
export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    download: string;
    download_location: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
    links: {
      html: string;
    };
  };
}

// Initialize Unsplash client only if access key is provided
const unsplashClient = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
  ? createApi({
      accessKey: process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
    })
  : null;

// Fallback mock data for development/demo
const mockImages: UnsplashImage[] = [
  {
    id: '1',
    urls: {
      raw: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      full: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      regular: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080',
      small: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200',
    },
    links: {
      download: 'https://unsplash.com/photos/1/download',
      download_location: 'https://api.unsplash.com/photos/1/download',
    },
    alt_description: 'Mountain landscape',
    description: 'Beautiful mountain landscape',
    user: {
      name: 'Samuel Ferrara',
      username: 'samferrara',
      links: {
        html: 'https://unsplash.com/@samferrara',
      },
    },
  },
  {
    id: '2',
    urls: {
      raw: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
      full: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
      regular: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080',
      small: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
      thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=200',
    },
    links: {
      download: 'https://unsplash.com/photos/2/download',
      download_location: 'https://api.unsplash.com/photos/2/download',
    },
    alt_description: 'Foggy mountains',
    description: 'Mountains in fog',
    user: {
      name: 'Girish Dalvi',
      username: 'girishdalvi',
      links: {
        html: 'https://unsplash.com/@girishdalvi',
      },
    },
  },
  {
    id: '3',
    urls: {
      raw: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      full: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
      regular: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1080',
      small: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
      thumb: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200',
    },
    links: {
      download: 'https://unsplash.com/photos/3/download',
      download_location: 'https://api.unsplash.com/photos/3/download',
    },
    alt_description: 'Nature landscape',
    description: 'Beautiful nature',
    user: {
      name: 'Abigail Clarke',
      username: 'abigailclarke',
      links: {
        html: 'https://unsplash.com/@abigailclarke',
      },
    },
  },
  {
    id: '4',
    urls: {
      raw: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff',
      full: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff',
      regular: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1080',
      small: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
      thumb: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=200',
    },
    links: {
      download: 'https://unsplash.com/photos/4/download',
      download_location: 'https://api.unsplash.com/photos/4/download',
    },
    alt_description: 'Highway landscape',
    description: 'Open highway',
    user: {
      name: 'Al Ishrak Sunny',
      username: 'alishraksunny',
      links: {
        html: 'https://unsplash.com/@alishraksunny',
      },
    },
  },
  {
    id: '5',
    urls: {
      raw: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
      full: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e',
      regular: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1080',
      small: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
      thumb: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=200',
    },
    links: {
      download: 'https://unsplash.com/photos/5/download',
      download_location: 'https://api.unsplash.com/photos/5/download',
    },
    alt_description: 'Sunset landscape',
    description: 'Beautiful sunset',
    user: {
      name: 'Pontus Jerander',
      username: 'pontusjerander',
      links: {
        html: 'https://unsplash.com/@pontusjerander',
      },
    },
  },
];

export async function searchUnsplashImages(query: string, page = 1, perPage = 10): Promise<UnsplashImage[]> {
  // If no API key, return mock data
  if (!unsplashClient) {
    console.log('Unsplash API key not configured. Using mock data.');

    // Filter mock data based on query if provided
    if (query.trim()) {
      return mockImages.filter(img =>
        img.alt_description?.toLowerCase().includes(query.toLowerCase()) ||
        img.description?.toLowerCase().includes(query.toLowerCase())
      );
    }
    return mockImages;
  }

  try {
    const result = await unsplashClient.search.getPhotos({
      query: query || 'landscape',
      page,
      perPage,
      orientation: 'landscape', // Only get landscape orientation images for better link preview display
    });

    if (result.errors) {
      console.error('Unsplash API error:', result.errors);
      return mockImages;
    }

    return result.response?.results as UnsplashImage[];
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    // Fallback to mock data on error
    return mockImages;
  }
}

export async function getPopularImages(page = 1, perPage = 10): Promise<UnsplashImage[]> {
  // If no API key, return mock data
  if (!unsplashClient) {
    console.log('Unsplash API key not configured. Using mock data.');
    return mockImages;
  }

  try {
    // Since the photos.list doesn't support orientation filter directly,
    // we'll search for popular landscape photos instead
    const result = await unsplashClient.search.getPhotos({
      query: 'nature landscape',
      page,
      perPage,
      orderBy: 'relevant',
      orientation: 'landscape', // Only get landscape orientation images
    });

    if (result.errors) {
      console.error('Unsplash API error:', result.errors);
      return mockImages;
    }

    return result.response?.results as UnsplashImage[];
  } catch (error) {
    console.error('Error fetching popular Unsplash images:', error);
    // Fallback to mock data on error
    return mockImages;
  }
}

// Track download for Unsplash API guidelines compliance
export async function trackUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!unsplashClient || !downloadLocation) return;

  try {
    // This is required by Unsplash API guidelines
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY}`,
      },
    });
  } catch (error) {
    console.error('Error tracking Unsplash download:', error);
  }
}