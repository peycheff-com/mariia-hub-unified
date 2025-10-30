// OPTIMIZED STORAGE AND CDN MANAGEMENT
// Efficient file uploads, image optimization, and CDN integration

import { supabase } from './client';
import { supabaseOptimized } from './client-optimized';

interface StorageConfig {
  bucket: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
  compressionQuality: number;
  generateThumbnails: boolean;
  cdnBaseUrl?: string;
  cacheControl: string;
}

interface UploadOptions {
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpeg' | 'png';
  };
}

interface StorageMetrics {
  totalUploads: number;
  totalSize: number;
  averageUploadTime: number;
  cacheHitRate: number;
  compressionRatio: number;
}

class OptimizedStorageManager {
  private static instance: OptimizedStorageManager;
  private config: Map<string, StorageConfig> = new Map();
  private uploadCache = new Map<string, { url: string; timestamp: number; ttl: number }>();
  private metrics: StorageMetrics = {
    totalUploads: 0,
    totalSize: 0,
    averageUploadTime: 0,
    cacheHitRate: 0,
    compressionRatio: 0
  };

  private constructor() {
    this.initializeBuckets();
  }

  static getInstance(): OptimizedStorageManager {
    if (!OptimizedStorageManager.instance) {
      OptimizedStorageManager.instance = new OptimizedStorageManager();
    }
    return OptimizedStorageManager.instance;
  }

  private initializeBuckets() {
    // Service images bucket configuration
    this.config.set('service-images', {
      bucket: 'service-images',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/avif'
      ],
      compressionQuality: 85,
      generateThumbnails: true,
      cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL,
      cacheControl: 'public, max-age=31536000, immutable' // 1 year cache
    });

