import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import API from '../api';

const UploadQueueContext = createContext(null);

// No media size limits for Gallery uploads
export const MAX_IMAGE_SIZE = Infinity;
export const MAX_VIDEO_SIZE = Infinity;

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
      // S3 / MinIO Multipart Chunked Upload (10MB chunks) to completely bypass Cloudflare 100MB body limits
      const tryMultipartMinioUpload = async (folderName = 'uploads') => {
        const file = pendingItem.file;
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks (< 100MB Cloudflare limit)
        const totalParts = Math.ceil(file.size / CHUNK_SIZE);
        const isVideo =
          file.type.startsWith('video/') ||
          /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
        const resourceType = isVideo ? 'video' : 'image';

        let uploadId = null;
        let fileKey = null;

        try {
          // 1. Initiate multipart upload with MinIO
          const initRes = await API.post(
            '/gallery/multipart/initiate',
            {
              filename: file.name,
              fileType: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream'),
              folder: folderName,
            },
            { signal: abortController.signal }
          );

          if (!initRes.data?.success || !initRes.data?.data) {
            throw new Error('Failed to initiate multipart upload');
          }

          uploadId = initRes.data.data.uploadId;
          fileKey = initRes.data.data.key;

          // 2. Request presigned URLs for all parts
          const partsRes = await API.post(
            '/gallery/multipart/presigned-parts',
            {
              uploadId,
              key: fileKey,
              totalParts,
            },
            { signal: abortController.signal }
          );

          if (!partsRes.data?.success || !partsRes.data?.data?.parts) {
            throw new Error('Failed to get presigned part URLs');
          }

          const presignedParts = partsRes.data.data.parts;
          const completedParts = [];
          const partProgress = new Array(totalParts).fill(0);

          // 3. Upload parts concurrently (3 parallel streams for max performance)
          const concurrency = 3;
          let currentPartIndex = 0;

          const uploadNextPart = async () => {
            while (currentPartIndex < presignedParts.length) {
              const partIdx = currentPartIndex++;
              const partInfo = presignedParts[partIdx];
              const start = (partInfo.partNumber - 1) * CHUNK_SIZE;
              const end = Math.min(start + CHUNK_SIZE, file.size);
              const chunkBlob = file.slice(start, end);

              const partPutRes = await axios.put(partInfo.presignedUrl, chunkBlob, {
                headers: {
                  'Content-Type': 'application/octet-stream',
                },
                signal: abortController.signal,
                onUploadProgress: (progressEvent) => {
                  partProgress[partIdx] = progressEvent.loaded;
                  const totalLoaded = partProgress.reduce((acc, bytes) => acc + bytes, 0);
                  const percent = Math.min(99, Math.round((totalLoaded * 100) / file.size));
                  setQueue((prev) =>
                    prev.map((item) => (item.id === currentId ? { ...item, progress: percent } : item))
                  );
                },
              });

              let rawEtag =
                partPutRes.headers?.etag ||
                partPutRes.headers?.['ETag'] ||
                partPutRes.headers?.ETag;
              if (rawEtag) {
                rawEtag = rawEtag.replace(/^"|"$/g, '');
              }
              if (!rawEtag) {
                throw new Error(`Part ${partInfo.partNumber} missing ETag`);
              }

              completedParts.push({
                PartNumber: partInfo.partNumber,
                ETag: `"${rawEtag}"`,
              });
            }
          };

          const workers = [];
          for (let i = 0; i < Math.min(concurrency, totalParts); i++) {
            workers.push(uploadNextPart());
          }
          await Promise.all(workers);

          // 4. Complete multipart upload
          const completeRes = await API.post(
            '/gallery/multipart/complete',
            {
              uploadId,
              key: fileKey,
              parts: completedParts,
            },
            { signal: abortController.signal }
          );

          if (!completeRes.data?.success || !completeRes.data?.data) {
            throw new Error('Failed to complete multipart upload');
          }

          return {
            url: completeRes.data.data.url,
            publicId: completeRes.data.data.key,
            resourceType,
            storageProvider: 's3',
          };
        } catch (multipartErr) {
          if (uploadId && fileKey) {
            API.post('/gallery/multipart/abort', { uploadId, key: fileKey }).catch(() => {});
          }
          console.warn('Multipart MinIO upload error:', multipartErr.message);
          return null;
        }
      };

      // Helper to attempt direct-to-MinIO S3 upload (single PUT for <= 70MB, multipart for > 70MB)
      const tryDirectMinioUpload = async (folderName = 'uploads') => {
        const file = pendingItem.file;

        // If file is > 70MB, directly use S3 Multipart Chunking (10MB chunks, bypasses Cloudflare 100MB limit)
        if (file.size > 70 * 1024 * 1024) {
          const multipartRes = await tryMultipartMinioUpload(folderName);
          if (multipartRes) return multipartRes;
        }

        // For files <= 70MB, try single presigned PUT
        try {
          const isVideo =
            file.type.startsWith('video/') ||
            /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name);
          const resourceType = isVideo ? 'video' : 'image';

          const presignedRes = await API.get('/gallery/presigned-url', {
            params: {
              filename: file.name,
              fileType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
              folder: folderName,
            },
            signal: abortController.signal,
          });

          if (presignedRes.data?.success && presignedRes.data?.data) {
            const { uploadUrl, publicUrl, key } = presignedRes.data.data;

            // Direct PUT to MinIO presigned URL with progress tracking
            await axios.put(uploadUrl, file, {
              headers: {
                'Content-Type': file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
              },
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

            return {
              url: publicUrl,
              publicId: key,
              resourceType,
              storageProvider: 's3',
            };
          }
        } catch (minioErr) {
          console.warn('Direct single PUT failed, attempting multipart chunking:', minioErr.message);
          // If single PUT failed (e.g. 413 or network drop), try multipart chunking before falling back to server
          const multipartRes = await tryMultipartMinioUpload(folderName);
          if (multipartRes) return multipartRes;
        }
        return null;
      };

      let res;
      if (pendingItem.destinationType === 'gallery') {
        // 1. Try MinIO direct client-side upload first (bypasses Vercel 4.5MB payload limit completely)
        const directResult = await tryDirectMinioUpload('uploads');

        if (directResult) {
          // Send tiny JSON metadata to backend (never exceeds 1KB, instant on Vercel)
          res = await API.post('/gallery', {
            url: directResult.url,
            publicId: directResult.publicId,
            resourceType: directResult.resourceType,
            storageProvider: 's3',
            folderId: pendingItem.destinationId || undefined,
            caption: ''
          }, { signal: abortController.signal });
        } else {
          // 2. Fallback to multipart form data POST
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
        // Direct MinIO upload for Events (presigned URL + S3)
        const directResult = await tryDirectMinioUpload('uploads');
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
      const isCanceled =
        axios.isCancel(err) ||
        err.name === 'CanceledError' ||
        err.name === 'AbortError' ||
        err.code === 'ERR_CANCELED' ||
        err.message === 'canceled';

      if (isCanceled) {
        setQueue((prev) => prev.filter((item) => item.id !== currentId));
        enqueueSnackbar(`Cancelled upload for "${pendingItem.name}"`, {
          variant: 'info',
        });
      } else {
        const errorMsg =
          err.response?.data?.message || err.message || 'Failed to upload media.';
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
      let skippedDuplicates = 0;

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

        // Check if duplicate of an existing pending/uploading file for the same destination
        const isAlreadyQueued = queueRef.current.some(
          (item) =>
            (item.status === 'pending' || item.status === 'uploading') &&
            item.name === file.name &&
            item.size === file.size &&
            String(item.destinationId || '') === String(destinationId || '')
        );

        // Check if duplicate within the current batch
        const isDuplicateInBatch = validItems.some(
          (item) => item.name === file.name && item.size === file.size
        );

        if (isAlreadyQueued || isDuplicateInBatch) {
          skippedDuplicates++;
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

      if (skippedDuplicates > 0) {
        enqueueSnackbar(
          `${skippedDuplicates} duplicate file${skippedDuplicates > 1 ? 's were' : ' was'} skipped from upload queue.`,
          { variant: 'info' }
        );
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
        } catch { }
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
            } catch { }
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
          } catch { }
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
