const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

const isR2Configured = () => {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
};

let s3Client = null;

const getS3Client = () => {
  if (!isR2Configured()) {
    return null;
  }
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }
  return s3Client;
};

/**
 * Builds the publicly accessible URL for a given object key in Cloudflare R2
 * @param {string} key
 * @returns {string}
 */
const getPublicUrl = (key) => {
  const cleanKey = key.replace(/^\/+/, '');
  if (publicUrl) {
    return `${publicUrl.replace(/\/+$/, '')}/${cleanKey}`;
  }
  // Fallback to direct worker/endpoint if publicUrl is not explicitly configured
  return `https://${bucketName}.${accountId}.r2.cloudflarestorage.com/${cleanKey}`;
};

/**
 * Uploads a buffer or stream directly to Cloudflare R2
 * @param {Buffer|Uint8Array|Blob|string|ReadableStream} body
 * @param {string} key - e.g. "gallery/photo-12345.jpg"
 * @param {string} mimetype - e.g. "image/jpeg"
 * @returns {Promise<{ url: string, key: string }>}
 */
const uploadToR2 = async (body, key, mimetype = 'application/octet-stream') => {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured. Please ensure CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME are set.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    Body: body,
    ContentType: mimetype
  });

  await client.send(command);

  return {
    url: getPublicUrl(cleanKey),
    key: cleanKey
  };
};

/**
 * Deletes an object from Cloudflare R2
 * @param {string} keyOrUrl
 */
const deleteFromR2 = async (keyOrUrl) => {
  const client = getS3Client();
  if (!client) {
    console.warn('Cloudflare R2 is not configured. Skipping R2 delete.');
    return;
  }

  if (!keyOrUrl) return;

  // If a full URL is provided, extract the object key
  let key = keyOrUrl;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const parsed = new URL(keyOrUrl);
      key = parsed.pathname.replace(/^\/+/, '');
    } catch (e) {
      key = keyOrUrl;
    }
  }

  const cleanKey = key.replace(/^\/+/, '');

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: cleanKey
  });

  try {
    await client.send(command);
  } catch (err) {
    console.warn(`Failed to delete object "${cleanKey}" from Cloudflare R2:`, err.message);
  }
};

/**
 * Generates a presigned PUT URL for client-side direct upload to Cloudflare R2
 * @param {string} key
 * @param {string} mimetype
 * @param {number} expiresInSeconds
 * @returns {Promise<{ uploadUrl: string, publicUrl: string, key: string }>}
 */
const getPresignedUploadUrl = async (key, mimetype = 'application/octet-stream', expiresInSeconds = 3600) => {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const cleanKey = key.replace(/^\/+/, '');

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: cleanKey,
    ContentType: mimetype
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    publicUrl: getPublicUrl(cleanKey),
    key: cleanKey
  };
};

/**
 * Retrieves an object stream from Cloudflare R2
 * @param {string} key
 */
const getObjectStream = async (key) => {
  const client = getS3Client();
  if (!client) {
    throw new Error('Cloudflare R2 is not configured.');
  }

  const cleanKey = key.replace(/^\/+/, '');
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: cleanKey
  });

  const response = await client.send(command);
  return response.Body;
};

module.exports = {
  isR2Configured,
  getS3Client,
  getPublicUrl,
  uploadToR2,
  deleteFromR2,
  getPresignedUploadUrl,
  getObjectStream
};
