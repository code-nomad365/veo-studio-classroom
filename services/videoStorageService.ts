/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Video } from '@google/genai';
import { GenerateVideoParams } from '../types';

export interface StoredVideo {
  id: string;
  timestamp: string; // ISO 8601 format
  prompt: string;
  blob: Blob;
  params: GenerateVideoParams;
  videoObject?: Video;
}

const DB_NAME = 'VeoClassroomDB';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const LAST_VIDEO_KEY = 'veo_last_video_id';

// Helper to open the IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  if (!window.indexedDB) {
    return Promise.reject(new Error("Your browser doesn't support a stable version of IndexedDB."));
  }
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveVideo = async (
  params: GenerateVideoParams,
  blob: Blob,
  videoObject?: Video
): Promise<StoredVideo> => {
  const db = await openDB();
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  
  const video: StoredVideo = {
    id,
    timestamp,
    prompt: params.prompt || 'Untitled Video',
    blob,
    params,
    videoObject
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(video);

    request.onsuccess = () => {
      // Save the ID to localStorage for session persistence
      try {
        localStorage.setItem(LAST_VIDEO_KEY, id);
      } catch (e) {
        console.warn('Failed to save last video ID to localStorage', e);
      }
      resolve(video);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getAllVideos = async (): Promise<StoredVideo[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const videos = request.result as StoredVideo[];
      // Sort by timestamp descending (newest first)
      videos.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(videos);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getVideo = async (id: string): Promise<StoredVideo | undefined> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getLastVideoId = (): string | null => {
  return localStorage.getItem(LAST_VIDEO_KEY);
};

export const clearLastVideoId = (): void => {
  localStorage.removeItem(LAST_VIDEO_KEY);
};
