const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

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
 * MinIO / S3 Multer Upload Middleware with NO file size or count limits
 * Accepts array of field configs, single field name string, or any field
 */
const s3UploadMiddleware = (fields) => {
  const s3 = getS3Client();

  const upload = multer({
    storage: multerS3({
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
    }),
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

module.exports = s3UploadMiddleware;
