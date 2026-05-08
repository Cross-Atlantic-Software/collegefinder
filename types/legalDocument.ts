export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  /** Rich HTML from CMS; when set, public page renders this instead of parsed paragraphs */
  bodyHtml?: string;
};

export type LegalDocumentMeta = {
  effectiveDate?: string;
  version?: string;
};

export type LegalDocument = {
  intro: string[];
  sections: LegalSection[];
  /** Optional rich intro (title block + lead lines) */
  introHtml?: string;
  meta?: LegalDocumentMeta;
};
