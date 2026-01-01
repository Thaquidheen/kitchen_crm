/**
 * Utility functions for handling image URLs
 */

/**
 * Constructs a full image URL from a relative path
 * Handles both relative paths (/uploads/...) and absolute URLs
 * 
 * @param url - The image URL (can be relative or absolute)
 * @returns The full image URL that can be used in img src
 */
export const getImageUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  // If URL already starts with http:// or https://, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with /uploads/, prepend API base URL
  if (url.startsWith('/uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    // Remove /api/v1 from base URL if present, since uploads are served at root level
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    // Ensure baseUrl doesn't end with / and url starts with /
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}${url}`;
  }
  
  // Handle relative paths without leading slash (uploads/plan-images/...)
  if (url.startsWith('uploads/')) {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    const baseUrl = apiBaseUrl.replace('/api/v1', '');
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${url}`;
  }
  
  // Return as is for other cases
  return url;
};

