/**
 * Utilities for client-side file compression, validation, thumbnail generation,
 * and Cache-Control metadata tagging.
 */

import { ProjectPdfFile, ProjectPhoto } from '../types';

export const MAX_PDF_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_CACHE_CONTROL = 'public, max-age=31536000';

/**
 * Format bytes into human-readable string (KB / MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Validates and converts PDF file to DataURL with size & type check
 */
export function validateAndProcessPdf(file: File): Promise<ProjectPdfFile> {
  return new Promise((resolve, reject) => {
    // 1. File Type Check
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return reject(new Error('รองรับเฉพาะไฟล์เอกสารรูปแบบ PDF เท่านั้น'));
    }

    // 2. File Size Check (Max 2MB)
    if (file.size > MAX_PDF_SIZE_BYTES) {
      const currentMb = (file.size / (1024 * 1024)).toFixed(2);
      return reject(
        new Error(`ไฟล์ PDF มีขนาด ${currentMb} MB ซึ่งเกินกำหนด (ไม่เกิน 2 MB) กรุณาบีบอัดไฟล์หรือเลือกไฟล์ใหม่`)
      );
    }

    // 3. Read File
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        size: file.size,
        dataUrl: reader.result as string,
        cacheControl: DEFAULT_CACHE_CONTROL,
        uploadedAt: new Date().toISOString(),
      });
    };
    reader.onerror = () => {
      reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์ PDF กรุณาลองใหม่อีกครั้ง'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and compresses an image file on canvas to WebP format
 */
export function compressCanvasImage(
  file: File,
  maxDimension: number,
  quality: number
): Promise<{ dataUrl: string; size: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (JPG, PNG, WebP)'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.width;
      let height = img.height;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('ไม่สามารถสร้าง Canvas Context สำหรับการบีบอัดภาพได้'));
      }

      // Smooth image rendering quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP format (fallback to jpeg if webp unsupported)
      let dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      // Calculate approximate binary size from Base64
      const base64Str = dataUrl.split(',')[1] || '';
      const approximateSize = Math.round((base64Str.length * 3) / 4);

      resolve({
        dataUrl,
        size: approximateSize,
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('ไม่สามารถโหลดรูปภาพได้ กรุณาตรวจสอบไฟล์รูปภาพอีกครั้ง'));
    };

    img.src = objectUrl;
  });
}

/**
 * Processes uploaded photo:
 * 1. Resizes original photo (Max 1080px, WebP 80% quality)
 * 2. Generates small thumbnail (Max 250px, WebP 70% quality, ~20-50KB)
 * 3. Tags with Cache-Control header metadata
 */
export async function processPhotoWithThumbnail(file: File): Promise<ProjectPhoto> {
  // Step A: Original WebP Compression (Max 1080px width/height, 80% quality)
  const original = await compressCanvasImage(file, 1080, 0.80);

  // Step B: Thumbnail Generation (Max 250px width/height, 70% quality ~ 20-50 KB)
  const thumbnail = await compressCanvasImage(file, 250, 0.70);

  const photoId = `photo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    id: photoId,
    name: file.name,
    originalDataUrl: original.dataUrl,
    originalSize: original.size,
    thumbnailUrl: thumbnail.dataUrl,
    thumbnailSize: thumbnail.size,
    width: original.width,
    height: original.height,
    cacheControl: DEFAULT_CACHE_CONTROL,
    uploadedAt: new Date().toISOString(),
  };
}
