/**
 * Robust File and Image Storage Service
 * 
 * Supports:
 * 1. Client-side IndexedDB caching for large binaries (PDFs & High-res Photos)
 * 2. Cloud-side Firestore persistence with automatic chunking for files > 500KB
 *    (preventing Firestore 1 MiB document limit errors and LocalStorage 5MB quota errors)
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProjectPdfFile, ProjectPhoto } from '../types';

const DB_NAME = 'ai_studio_files_db';
const DB_VERSION = 1;
const STORE_FILES = 'files';
const STORE_PHOTOS = 'photos';
const CHUNK_SIZE_CHARS = 450000; // ~450 KB per chunk (safely below Firestore's 1 MiB limit)

// In-memory fallback in case IndexedDB is restricted in some iframe contexts
const memoryFilesCache = new Map<string, string>();
const memoryPhotosCache = new Map<string, string>();

let idbPromise: Promise<IDBDatabase> | null = null;

function openIdb(): Promise<IDBDatabase> {
  if (idbPromise) return idbPromise;

  idbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const timer = setTimeout(() => {
      reject(new Error('IndexedDB open timed out, using memory cache fallback'));
    }, 1500);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const dbInstance = (event.target as IDBOpenDBRequest).result;
        if (!dbInstance.objectStoreNames.contains(STORE_FILES)) {
          dbInstance.createObjectStore(STORE_FILES, { keyPath: 'fileId' });
        }
        if (!dbInstance.objectStoreNames.contains(STORE_PHOTOS)) {
          dbInstance.createObjectStore(STORE_PHOTOS, { keyPath: 'photoId' });
        }
      };

      request.onsuccess = () => {
        clearTimeout(timer);
        resolve(request.result);
      };
      request.onerror = () => {
        clearTimeout(timer);
        console.warn('Could not open IndexedDB, using memory cache fallback:', request.error);
        reject(request.error);
      };
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });

  return idbPromise;
}

// IndexedDB Helper: Put File
async function idbPutFile(fileId: string, dataUrl: string, name?: string): Promise<void> {
  memoryFilesCache.set(fileId, dataUrl);
  try {
    const dbInst = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = dbInst.transaction(STORE_FILES, 'readwrite');
      const store = tx.objectStore(STORE_FILES);
      const req = store.put({ fileId, dataUrl, name, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Memory fallback already set
  }
}

// IndexedDB Helper: Get File
async function idbGetFile(fileId: string): Promise<string | null> {
  if (memoryFilesCache.has(fileId)) {
    return memoryFilesCache.get(fileId) || null;
  }
  try {
    const dbInst = await openIdb();
    return new Promise((resolve) => {
      const tx = dbInst.transaction(STORE_FILES, 'readonly');
      const store = tx.objectStore(STORE_FILES);
      const req = store.get(fileId);
      req.onsuccess = () => {
        if (req.result?.dataUrl) {
          memoryFilesCache.set(fileId, req.result.dataUrl);
          resolve(req.result.dataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// IndexedDB Helper: Put Photo
async function idbPutPhoto(photoId: string, originalDataUrl?: string, thumbnailUrl?: string): Promise<void> {
  if (originalDataUrl) memoryPhotosCache.set(photoId, originalDataUrl);
  if (thumbnailUrl) memoryPhotosCache.set(`${photoId}_thumb`, thumbnailUrl);
  try {
    const dbInst = await openIdb();
    return new Promise((resolve, reject) => {
      const tx = dbInst.transaction(STORE_PHOTOS, 'readwrite');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.put({ photoId, originalDataUrl, thumbnailUrl, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Memory fallback already set
  }
}

// IndexedDB Helper: Get Photo Original
async function idbGetPhoto(photoId: string): Promise<string | null> {
  if (memoryPhotosCache.has(photoId)) {
    return memoryPhotosCache.get(photoId) || null;
  }
  try {
    const dbInst = await openIdb();
    return new Promise((resolve) => {
      const tx = dbInst.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.get(photoId);
      req.onsuccess = () => {
        if (req.result?.originalDataUrl) {
          memoryPhotosCache.set(photoId, req.result.originalDataUrl);
          resolve(req.result.originalDataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

// IndexedDB Helper: Get Photo Thumbnail
async function idbGetPhotoThumbnail(photoId: string): Promise<string | null> {
  if (memoryPhotosCache.has(`${photoId}_thumb`)) {
    return memoryPhotosCache.get(`${photoId}_thumb`) || null;
  }
  try {
    const dbInst = await openIdb();
    return new Promise((resolve) => {
      const tx = dbInst.transaction(STORE_PHOTOS, 'readonly');
      const store = tx.objectStore(STORE_PHOTOS);
      const req = store.get(photoId);
      req.onsuccess = () => {
        if (req.result?.thumbnailUrl) {
          memoryPhotosCache.set(`${photoId}_thumb`, req.result.thumbnailUrl);
          resolve(req.result.thumbnailUrl);
        } else if (req.result?.originalDataUrl) {
          resolve(req.result.originalDataUrl);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export const FileStorageService = {
  /**
   * Saves a PDF file:
   * 1. Caches in local IndexedDB
   * 2. Saves to Firestore 'project_files' collection with chunking if > 450KB
   * Returns the fileId
   */
  async savePdf(projectId: string, pdfFile: ProjectPdfFile): Promise<string> {
    const fileId = pdfFile.fileId || `pdf_${projectId}_${Date.now()}`;
    const dataUrl = pdfFile.dataUrl;

    if (!dataUrl) {
      return fileId;
    }

    // 1. Cache locally in IndexedDB
    await idbPutFile(fileId, dataUrl, pdfFile.name);
    await idbPutFile(`pdf_${projectId}`, dataUrl, pdfFile.name);

    // 2. Upload to Firestore
    try {
      const dataLen = dataUrl.length;
      if (dataLen <= CHUNK_SIZE_CHARS) {
        // Single document
        const fileRef = doc(db, 'project_files', fileId);
        await setDoc(fileRef, {
          fileId,
          projectId,
          name: pdfFile.name,
          size: pdfFile.size,
          isChunked: false,
          totalChunks: 1,
          data: dataUrl,
          cacheControl: pdfFile.cacheControl || 'public, max-age=31536000',
          uploadedAt: pdfFile.uploadedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Chunked upload
        const totalChunks = Math.ceil(dataLen / CHUNK_SIZE_CHARS);
        // Save manifest
        const manifestRef = doc(db, 'project_files', fileId);
        await setDoc(manifestRef, {
          fileId,
          projectId,
          name: pdfFile.name,
          size: pdfFile.size,
          isChunked: true,
          totalChunks,
          cacheControl: pdfFile.cacheControl || 'public, max-age=31536000',
          uploadedAt: pdfFile.uploadedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Save each chunk
        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = dataUrl.substring(i * CHUNK_SIZE_CHARS, (i + 1) * CHUNK_SIZE_CHARS);
          const chunkRef = doc(db, 'project_files', `${fileId}_chunk_${i}`);
          await setDoc(chunkRef, {
            fileId,
            chunkIndex: i,
            totalChunks,
            data: chunkStr,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to sync PDF to Firestore cloud, saved locally:', err);
    }

    return fileId;
  },

  /**
   * Retrieves PDF DataURL:
   * 1. Checks local IndexedDB / memory
   * 2. If not found locally, fetches and reconstructs chunks from Firestore
   */
  async getPdfDataUrl(projectId: string, fileId?: string): Promise<string | null> {
    const targetFileId = fileId || `pdf_${projectId}`;

    // 1. Check local IndexedDB
    let local = await idbGetFile(targetFileId);
    if (!local && fileId && fileId !== `pdf_${projectId}`) {
      local = await idbGetFile(`pdf_${projectId}`);
    }
    if (local) return local;

    // 2. Check Firestore
    try {
      let docRef = doc(db, 'project_files', targetFileId);
      let snap = await getDoc(docRef);
      if (!snap.exists() && fileId && fileId !== `pdf_${projectId}`) {
        docRef = doc(db, 'project_files', `pdf_${projectId}`);
        snap = await getDoc(docRef);
      }

      if (!snap.exists()) {
        return null;
      }

      const data = snap.data();
      let fullDataUrl = '';

      if (!data.isChunked) {
        fullDataUrl = data.data || '';
      } else {
        const totalChunks = data.totalChunks || 1;
        const chunkPromises: Promise<string>[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const chunkRef = doc(db, 'project_files', `${docRef.id}_chunk_${i}`);
          chunkPromises.push(
            getDoc(chunkRef).then((cSnap) => (cSnap.exists() ? cSnap.data().data || '' : ''))
          );
        }

        const chunkResults = await Promise.all(chunkPromises);
        fullDataUrl = chunkResults.join('');
      }

      if (fullDataUrl) {
        // Cache to local IndexedDB for future fast loads
        await idbPutFile(targetFileId, fullDataUrl, data.name);
        await idbPutFile(`pdf_${projectId}`, fullDataUrl, data.name);
      }

      return fullDataUrl || null;
    } catch (err) {
      console.error('Error fetching PDF from Firestore:', err);
      return null;
    }
  },

  /**
   * Saves high-resolution photos:
   * 1. Caches in local IndexedDB
   * 2. Saves full image and thumbnail to Firestore 'project_photos' collection
   */
  async savePhotos(projectId: string, photos: ProjectPhoto[]): Promise<void> {
    if (!photos || photos.length === 0) return;

    for (const photo of photos) {
      if (!photo.originalDataUrl && !photo.thumbnailUrl) continue;

      // 1. Cache in IndexedDB / Memory
      await idbPutPhoto(photo.id, photo.originalDataUrl, photo.thumbnailUrl);

      // 2. Sync to Firestore (supports chunking if > CHUNK_SIZE_CHARS)
      try {
        const origUrl = photo.originalDataUrl || '';
        const thumbUrl = photo.thumbnailUrl || '';

        if (origUrl.length <= CHUNK_SIZE_CHARS) {
          const photoRef = doc(db, 'project_photos', photo.id);
          await setDoc(photoRef, {
            id: photo.id,
            projectId,
            name: photo.name,
            originalDataUrl: origUrl,
            thumbnailUrl: thumbUrl,
            originalSize: photo.originalSize || 0,
            thumbnailSize: photo.thumbnailSize || 0,
            width: photo.width || 0,
            height: photo.height || 0,
            isChunked: false,
            totalChunks: 1,
            updatedAt: new Date().toISOString(),
          });
        } else {
          // Chunked photo upload
          const totalChunks = Math.ceil(origUrl.length / CHUNK_SIZE_CHARS);
          const manifestRef = doc(db, 'project_photos', photo.id);
          await setDoc(manifestRef, {
            id: photo.id,
            projectId,
            name: photo.name,
            thumbnailUrl: thumbUrl,
            originalSize: photo.originalSize || 0,
            thumbnailSize: photo.thumbnailSize || 0,
            width: photo.width || 0,
            height: photo.height || 0,
            isChunked: true,
            totalChunks,
            updatedAt: new Date().toISOString(),
          });

          for (let i = 0; i < totalChunks; i++) {
            const chunkStr = origUrl.substring(i * CHUNK_SIZE_CHARS, (i + 1) * CHUNK_SIZE_CHARS);
            const chunkRef = doc(db, 'project_photos', `${photo.id}_chunk_${i}`);
            await setDoc(chunkRef, {
              photoId: photo.id,
              chunkIndex: i,
              totalChunks,
              data: chunkStr,
              updatedAt: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync photo to Firestore cloud, saved locally:', err);
      }
    }
  },

  /**
   * Retrieves high-resolution photo DataURL:
   * 1. Checks local IndexedDB / memory
   * 2. If not found locally, fetches and reconstructs from Firestore 'project_photos'
   */
  async getPhotoOriginalDataUrl(photoId: string): Promise<string | null> {
    // 1. Check local IndexedDB
    const local = await idbGetPhoto(photoId);
    if (local) return local;

    // 2. Check Firestore
    try {
      const photoRef = doc(db, 'project_photos', photoId);
      const snap = await getDoc(photoRef);
      if (snap.exists()) {
        const data = snap.data();
        let fullUrl = '';

        if (!data.isChunked) {
          fullUrl = data.originalDataUrl || '';
        } else {
          const totalChunks = data.totalChunks || 1;
          const chunkPromises: Promise<string>[] = [];

          for (let i = 0; i < totalChunks; i++) {
            const chunkRef = doc(db, 'project_photos', `${photoId}_chunk_${i}`);
            chunkPromises.push(
              getDoc(chunkRef).then((cSnap) => (cSnap.exists() ? cSnap.data().data || '' : ''))
            );
          }

          const chunkResults = await Promise.all(chunkPromises);
          fullUrl = chunkResults.join('');
        }

        if (fullUrl) {
          await idbPutPhoto(photoId, fullUrl, data.thumbnailUrl);
          return fullUrl;
        }
      }
    } catch (err) {
      console.error('Error fetching photo from Firestore:', err);
    }

    return null;
  },

  /**
   * Retrieves thumbnail photo DataURL:
   * 1. Checks local IndexedDB / memory
   * 2. If not found locally, fetches from Firestore 'project_photos'
   */
  async getPhotoThumbnailUrl(photoId: string): Promise<string | null> {
    // 1. Check local IndexedDB
    const local = await idbGetPhotoThumbnail(photoId);
    if (local) return local;

    // 2. Check Firestore
    try {
      const photoRef = doc(db, 'project_photos', photoId);
      const snap = await getDoc(photoRef);
      if (snap.exists()) {
        const thumbUrl = snap.data().thumbnailUrl || snap.data().originalDataUrl || null;
        if (thumbUrl) {
          await idbPutPhoto(photoId, snap.data().originalDataUrl, thumbUrl);
          return thumbUrl;
        }
      }
    } catch (err) {
      console.error('Error fetching photo thumbnail from Firestore:', err);
    }

    return null;
  },

  /**
   * Deletes files associated with a project
   */
  async deleteProjectFiles(projectId: string, fileId?: string, photoIds?: string[]): Promise<void> {
    if (fileId) {
      try {
        await deleteDoc(doc(db, 'project_files', fileId));
      } catch (e) {
        // ignore
      }
    }
    if (photoIds && photoIds.length > 0) {
      for (const pId of photoIds) {
        try {
          await deleteDoc(doc(db, 'project_photos', pId));
        } catch (e) {
          // ignore
        }
      }
    }
  }
};
