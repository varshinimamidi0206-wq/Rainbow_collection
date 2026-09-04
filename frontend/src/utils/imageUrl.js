/**
 * Utility for handling API base URLs and image URLs reliably
 * across local development and production environments (Vercel + Render).
 */

export const CATEGORY_DEFAULT_IMAGES = {
  'bangles': 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500',
  'earrings': 'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500',
  'short chains': 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500',
  'long chains': 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500',
  'cosmetics': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500',
  'hair accessories': 'https://images.unsplash.com/photo-1606156137806-d345a4e037f3?w=500',
  'german silver': 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500',
  '1 gm jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
  '1gm jewellery': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500',
  'rental jewellery': 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500'
};

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500';

/**
 * Returns normalized apiBaseUrl (ending in /api) and backendBaseUrl (without /api)
 */
export const getBaseUrls = () => {
  let envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (!envUrl) {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      envUrl = 'http://localhost:5000/api';
    } else if (/^[0-9.]+$/.test(hostname)) {
      envUrl = `http://${hostname}:5000/api`;
    } else {
      // Deployed without explicit VITE_API_URL: default to relative /api or Render URL
      envUrl = 'https://rainbow-jewellers-backend.onrender.com/api';
    }
  }

  // Remove trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');

  let apiBaseUrl = envUrl;
  let backendBaseUrl = envUrl;

  if (envUrl.endsWith('/api')) {
    backendBaseUrl = envUrl.slice(0, -4).replace(/\/+$/, '');
  } else {
    apiBaseUrl = `${envUrl}/api`;
    backendBaseUrl = envUrl;
  }

  return { apiBaseUrl, backendBaseUrl };
};

/**
 * Resolves any image URL (relative /uploads, external http/https, emoji, or missing)
 * into a valid image URL for rendering in production.
 *
 * @param {string} img - The image field value from the database/product
 * @param {string} [categoryName] - Optional category name to find fallback photo if img is emoji or missing
 * @returns {string} Fully resolved image URL, or empty string if it should show emoji fallback
 */
export const resolveImageUrl = (img, categoryName = '') => {
  const normCategory = (categoryName || '').toLowerCase().trim();
  const categoryDefault = CATEGORY_DEFAULT_IMAGES[normCategory] || null;

  if (!img || typeof img !== 'string') {
    return categoryDefault || '';
  }

  const trimmed = img.trim();

  // If already absolute URL or base64 data
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // If it's a relative path on the backend (e.g. /uploads/... or uploads/...)
  if (trimmed.startsWith('/uploads') || trimmed.startsWith('uploads') || trimmed.startsWith('/images') || trimmed.startsWith('images')) {
    const { backendBaseUrl } = getBaseUrls();
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${backendBaseUrl}${cleanPath}`;
  }

  // If it's an emoji or other placeholder text, check if we have a real photo for this category
  if (categoryDefault) {
    return categoryDefault;
  }

  // Check if string contains emoji/non-URL characters
  if (!trimmed.includes('.') && !trimmed.includes('/')) {
    return ''; // Signals caller that this is purely an emoji/icon
  }

  // Fallback for other relative paths
  if (trimmed.startsWith('/')) {
    const { backendBaseUrl } = getBaseUrls();
    return `${backendBaseUrl}${trimmed}`;
  }

  return trimmed;
};

/**
 * Helper to handle <img> onError events by falling back to category photo or general fallback
 */
export const handleImageError = (e, categoryName = '', fallbackImage = DEFAULT_FALLBACK_IMAGE) => {
  const normCategory = (categoryName || '').toLowerCase().trim();
  const categoryDefault = CATEGORY_DEFAULT_IMAGES[normCategory];
  const currentSrc = e.currentTarget.src;

  if (categoryDefault && currentSrc !== categoryDefault) {
    e.currentTarget.src = categoryDefault;
  } else if (fallbackImage && currentSrc !== fallbackImage) {
    e.currentTarget.src = fallbackImage;
  }
};
