import type { DocumentVaultFieldKey } from "@/lib/documentVault";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"] as const;

type ImageRule = {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  minAspectRatio?: number;
  maxAspectRatio?: number;
};

type UploadRule = {
  minBytes: number;
  maxBytes: number;
  image?: ImageRule;
};

const DEFAULT_IMAGE_RULE: ImageRule = {
  minWidth: 400,
  minHeight: 400,
  maxWidth: 6000,
  maxHeight: 6000,
};

const UPLOAD_RULES: Record<DocumentVaultFieldKey, UploadRule> = {
  passport_size_photograph: {
    minBytes: 20 * 1024,
    maxBytes: 5 * 1024 * 1024,
    image: {
      minWidth: 200,
      minHeight: 200,
      maxWidth: 4096,
      maxHeight: 4096,
      minAspectRatio: 0.65,
      maxAspectRatio: 1.5,
    },
  },
  signature_image: {
    minBytes: 5 * 1024,
    maxBytes: 2 * 1024 * 1024,
    image: {
      minWidth: 150,
      minHeight: 50,
      maxWidth: 2400,
      maxHeight: 1200,
      minAspectRatio: 1.2,
      maxAspectRatio: 8,
    },
  },
  matric_marksheet: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  matric_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  postmatric_marksheet: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  valid_photo_id_proof: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  sc_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  st_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  obc_ncl_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  ews_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  pwbd_disability_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  udid_card: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  domicile_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  citizenship_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
  migration_certificate: {
    minBytes: 10 * 1024,
    maxBytes: 10 * 1024 * 1024,
    image: DEFAULT_IMAGE_RULE,
  },
};

function loadImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image quality. The file may be corrupted or too low quality."));
    };
    img.src = url;
  });
}

function validateImageDimensions(
  dimensions: { width: number; height: number },
  rule: ImageRule,
  label: string,
): string | null {
  if (dimensions.width < rule.minWidth || dimensions.height < rule.minHeight) {
    return `${label} resolution is too low. Minimum size is ${rule.minWidth}×${rule.minHeight}px.`;
  }

  if (dimensions.width > rule.maxWidth || dimensions.height > rule.maxHeight) {
    return `${label} resolution is too high. Maximum size is ${rule.maxWidth}×${rule.maxHeight}px.`;
  }

  const aspectRatio = dimensions.width / dimensions.height;
  if (rule.minAspectRatio != null && aspectRatio < rule.minAspectRatio) {
    return `${label} aspect ratio looks incorrect. Please upload a clearer, properly framed file.`;
  }
  if (rule.maxAspectRatio != null && aspectRatio > rule.maxAspectRatio) {
    return `${label} aspect ratio looks incorrect. Please upload a clearer, properly framed file.`;
  }

  return null;
}

export async function validateDocumentUploadFile(
  file: File,
  fieldName: DocumentVaultFieldKey,
): Promise<string | null> {
  const rules = UPLOAD_RULES[fieldName];
  const label = fieldName.replace(/_/g, " ");

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return "Invalid file type. Only JPEG, PNG, WebP images and PDF files are allowed.";
  }

  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    return "Invalid file extension. Only .jpg, .jpeg, .png, .webp, and .pdf files are allowed.";
  }

  if (file.size < rules.minBytes) {
    return `File is too small or low quality. Minimum size is ${Math.ceil(rules.minBytes / 1024)}KB.`;
  }

  if (file.size > rules.maxBytes) {
    return `File size exceeds the maximum limit of ${(rules.maxBytes / (1024 * 1024)).toFixed(0)}MB.`;
  }

  if (file.type === "application/pdf") {
    return null;
  }

  if (!rules.image) {
    return null;
  }

  try {
    const dimensions = await loadImageDimensions(file);
    return validateImageDimensions(dimensions, rules.image, label);
  } catch (error) {
    return error instanceof Error ? error.message : "Failed to validate image quality.";
  }
}