    // User avatars bucket configuration
    this.config.set('user-avatars', {
      bucket: 'user-avatars',
      maxFileSize: 2 * 1024 * 1024, // 2MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp'
      ],
      compressionQuality: 90,
      generateThumbnails: true,
      cdnBaseUrl: import.meta.env.VITE_CDN_BASE_URL,
      cacheControl: 'public, max-age=2592000' // 30 days cache
    });

    // Documents bucket configuration
    this.config.set('documents', {
      bucket: 'documents',
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      compressionQuality: 100,
      generateThumbnails: false,
      cacheControl: 'public, max-age=2592000'
    });
  }

  // Optimized image upload with compression and transformation
  async uploadImage(
    bucketType: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<{ url: string; error?: any; metrics?: any }> {
    const config = this.config.get(bucketType);
    if (!config) {
      throw new Error(`Unknown bucket type: ${bucketType}`);
    }

    const startTime = performance.now();

    try {
      // Validate file
      this.validateFile(file, config);

      // Process and compress image
      const processedFile = await this.processImage(file, config, options);

      // Generate optimized filename
      const fileName = this.generateOptimizedFileName(file.name, options.transform);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(fileName, processedFile, {
          cacheControl: options.cacheControl || config.cacheControl,
          upsert: options.upsert || false,
          metadata: {
            originalName: file.name,
            originalSize: file.size,
            processedSize: processedFile.size,
            uploadedAt: new Date().toISOString(),
            ...options.metadata
          }
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(fileName);

      // Generate CDN URL if configured
      const finalUrl = config.cdnBaseUrl
        ? `${config.cdnBaseUrl}/${config.bucket}/${fileName}`
        : publicUrl;

      // Generate thumbnails if needed
      if (config.generateThumbnails) {
        await this.generateThumbnails(config.bucket, fileName, processedFile);
      }

      // Update metrics
      const uploadTime = performance.now() - startTime;
      this.updateMetrics(file.size, processedFile.size, uploadTime);

      // Cache the URL
      this.uploadCache.set(fileName, {
        url: finalUrl,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      });

      return {
        url: finalUrl,
        metrics: {
          originalSize: file.size,
          processedSize: processedFile.size,
          compressionRatio: file.size > 0 ? processedFile.size / file.size : 1,
          uploadTime: Math.round(uploadTime)
        }
      };

    } catch (error) {
      console.error(`[STORAGE] Upload failed for ${bucketType}:`, error);
      return { url: '', error };
    }
  }

  private validateFile(file: File, config: StorageConfig) {
    if (!config.allowedMimeTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    if (file.size > config.maxFileSize) {
      throw new Error(`File size ${file.size} exceeds maximum ${config.maxFileSize}`);
    }
  }

  private async processImage(
    file: File,
    config: StorageConfig,
    options: UploadOptions
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Cannot get canvas context'));
        return;
      }

      img.onload = () => {
        try {
          // Apply transformations
          const { width, height } = options.transform || {};
          let targetWidth = width || img.width;
          let targetHeight = height || img.height;

          // Maintain aspect ratio if only one dimension is specified
          if (width && !height) {
            targetHeight = (img.height * width) / img.width;
          } else if (height && !width) {
            targetWidth = (img.width * height) / img.height;
          }

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert to blob with quality setting
          const quality = (options.transform?.quality || config.compressionQuality) / 100;
          const format = options.transform?.format || 'image/jpeg';

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to process image'));
              }
            },
            format,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private generateOptimizedFileName(originalName: string, transform?: any): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.')[0];

    let fileName = `${baseName}_${timestamp}_${randomId}`;

    // Add transformation info to filename
    if (transform) {
      const parts = [];
      if (transform.width) parts.push(`w${transform.width}`);
      if (transform.height) parts.push(`h${transform.height}`);
      if (transform.format) parts.push(transform.format);
      if (parts.length > 0) fileName += `_${parts.join('_')}`;
    }

    return `${fileName}.${extension}`;
  }

  private async generateThumbnails(bucket: string, fileName: string, originalFile: Blob) {
    const thumbnailSizes = [
      { width: 150, height: 150, suffix: 'thumb' },
      { width: 300, height: 300, suffix: 'medium' },
      { width: 600, height: 600, suffix: 'large' }
    ];

    for (const size of thumbnailSizes) {
      try {
        const thumbnailFile = await this.processImage(
          originalFile as File,
          this.config.get('service-images')!,
          { transform: { width: size.width, height: size.height, quality: 80 } }
        );

        const thumbnailName = this.insertThumbnailSuffix(fileName, size.suffix);

        await supabase.storage
          .from(bucket)
          .upload(thumbnailName, thumbnailFile, {
            cacheControl: 'public, max-age=31536000, immutable',
            upsert: true
          });

      } catch (error) {
        console.warn(`[STORAGE] Failed to generate ${size.suffix} thumbnail:`, error);
      }
    }
  }

  private insertThumbnailSuffix(fileName: string, suffix: string): string {
    const parts = fileName.split('.');
    const extension = parts.pop();
    const baseName = parts.join('.');
    return `${baseName}_${suffix}.${extension}`;
  }

  // Optimized file retrieval with caching
  async getFileUrl(
    bucketType: string,
    fileName: string,
    options: {
      thumbnail?: string;
      bustCache?: boolean;
    } = {}
  ): Promise<string> {
    const config = this.config.get(bucketType);
    if (!config) {
      throw new Error(`Unknown bucket type: ${bucketType}`);
    }

    // Check cache first
    const cacheKey = `${bucketType}_${fileName}_${options.thumbnail || 'original'}`;
    const cached = this.uploadCache.get(cacheKey);

    if (cached && !options.bustCache && (Date.now() - cached.timestamp) < cached.ttl) {
      return cached.url;
    }

    // Generate URL
    let finalFileName = fileName;
    if (options.thumbnail) {
      finalFileName = this.insertThumbnailSuffix(fileName, options.thumbnail);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(config.bucket)
      .getPublicUrl(finalFileName);

    const finalUrl = config.cdnBaseUrl
      ? `${config.cdnBaseUrl}/${config.bucket}/${finalFileName}`
      : publicUrl;

    // Cache the URL
    this.uploadCache.set(cacheKey, {
      url: finalUrl,
      timestamp: Date.now(),
      ttl: 30 * 60 * 1000 // 30 minutes
    });

    return finalUrl;
  }

  // Batch file operations
  async uploadMultipleFiles(
    bucketType: string,
    files: File[],
    options: UploadOptions = {}
  ): Promise<{ results: any[]; errors: any[] }> {
    const results = [];
    const errors = [];

    // Process files in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];

    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(file =>
        this.uploadImage(bucketType, file, options)
          .then(result => ({ success: true, result, fileName: file.name }))
          .catch(error => ({ success: false, error, fileName: file.name }))
      );

      const chunkResults = await Promise.all(chunkPromises);

      chunkResults.forEach(({ success, result, error, fileName }) => {
        if (success) {
          results.push({ fileName, ...result });
        } else {
          errors.push({ fileName, error });
        }
      });
    }

    return { results, errors };
  }

  // Storage cleanup and optimization
  async cleanupStorage(bucketType: string, olderThanDays: number = 30): Promise<void> {
    const config = this.config.get(bucketType);
    if (!config) return;

    try {
      const { data: files } = await supabase.storage
        .from(config.bucket)
        .list('', { limit: 1000 });

      if (!files) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const filesToDelete = files.filter(file => {
        const fileDate = new Date(file.created_at);
        return fileDate < cutoffDate;
      });

      if (filesToDelete.length > 0) {
        const filePaths = filesToDelete.map(file => file.name);
        await supabase.storage
          .from(config.bucket)
          .remove(filePaths);

        console.log(`[STORAGE] Cleaned up ${filePaths.length} old files from ${bucketType}`);
      }

    } catch (error) {
      console.error(`[STORAGE] Cleanup failed for ${bucketType}:`, error);
    }
  }

  // Performance metrics
  private updateMetrics(originalSize: number, processedSize: number, uploadTime: number) {
    this.metrics.totalUploads++;
    this.metrics.totalSize += originalSize;

    // Update average upload time
    this.metrics.averageUploadTime =
      (this.metrics.averageUploadTime * (this.metrics.totalUploads - 1) + uploadTime) /
      this.metrics.totalUploads;

    // Update compression ratio
    const currentRatio = processedSize / originalSize;
    this.metrics.compressionRatio =
      (this.metrics.compressionRatio * (this.metrics.totalUploads - 1) + currentRatio) /
      this.metrics.totalUploads;
  }

  getMetrics(): StorageMetrics {
    return { ...this.metrics };
  }

  // Cache management
  clearCache() {
    this.uploadCache.clear();
  }

  // Storage health check
  async healthCheck(): Promise<{ status: string; details?: any }> {
    try {
      const startTime = performance.now();

      // Test file upload
      const testFile = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `health_check_${Date.now()}.txt`;

      const { error } = await supabase.storage
        .from('documents')
        .upload(testFileName, testFile);

      if (!error) {
        // Clean up test file
        await supabase.storage
          .from('documents')
          .remove([testFileName]);
      }

      const responseTime = performance.now() - startTime;

      return {
        status: error ? 'unhealthy' : 'healthy',
        details: {
          responseTime: Math.round(responseTime),
          cacheSize: this.uploadCache.size,
          totalUploads: this.metrics.totalUploads
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }
}

// Export singleton instance
export const storageManager = OptimizedStorageManager.getInstance();

// Convenience functions for common use cases
export const uploadServiceImage = (file: File, options?: UploadOptions) =>
  storageManager.uploadImage('service-images', file, options);

export const uploadUserAvatar = (file: File, options?: UploadOptions) =>
  storageManager.uploadImage('user-avatars', file, options);

export const getServiceImageUrl = (fileName: string, thumbnail?: string) =>
  storageManager.getFileUrl('service-images', fileName, { thumbnail });

export const getUserAvatarUrl = (fileName: string, thumbnail?: string) =>
  storageManager.getFileUrl('user-avatars', fileName, { thumbnail });

export const uploadMultipleServiceImages = (files: File[], options?: UploadOptions) =>
  storageManager.uploadMultipleFiles('service-images', files, options);

export const getStorageMetrics = () => storageManager.getMetrics();
export const cleanupOldFiles = (bucketType: string, days?: number) =>
  storageManager.cleanupStorage(bucketType, days);

// Development debugging
if (import.meta.env.DEV) {
  (window as any).storageDebug = {
    getMetrics: getStorageMetrics,
    clearCache: () => storageManager.clearCache(),
    healthCheck: () => storageManager.healthCheck()
  };
}