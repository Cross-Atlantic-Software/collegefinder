export type DocumentVaultFieldKey =
  | "passport_size_photograph"
  | "signature_image"
  | "matric_marksheet"
  | "matric_certificate"
  | "postmatric_marksheet"
  | "valid_photo_id_proof"
  | "sc_certificate"
  | "st_certificate"
  | "obc_ncl_certificate"
  | "ews_certificate"
  | "pwbd_disability_certificate"
  | "udid_card"
  | "domicile_certificate"
  | "citizenship_certificate"
  | "migration_certificate";

export type DocumentVaultRecord = Partial<Record<DocumentVaultFieldKey, string | null>> & {
  id?: number;
  user_id?: number;
};

export type DocumentVaultField = {
  key: DocumentVaultFieldKey;
  label: string;
  section: string;
  required?: boolean;
  uploadKind: "photo" | "signature" | "document";
};

/** All document columns on user_document_vault (order matches DB). */
export const DOCUMENT_VAULT_FIELD_KEYS: DocumentVaultFieldKey[] = [
  "passport_size_photograph",
  "signature_image",
  "matric_marksheet",
  "matric_certificate",
  "postmatric_marksheet",
  "valid_photo_id_proof",
  "sc_certificate",
  "st_certificate",
  "obc_ncl_certificate",
  "ews_certificate",
  "pwbd_disability_certificate",
  "udid_card",
  "domicile_certificate",
  "citizenship_certificate",
  "migration_certificate",
];

export const DOCUMENT_VAULT_FIELDS: DocumentVaultField[] = [
  {
    key: "passport_size_photograph",
    label: "Passport-size Photograph",
    section: "Mandatory Uploads",
    required: true,
    uploadKind: "photo",
  },
  {
    key: "signature_image",
    label: "Signature Image",
    section: "Mandatory Uploads",
    required: true,
    uploadKind: "signature",
  },
  {
    key: "matric_marksheet",
    label: "Matric Marksheet",
    section: "Identity & Academic Proof",
    uploadKind: "document",
  },
  {
    key: "matric_certificate",
    label: "Matric Certificate",
    section: "Identity & Academic Proof",
    uploadKind: "document",
  },
  {
    key: "postmatric_marksheet",
    label: "Postmatric Marksheet (if passed)",
    section: "Identity & Academic Proof",
    uploadKind: "document",
  },
  {
    key: "valid_photo_id_proof",
    label: "Valid Photo ID Proof",
    section: "Identity & Academic Proof",
    uploadKind: "document",
  },
  {
    key: "sc_certificate",
    label: "SC Certificate",
    section: "Category and Reservation Documents (if applicable)",
    uploadKind: "document",
  },
  {
    key: "st_certificate",
    label: "ST Certificate",
    section: "Category and Reservation Documents (if applicable)",
    uploadKind: "document",
  },
  {
    key: "obc_ncl_certificate",
    label: "OBC-NCL Certificate",
    section: "Category and Reservation Documents (if applicable)",
    uploadKind: "document",
  },
  {
    key: "ews_certificate",
    label: "EWS Certificate",
    section: "Category and Reservation Documents (if applicable)",
    uploadKind: "document",
  },
  {
    key: "pwbd_disability_certificate",
    label: "PwBD/Disability Certificate",
    section: "PwBD / Disability certificate (if applicable)",
    uploadKind: "document",
  },
  {
    key: "citizenship_certificate",
    label: "Citizenship Certificate (OCI/PIO, if applicable)",
    section: "Additional Uploads (exam dependent)",
    uploadKind: "document",
  },
  {
    key: "migration_certificate",
    label: "Migration Certificate",
    section: "Additional Uploads (exam dependent)",
    uploadKind: "document",
  },
  {
    key: "udid_card",
    label: "UDID Card",
    section: "Additional Uploads (exam dependent)",
    uploadKind: "document",
  },
  {
    key: "domicile_certificate",
    label: "Domicile Certificate (State Quota Exams)",
    section: "Additional Uploads (exam dependent)",
    uploadKind: "document",
  },
];

export const DOCUMENT_VAULT_FIELD_LABELS = Object.fromEntries(
  DOCUMENT_VAULT_FIELDS.map((field) => [field.key, field.label]),
) as Record<DocumentVaultFieldKey, string>;

export const CATEGORY_CERT_MAP: Record<string, DocumentVaultFieldKey[]> = {
  sc: ["sc_certificate"],
  st: ["st_certificate"],
  obc: ["obc_ncl_certificate"],
  "obc-ncl": ["obc_ncl_certificate"],
  ews: ["ews_certificate"],
};

export function hasDocumentValue(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function calculateDocumentVaultCompletion(vault: DocumentVaultRecord | null | undefined) {
  const totalFields = DOCUMENT_VAULT_FIELD_KEYS.length;
  let completedFields = 0;

  for (const key of DOCUMENT_VAULT_FIELD_KEYS) {
    if (hasDocumentValue(vault?.[key])) {
      completedFields += 1;
    }
  }

  const percentage =
    totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return { percentage, completedFields, totalFields };
}

export function listUploadedDocuments(vault: DocumentVaultRecord | null | undefined) {
  return DOCUMENT_VAULT_FIELDS.filter((field) => hasDocumentValue(vault?.[field.key])).map(
    (field) => ({
      key: field.key,
      label: field.label,
      url: vault?.[field.key] as string,
      section: field.section,
    }),
  );
}

export function emptyDocumentVault(): DocumentVaultRecord {
  return {
    passport_size_photograph: null,
    signature_image: null,
    matric_marksheet: null,
    matric_certificate: null,
    postmatric_marksheet: null,
    valid_photo_id_proof: null,
    sc_certificate: null,
    st_certificate: null,
    obc_ncl_certificate: null,
    ews_certificate: null,
    pwbd_disability_certificate: null,
    udid_card: null,
    domicile_certificate: null,
    citizenship_certificate: null,
    migration_certificate: null,
  };
}

export function getFileExtension(url: string): string {
  const match = url.match(/\.([^.?#]+)(?:[?#]|$)/);
  return match ? match[1].toLowerCase() : "";
}

export function isImageDocumentUrl(url: string): boolean {
  const ext = getFileExtension(url);
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
}
