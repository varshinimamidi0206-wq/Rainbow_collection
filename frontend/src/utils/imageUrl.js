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

// Clean neutral SVG placeholder: light neutral background, subtle jewellery diamond icon, clean label
export const NEUTRAL_PLACEHOLDER_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400' fill='none'%3E%3Crect width='400' height='400' fill='%23F8F9FA'/%3E%3Cpath d='M200 130L260 190L200 250L140 190L200 130Z' stroke='%23CED4DA' stroke-width='3' stroke-linecap='round' stroke-linejoin='round' fill='%23FFFFFF'/%3E%3Cpath d='M170 190H230' stroke='%23CED4DA' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M200 160V220' stroke='%23CED4DA' stroke-width='2' stroke-linecap='round'/%3E%3Ctext x='50%25' y='295' text-anchor='middle' fill='%23868E96' font-family='system-ui, -apple-system, sans-serif' font-size='14' font-weight='600' letter-spacing='0.5'%3ERainbow Collection%3C/text%3E%3C/svg%3E";

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
  if (!img || typeof img !== 'string') {
    return NEUTRAL_PLACEHOLDER_IMAGE;
  }

  const trimmed = img.trim();
  if (!trimmed) {
    return NEUTRAL_PLACEHOLDER_IMAGE;
  }

  // Guard against any accidental local filesystem paths
  if (trimmed.startsWith('C:') || trimmed.startsWith('c:') || trimmed.startsWith('file://')) {
    return NEUTRAL_PLACEHOLDER_IMAGE;
  }

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

  // Check if string contains emoji/non-URL characters (e.g. collection icon like 💍)
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
 * Helper to handle <img> onError events by falling back to a clean neutral placeholder,
 * preventing multiple different products from ever displaying the same fallback photo.
 */
export const handleImageError = (e, categoryName = '', fallbackImage = null) => {
  const currentSrc = e.currentTarget?.src || '';

  // Log the failed URL for development diagnostics
  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[Rainbow Collection] Image failed to load: ${currentSrc}`, {
      category: categoryName
    });
  }

  // Prevent infinite recursive onError loops
  e.currentTarget.onerror = null;

  // Use neutral placeholder SVG so different products never display identical category photos
  e.currentTarget.src = fallbackImage || NEUTRAL_PLACEHOLDER_IMAGE;
};
