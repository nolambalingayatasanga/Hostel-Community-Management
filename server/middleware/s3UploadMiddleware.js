const { S3Client, DeleteObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

let multerS3 = null;
try {
  multerS3 = require('multer-s3');
} catch (err) {
  console.warn('[s3UploadMiddleware] multer-s3 module not found, falling back to memoryStorage:', err.message);
}

const getS3Client = () => {
  return new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com',
    region: process.env.MINIO_REGION || 'in-south-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true,
  });
};

/**
 * Upload an in-memory buffer directly to MinIO / S3 bucket 'madhan'
 */
const uploadBufferToS3 = async (buffer, originalname = 'media.jpg', mimetype = 'image/jpeg', folder = 'uploads', bucket = 'madhan') => {
  const s3 = getS3Client();
  const cleanName = (originalname || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${folder}/${Date.now().toString()}_${cleanName}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimetype || 'application/octet-stream',
    ACL: 'public-read',
    ContentDisposition: 'inline',
  });
  await s3.send(command);
  const endpoint = (process.env.MINIO_ENDPOINT || 'https://staging-storage-api.emovur.com').replace(/\/+$/, '');
  const url = `${endpoint}/${bucket}/${key}`;
  return {
    url,
    publicId: key,
    key,
    bucket,
  };
};

/**
 * MinIO / S3 Multer Upload Middleware with NO file size or count limits
 * Accepts array of field configs, single field name string, or any field
 */
const s3UploadMiddleware = (fields) => {
  let storage;
  if (multerS3) {
    const s3 = getS3Client();
    storage = multerS3({
      s3: s3,
      bucket: "madhan",
      acl: "public-read",
      contentType: multerS3.AUTO_CONTENT_TYPE,
      contentDisposition: function (req, file, cb) {
        cb(null, "inline");
      },
      key: function (req, file, cb) {
        const cleanName = (file.originalname || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${Date.now().toString()}_${cleanName}`;
        cb(null, `uploads/${fileName}`);
      },
    });
  } else {
    storage = multer.memoryStorage();
  }

  const upload = multer({
    storage: storage,
    // Explicitly NO file size limits
  });

  if (Array.isArray(fields)) {
    return upload.fields(fields);
  } else if (typeof fields === 'string') {
    return upload.single(fields);
  }
  return upload.any();
};

/**
 * Delete an object from MinIO / S3 bucket 'madhan'
 */
const deleteFromS3 = async (keyOrUrl, bucket = 'madhan') => {
  if (!keyOrUrl) return;
  try {
    const s3 = getS3Client();
    let cleanKey = keyOrUrl;
    if (cleanKey.startsWith('http://') || cleanKey.startsWith('https://')) {
      const urlObj = new URL(cleanKey);
      const parts = urlObj.pathname.split('/').filter(Boolean);
      if (parts.length > 0 && parts[0] === bucket) {
        cleanKey = parts.slice(1).join('/');
      } else {
        cleanKey = parts.join('/');
      }
    }
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: cleanKey
    });
    return await s3.send(command);
  } catch (err) {
    console.warn(`[MinIO/S3 Delete Warning] Failed to delete ${keyOrUrl}:`, err.message);
  }
};

s3UploadMiddleware.getS3Client = getS3Client;
s3UploadMiddleware.deleteFromS3 = deleteFromS3;
s3UploadMiddleware.uploadBufferToS3 = uploadBufferToS3;

module.exports = s3UploadMiddleware;

