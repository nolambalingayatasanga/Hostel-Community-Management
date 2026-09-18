import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import API from '../api';

const UploadQueueContext = createContext(null);

export const MAX_IMAGE_SIZE = 9.8 * 1024 * 1024; // 9.8 MB
export const MAX_VIDEO_SIZE = 99 * 1024 * 1024;  // 99 MB

export function UploadQueueProvider({ children }) {
  const [queue, setQueue] = useState([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const isProcessingRef = useRef(false);
  const activeAbortControllerRef = useRef(null);
  const queueRef = useRef([]);

  // Keep queueRef in sync with state for immediate access inside async loops
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Check if uploads are active (uploading or pending)
  const isUploading = queue.some((item) => item.status === 'pending' || item.status === 'uploading');
  const activeItem = queue.find((item) => item.status === 'uploading') || null;

  // Window beforeunload protection: Prevent accidental reload or close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue = 'Uploads are currently in progress. If you leave or reload this page, your pending uploads will be stopped.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUploading]);

  /**
   * Process next pending item in the queue (Sequential Worker)
   */
  const processNextQueueItem = useCallback(async () => {
    if (isProcessingRef.current) return;

    const pendingItem = queueRef.current.find((item) => item.status === 'pending');
    if (!pendingItem) {
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    const currentId = pendingItem.id;

    // Set item to uploading
    setQueue((prev) =>
      prev.map((item) =>
        item.id === currentId ? { ...item, status: 'uploading', progress: 0, error: null } : item
      )
    );

    const abortController = new AbortController();
    activeAbortControllerRef.current = abortController;

    try {
      // Helper to attempt direct-to-Cloudflare R2 upload using presigned PUT URL
      const tryDirectCloudflareR2Upload = async (folderName = 'gallery') => {
        try {
          const isVideo = pendingItem.file.type.startsWith('video/') ||
            /\.(mp4|mov|avi|webm|mkv)$/i.test(pendingItem.file.name);
          const resourceType = isVideo ? 'video' : 'image';

          const presignedRes = await API.get('/gallery/presigned-url', {
            params: {
              filename: pendingItem.file.name,
              fileType: pendingItem.file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
              folder: folderName
            },
            signal: abortController.signal
          });

          if (presignedRes.data?.success && presignedRes.data?.data) {
            const { uploadUrl, publicUrl, key } = presignedRes.data.data;

            // Direct PUT to Cloudflare R2 presigned URL with progress tracking
            await axios.put(uploadUrl, pendingItem.file, {
              headers: {
                'Content-Type': pendingItem.file.type || (isVideo ? 'video/mp4' : 'image/jpeg')
              },
              signal: abortController.signal,
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                  setQueue((prev) =>
                    prev.map((item) => (item.id === currentId ? { ...item, progress: percent } : item))
                  );
                }
              }
            });

            return {
              url: publicUrl,
              publicId: key,
              resourceType,
              storageProvider: 'cloudflare'
            };
          }
        } catch (r2Err) {
          console.warn('Direct Cloudflare R2 upload not used or failed, falling back:', r2Err.message);
        }
        return null;
      };

      // Helper to attempt direct-to-Cloudinary upload (used for Events)
      const tryDirectCloudinaryUpload = async (folderName) => {
        try {
          const sigRes = await API.get('/gallery/upload-signature', {
            params: { folder: folderName },
            signal: abortController.signal
          });
          if (sigRes.data?.success && sigRes.data?.data) {
            const { signature, timestamp, cloudName, apiKey, folder } = sigRes.data.data;
            const cldFormData = new FormData();
            cldFormData.append('file', pendingItem.file);
            cldFormData.append('api_key', apiKey);
            cldFormData.append('timestamp', timestamp);
            cldFormData.append('signature', signature);
            cldFormData.append('folder', folder);

            const isVideo = pendingItem.file.type.startsWith('video/') ||
              /\.(mp4|mov|avi|webm|mkv)$/i.test(pendingItem.file.name);
            const resourceType = isVideo ? 'video' : 'image';

            const cldRes = await axios.post(
              `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
              cldFormData,
              {
                signal: abortController.signal,
                onUploadProgress: (progressEvent) => {
                  if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setQueue((prev) =>
                      prev.map((item) => (item.id === currentId ? { ...item, progress: percent } : item))
                    );
                  }
                }
              }
            );

            return {
              url: cldRes.data.secure_url || cldRes.data.url,
              publicId: cldRes.data.public_id,
              resourceType: cldRes.data.resource_type || resourceType,
              storageProvider: 'cloudinary'
            };
          }
        } catch (cldErr) {
          console.warn('Direct Cloudinary upload could not be used, falling back to server route:', cldErr);
        }
        return null;
      };

      let res;
      if (pendingItem.destinationType === 'gallery') {
        // 1. Try Cloudflare R2 direct upload first
        let directResult = await tryDirectCloudflareR2Upload('gallery');
        
        // 2. If R2 is not configured, fallback to direct Cloudinary upload
        if (!directResult) {
          directResult = await tryDirectCloudinaryUpload('hostel-community/gallery');
        }

        if (directResult) {
          // Bypasses Vercel payload limit entirely by sending only metadata
          res = await API.post('/gallery', {
            url: directResult.url,
            publicId: directResult.publicId,
            resourceType: directResult.resourceType,
            storageProvider: directResult.storageProvider || 'cloudflare',
            folderId: pendingItem.destinationId || undefined,
            caption: ''
          }, { signal: abortController.signal });
        } else {
          const formData = new FormData();
          if (pendingItem.destinationId) {
            formData.append('folderId', pendingItem.destinationId);
          }
          formData.append('photo', pendingItem.file);

          const endpoint = pendingItem.destinationId
            ? `/gallery?folderId=${encodeURIComponent(pendingItem.destinationId)}`
            : '/gallery';

          res = await API.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 0,
            signal: abortController.signal,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setQueue((prev) =>
                  prev.map((item) => (item.id === currentId ? { ...item, progress: percent } : item))
                );
              }
            },
          });
        }
      } else if (pendingItem.destinationType === 'event') {
        // Keep Cloudinary direct upload exclusively for Events
        const directResult = await tryDirectCloudinaryUpload(`hostel-community/events/${pendingItem.destinationId}/gallery`);
        if (directResult) {
          res = await API.post(`/events/${pendingItem.destinationId}/gallery`, {
            images: [directResult]
          }, { signal: abortController.signal });
        } else {
          const formData = new FormData();
          formData.append('galleryImages', pendingItem.file);

          const endpoint = `/events/${pendingItem.destinationId}/gallery`;

          res = await API.post(endpoint, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 0,
            signal: abortController.signal,
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setQueue((prev) =>
                  prev.map((item) => (item.id === currentId ? { ...item, progress: percent } : item))
                );
              }
            },
          });
        }
      }

      // Mark success
      setQueue((prev) =>
        prev.map((item) =>
          item.id === currentId
            ? { ...item, status: 'completed', progress: 100, result: res?.data }
            : item
        )
      );

      // Dispatch real-time custom event so Gallery & EventDetail can live-update
      window.dispatchEvent(
        new CustomEvent('app:media-uploaded', {
          detail: {
            destinationType: pendingItem.destinationType,
            destinationId: pendingItem.destinationId,
            result: res?.data,
            item: pendingItem,
          },
        })
      );
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === currentId ? { ...item, status: 'cancelled', progress: 0 } : item
          )
        );
      } else {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to upload media to Cloudinary.';
        setQueue((prev) =>
          prev.map((item) =>
            item.id === currentId
              ? { ...item, status: 'error', progress: 0, error: errorMsg }
              : item
          )
        );
        enqueueSnackbar(`Upload failed for "${pendingItem.name}": ${errorMsg}`, {
          variant: 'error',
        });
      }
    } finally {
      activeAbortControllerRef.current = null;
      isProcessingRef.current = false;

      // Check if there are more pending items
      const nextPending = queueRef.current.find(
        (item) => item.status === 'pending' && item.id !== currentId
      );

      if (nextPending) {
        // Proceed to next file immediately
        setTimeout(() => {
          processNextQueueItem();
        }, 50);
      } else {
        // All pending items in this batch completed!
        const completedCount = queueRef.current.filter((i) => i.status === 'completed').length;
        if (completedCount > 0) {
          enqueueSnackbar(`All queued media uploads have been processed!`, {
            variant: 'success',
          });
        }
      }
    }
  }, [enqueueSnackbar]);

  // Trigger worker whenever pending items are added and worker is idle
  useEffect(() => {
    const hasPending = queue.some((item) => item.status === 'pending');
    if (hasPending && !isProcessingRef.current) {
      processNextQueueItem();
    }
  }, [queue, processNextQueueItem]);

  /**
   * Add any number of files to the sequential upload queue
   */
  const enqueueFiles = useCallback(
    (files, { destinationType, destinationId = null, destinationName = '' }) => {
      const validItems = [];
      const rejectedFiles = [];

      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|ogg)$/i);
        const isImage = file.type.startsWith('image/');

        if (!isImage && !isVideo) {
          rejectedFiles.push({
            name: file.name,
            reason: 'Unsupported format. Please select image or video files.',
          });
          continue;
        }

        if (isImage && file.size > MAX_IMAGE_SIZE) {
          rejectedFiles.push({
            name: file.name,
            reason: `Image exceeds 9.8 MB limit. Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          });
          continue;
        }

        if (isVideo && file.size > MAX_VIDEO_SIZE) {
          rejectedFiles.push({
            name: file.name,
            reason: `Video exceeds 99 MB limit. Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          });
          continue;
        }

        let previewUrl = '';
        try {
          previewUrl = URL.createObjectURL(file);
        } catch {
          previewUrl = '';
        }

        validItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: isVideo ? 'video' : 'image',
          previewUrl,
          destinationType,
          destinationId,
          destinationName: destinationName || (destinationType === 'gallery' ? 'Gallery' : 'Event'),
          status: 'pending',
          progress: 0,
          error: null,
          result: null,
          createdAt: new Date(),
        });
      }

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach((rej) => {
          enqueueSnackbar(`"${rej.name}": ${rej.reason}`, { variant: 'warning' });
        });
      }

      if (validItems.length > 0) {
        setQueue((prev) => [...prev, ...validItems]);
        setIsManagerOpen(true);
        enqueueSnackbar(
          `Added ${validItems.length} media file(s) to upload queue. Uploading in background...`,
          { variant: 'info' }
        );
      }

      return {
        queuedCount: validItems.length,
        rejectedCount: rejectedFiles.length,
      };
    },
    [enqueueSnackbar]
  );

  /**
   * Cancel an item from queue (abort if currently uploading)
   */
  const cancelItem = useCallback((id) => {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target) return prev;

      if (target.status === 'uploading' && activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }

      if (target.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }

      return prev.filter((item) => item.id !== id);
    });
  }, []);

  /**
   * Retry a failed item
   */
  const retryItem = useCallback((id) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'pending', progress: 0, error: null } : item
      )
    );
  }, []);

  /**
   * Clear completed and cancelled items from queue
   */
  const clearCompleted = useCallback(() => {
    setQueue((prev) => {
      prev.forEach((item) => {
        if (item.status === 'completed' || item.status === 'cancelled') {
          if (item.previewUrl) {
            try {
              URL.revokeObjectURL(item.previewUrl);
            } catch {}
          }
        }
      });
      return prev.filter((item) => item.status === 'pending' || item.status === 'uploading' || item.status === 'error');
    });
  }, []);

  /**
   * Clear all items (including errors)
   */
  const clearAll = useCallback(() => {
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    setQueue((prev) => {
      prev.forEach((item) => {
        if (item.previewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
      });
      return [];
    });
  }, []);

  // Compute overall statistics
  const total = queue.length;
  const pending = queue.filter((i) => i.status === 'pending').length;
  const uploading = queue.filter((i) => i.status === 'uploading').length;
  const completed = queue.filter((i) => i.status === 'completed').length;
  const error = queue.filter((i) => i.status === 'error').length;

  let overallPercent = 0;
  if (total > 0) {
    const totalProgressUnits = queue.reduce((acc, item) => {
      if (item.status === 'completed') return acc + 100;
      if (item.status === 'uploading') return acc + (item.progress || 0);
      return acc;
    }, 0);
    overallPercent = Math.round(totalProgressUnits / total);
  }

  const value = {
    queue,
    enqueueFiles,
    cancelItem,
    retryItem,
    clearCompleted,
    clearAll,
    isUploading,
    activeItem,
    stats: {
      total,
      pending,
      uploading,
      completed,
      error,
      overallPercent,
    },
    isManagerOpen,
    setIsManagerOpen,
  };

  return (
    <UploadQueueContext.Provider value={value}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const context = useContext(UploadQueueContext);
  if (!context) {
    throw new Error('useUploadQueue must be used within an UploadQueueProvider');
  }
  return context;
}

export default UploadQueueContext;
