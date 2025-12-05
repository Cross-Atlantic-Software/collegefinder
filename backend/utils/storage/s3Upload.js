const AWS = require('aws-sdk');
const path = require('path');

// Support both AWS_S3_BUCKET_NAME and S3_BUCKET variable names
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET;

// Validate AWS credentials (only warn if using placeholder values, not if values are different)
const isPlaceholder = (value, placeholder) => {
  return !value || value === placeholder || value.trim() === '';
};

if (isPlaceholder(process.env.AWS_ACCESS_KEY_ID, 'your_access_key')) {
  console.warn('⚠️  AWS_ACCESS_KEY_ID not configured or using placeholder value');
}

if (isPlaceholder(process.env.AWS_SECRET_ACCESS_KEY, 'your_secret_key')) {
  console.warn('⚠️  AWS_SECRET_ACCESS_KEY not configured or using placeholder value');
}

if (isPlaceholder(BUCKET_NAME, 'your_bucket_name')) {
  console.warn('⚠️  AWS_S3_BUCKET_NAME or S3_BUCKET not configured or using placeholder value');
}

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder path in S3 (e.g., 'career-goals')
 * @returns {Promise<string>} S3 URL of uploaded file
 */
const uploadToS3 = async (fileBuffer, fileName, folder = 'career-goals') => {
  try {
    // Validate configuration - check if values exist (not checking for placeholder strings)
    if (!BUCKET_NAME || BUCKET_NAME.trim() === '') {
      throw new Error('AWS_S3_BUCKET_NAME or S3_BUCKET is not configured. Please set it in your .env file.');
    }

    if (!process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID.trim() === '') {
      throw new Error('AWS_ACCESS_KEY_ID is not configured. Please set it in your .env file.');
    }

    if (!process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY.trim() === '') {
      throw new Error('AWS_SECRET_ACCESS_KEY is not configured. Please set it in your .env file.');
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}-${sanitizedFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: getContentType(fileName),
      // Note: ACLs are disabled on modern S3 buckets by default
      // Public access should be handled via bucket policy instead (see AWS_S3_SETUP.md)
      // Removed ACL parameter to avoid "The bucket does not allow ACLs" error
    };

    const result = await s3.upload(params).promise();
    console.log(`✅ Successfully uploaded to S3: ${result.Location}`);
    return result.Location;
  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    
    // Provide helpful error messages
    if (error.code === 'InvalidAccessKeyId') {
      throw new Error('Invalid AWS Access Key ID. Please check your AWS_ACCESS_KEY_ID in .env file.');
    } else if (error.code === 'SignatureDoesNotMatch') {
      throw new Error('Invalid AWS Secret Access Key. Please check your AWS_SECRET_ACCESS_KEY in .env file.');
    } else if (error.code === 'NoSuchBucket') {
      throw new Error(`S3 bucket "${BUCKET_NAME}" does not exist. Please check your AWS_S3_BUCKET_NAME in .env file.`);
    } else if (error.code === 'AccessDenied') {
      throw new Error('Access denied to S3 bucket. Please check IAM user permissions and bucket policy.');
    } else if (error.code === 'InvalidRequest' || error.message?.includes('ACL')) {
      throw new Error('The bucket does not allow ACLs. Please configure bucket policy for public access instead. See AWS_S3_SETUP.md for details.');
    } else if (error.message) {
      throw error; // Re-throw if it's already a helpful error message
    } else {
      throw new Error(`Failed to upload file to S3: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Delete file from S3
 * @param {string} s3Url - S3 URL of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (s3Url) => {
  try {
    // Extract key from S3 URL
    const url = new URL(s3Url);
    const key = url.pathname.substring(1); // Remove leading '/'

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error('Error deleting from S3:', error);
    // Don't throw error - file might not exist or already deleted
  }
};

/**
 * Get content type from file extension
 */
const getContentType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return contentTypes[ext] || 'application/octet-stream';
};

module.exports = {
  uploadToS3,
  deleteFromS3,
};

