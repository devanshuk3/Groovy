import { API_ENDPOINTS } from './config';

/**
 * Search for videos on YouTube
 * @param {string} query - The search query
 * @returns {Promise<Array>} Array of video objects with {id, title, url, duration, uploader, thumbnail}
 */
export const searchYouTube = async (query) => {
  if (!query.trim()) {
    throw new Error('Search query cannot be empty');
  }

  try {
    console.log('🔍 Searching for:', query);
    
    const response = await fetch(API_ENDPOINTS.SEARCH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim() }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Search response received with', data.results?.length || 0, 'results');
    
    if (data.success && Array.isArray(data.results)) {
      return data.results;
    } else if (data.success) {
      return [];
    } else {
      throw new Error(data.message || 'Search failed for unknown reason');
    }
  } catch (err) {
    console.error('❌ Search error:', err.message);
    throw err;
  }
};

/**
 * Get audio URL for a YouTube video
 * @param {string} url - The YouTube video URL
 * @returns {Promise<string>} The audio download URL
 */
export const fetchAudioURL = async (url) => {
  if (!url || !url.trim()) {
    throw new Error('Video URL cannot be empty');
  }

  try {
    console.log('🎵 Fetching audio URL for:', url);
    
    const response = await fetch(API_ENDPOINTS.GET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Audio URL received');
    
    if (data.success && data.result) {
      return data.result;
    } else {
      throw new Error(data.message || 'Failed to get audio URL');
    }
  } catch (err) {
    console.error('❌ Audio fetch error:', err.message);
    throw err;
  }
};

/**
 * Check if backend is healthy
 * @returns {Promise<boolean>} True if backend is running
 */
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(API_ENDPOINTS.HEALTH);
    return response.ok;
  } catch {
    return false;
  }
};
