import { transliterate } from 'transliterate';

interface SlugOptions {
  lowercase?: boolean;
  separator?: string;
  maxLength?: number;
  preserveCase?: boolean;
  lang?: string;
}

/**
 * Generate URL-friendly slugs from text
 */
export const generateSlug = (text: string, options: SlugOptions = {}): string => {
  const {
    lowercase = true,
    separator = '-',
    maxLength = 100,
    preserveCase = false,
    lang = 'en'
  } = options;

  // Handle different languages
  let processedText = text;

  // For Polish text, handle special characters directly
  if (lang === 'pl') {
    processedText = processedText
      .replace(/[ąĄ]/g, 'a')
      .replace(/[ćĆ]/g, 'c')
      .replace(/[ęĘ]/g, 'e')
      .replace(/[łŁ]/g, 'l')
      .replace(/[ńŃ]/g, 'n')
      .replace(/[óÓ]/g, 'o')
      .replace(/[śŚ]/g, 's')
      .replace(/[źŻ]/g, 'z')
      .replace(/[żŹ]/g, 'z');
  } else {
    // For other languages, use transliteration
    processedText = transliterate(processedText, { unknown: ' ' });
  }

  // Convert to lowercase if not preserving case
  if (lowercase && !preserveCase) {
    processedText = processedText.toLowerCase();
  }

  // Remove HTML tags and entities
  processedText = processedText
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, '');

  // Replace spaces and special characters with separator
  processedText = processedText
    .replace(/[^\w\s-]/g, '') // Remove special characters except letters, numbers, underscore, hyphen
    .replace(/[\s_]+/g, separator) // Replace spaces and underscores with separator
    .replace(/-{2,}/g, separator) // Replace multiple separators with single
    .replace(/^[-_]+|[-_]+$/g, ''); // Remove leading/trailing separators

  // Trim to max length
  if (maxLength > 0) {
    processedText = processedText.substring(0, maxLength);
    // Avoid cutting off in the middle of a word
    const lastSeparator = processedText.lastIndexOf(separator);
    if (lastSeparator > maxLength * 0.8) {
      processedText = processedText.substring(0, lastSeparator);
    }
  }

  // Remove trailing separator
  processedText = processedText.replace(new RegExp(`${separator}$`), '');

  return processedText || 'untitled';
};

/**
 * Generate localized slugs for multiple languages
 */
export const generateLocalizedSlugs = (
  translations: Record<string, string>,
  baseSlug?: string
): Record<string, string> => {
  const slugs: Record<string, string> = {};

  Object.entries(translations).forEach(([lang, text]) => {
    if (text && text.trim()) {
      slugs[lang] = generateSlug(text, { lang });
    }
  });

  // Use base slug for missing translations
  if (baseSlug) {
    Object.keys(translations).forEach(lang => {
      if (!slugs[lang]) {
        slugs[lang] = baseSlug;
      }
    });
  }

  return slugs;
};

/**
 * Create a unique slug by adding numeric suffix if needed
 */
export const createUniqueSlug = async (
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts = 100
): Promise<string> => {
  let slug = baseSlug;
  let suffix = 1;

  while (suffix <= maxAttempts) {
    const exists = await checkExists(slug);
    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  throw new Error(`Could not generate unique slug after ${maxAttempts} attempts`);
};

/**
 * Parse slug to extract base and suffix
 */
export const parseSlug = (slug: string): { base: string; suffix?: number } => {
  const match = slug.match(/^(.*?)-(\d+)$/);

  if (match) {
    return {
      base: match[1],
      suffix: parseInt(match[2], 10)
    };
  }

  return { base: slug };
};

/**
 * Generate slugs for service categories
 */
export const generateCategorySlug = (category: string, subcategory?: string): string => {
  const base = generateSlug(category);

  if (!subcategory) {
    return base;
  }

  const sub = generateSlug(subcategory);
  return `${base}/${sub}`;
};

/**
 * Validate slug format
 */
export const validateSlug = (slug: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!slug || slug.trim().length === 0) {
    errors.push('Slug cannot be empty');
  }

  if (slug.length > 100) {
    errors.push('Slug cannot exceed 100 characters');
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push('Slug cannot start or end with a hyphen');
  }

  if (slug.includes('--')) {
    errors.push('Slug cannot contain consecutive hyphens');
  }

  // Reserved slugs
  const reserved = [
    'api', 'admin', 'www', 'mail', 'ftp', 'localhost',
    'static', 'assets', 'images', 'css', 'js', 'favicon.ico',
    'robots.txt', 'sitemap.xml', 'sitemap', '404', '500'
  ];

  if (reserved.includes(slug.toLowerCase())) {
    errors.push(`Slug "${slug}" is reserved`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate SEO-friendly URL path
 */
export const generateSeoPath = (
  basePath: string,
  slug: string,
  locale?: string,
  params?: Record<string, string>
): string => {
  const parts: string[] = [];

  // Add locale prefix if provided and not default
  if (locale && locale !== 'en') {
    parts.push(locale);
  }

  // Add base path
  if (basePath && basePath !== '/') {
    parts.push(basePath.replace(/^\//, ''));
  }

  // Add slug
  parts.push(slug);

  let path = '/' + parts.join('/');

  // Add query parameters
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      path += '?' + queryString;
    }
  }

  return path;
};