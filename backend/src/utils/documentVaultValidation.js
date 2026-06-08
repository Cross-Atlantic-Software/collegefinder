const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const UPLOAD_RULES = {
  passport_size_photograph: {
    minBytes: 20 * 1024,
    maxBytes: 5 * 1024 * 1024,
    image: { minWidth: 200, minHeight: 200, maxWidth: 4096, maxHeight: 4096, minAspectRatio: 0.65, maxAspectRatio: 1.5 },
  },
  signature_image: {
    minBytes: 5 * 1024,
    maxBytes: 2 * 1024 * 1024,
    image: { minWidth: 150, minHeight: 50, maxWidth: 2400, maxHeight: 1200, minAspectRatio: 1.2, maxAspectRatio: 8 },
  },
  default: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: { minWidth: 400, minHeight: 400, maxWidth: 6000, maxHeight: 6000 },
  },
};

function getImageDimensions(buffer, extension) {
  if (extension === '.png' && buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  if ((extension === '.jpg' || extension === '.jpeg') && buffer.length > 4) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + length;
    }
  }

  if (extension === '.webp' && buffer.length >= 30) {
    const riff = buffer.slice(0, 4).toString('ascii');
    const webp = buffer.slice(8, 12).toString('ascii');
    if (riff === 'RIFF' && webp === 'WEBP') {
      const chunk = buffer.slice(12, 16).toString('ascii');
      if (chunk === 'VP8X' && buffer.length >= 30) {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
        return { width, height };
      }
    }
  }

  return null;
}

function validateImageDimensions(dimensions, rule, label) {
  if (!dimensions?.width || !dimensions?.height) {
    return `${label} could not be validated. Upload a clearer image file.`;
  }

  if (dimensions.width < rule.minWidth || dimensions.height < rule.minHeight) {
    return `${label} resolution is too low. Minimum size is ${rule.minWidth}x${rule.minHeight}px.`;
  }

  if (dimensions.width > rule.maxWidth || dimensions.height > rule.maxHeight) {
    return `${label} resolution is too high. Maximum size is ${rule.maxWidth}x${rule.maxHeight}px.`;
  }

  const aspectRatio = dimensions.width / dimensions.height;
  if (rule.minAspectRatio != null && aspectRatio < rule.minAspectRatio) {
    return `${label} aspect ratio looks incorrect. Please upload a properly framed file.`;
  }
  if (rule.maxAspectRatio != null && aspectRatio > rule.maxAspectRatio) {
    return `${label} aspect ratio looks incorrect. Please upload a properly framed file.`;
  }

  return null;
}

function validateDocumentUpload({ fieldName, buffer, fileName, mimeType, fileSize }) {
  const rules = UPLOAD_RULES[fieldName] || UPLOAD_RULES.default;
  const label = String(fieldName).replace(/_/g, ' ');

  if (fileSize < rules.minBytes) {
    return `File is too small or low quality. Minimum size is ${Math.ceil(rules.minBytes / 1024)}KB.`;
  }

  if (fileSize > rules.maxBytes) {
    return `File size exceeds the maximum limit of ${(rules.maxBytes / (1024 * 1024)).toFixed(0)}MB.`;
  }

  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return 'File must have a valid extension (.jpg, .jpeg, .png, .webp, or .pdf)';
  }

  const fileExtension = fileName.toLowerCase().substring(lastDotIndex);
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return 'Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed';
  }

  const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validMimeTypes.includes(mimeType)) {
    return 'Invalid file MIME type. Only images (JPEG, PNG, WebP) and PDF files are allowed';
  }

  if (mimeType === 'application/pdf') {
    return null;
  }

  const dimensions = getImageDimensions(buffer, fileExtension);
  return validateImageDimensions(dimensions, rules.image || UPLOAD_RULES.default.image, label);
}

module.exports = {
  validateDocumentUpload,
};
