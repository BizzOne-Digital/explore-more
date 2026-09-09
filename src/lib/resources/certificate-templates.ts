export type CertificateTemplateId =
  | "adventure-explorer"
  | "navy-gold-classic"
  | "colorful-outdoor"
  | "vintage-green"
  | "nature-elegant"
  | "classic-books"
  | "rustic-wood"
  | "playful-stars";

export type CertificateTextAlign = "left" | "center";

export type CertificateFieldLayout = {
  /** Horizontal anchor as a fraction of page width (0–1). */
  pageX: number;
  /** Baseline on the rule line, as a fraction of page height from the top (0–1). */
  pageY: number;
  align: CertificateTextAlign;
  maxSize?: number;
  minSize?: number;
  color?: { r: number; g: number; b: number };
};

export type CertificateTemplateLayout = {
  studentName: CertificateFieldLayout;
  homeschoolName: CertificateFieldLayout;
  achievement: CertificateFieldLayout;
  educatorName: CertificateFieldLayout;
  dateAwarded: CertificateFieldLayout;
};

export type CertificateTemplateDefinition = {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  imageType: "jpg" | "png";
  previewPath: string;
  layout: CertificateTemplateLayout;
};

export type CertificateTemplateListItem = Pick<
  CertificateTemplateDefinition,
  "id" | "name" | "description" | "previewPath"
> & {
  isActive?: boolean;
  isBuiltin?: boolean;
};

export const CUSTOM_CERTIFICATE_TEMPLATE_PREFIX = "custom:";

export function customCertificateTemplateId(designId: string): string {
  return `${CUSTOM_CERTIFICATE_TEMPLATE_PREFIX}${designId}`;
}

export function parseCustomCertificateTemplateId(id: string): string | null {
  if (!id.startsWith(CUSTOM_CERTIFICATE_TEMPLATE_PREFIX)) return null;
  const designId = id.slice(CUSTOM_CERTIFICATE_TEMPLATE_PREFIX.length);
  return designId || null;
}

export function isCustomCertificateTemplateId(id: string): boolean {
  return parseCustomCertificateTemplateId(id) !== null;
}

const NAVY = { r: 0.08, g: 0.16, b: 0.28 };
const FOREST = { r: 0.09, g: 0.29, b: 0.22 };

const DETAIL = { minSize: 16, maxSize: 20 };
const NAME = { minSize: 22, maxSize: 38 };

type LayoutFields = CertificateTemplateLayout;

/** Measured against each blank template at 1024×790 reference. */
const LAYOUTS: Record<CertificateTemplateId, LayoutFields> = {
  "adventure-explorer": {
    studentName: { pageX: 0.5, pageY: 0.412, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.392, pageY: 0.572, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.488, pageY: 0.638, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.528, pageY: 0.704, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.392, pageY: 0.77, align: "left", ...DETAIL, color: NAVY },
  },
  "navy-gold-classic": {
    studentName: { pageX: 0.5, pageY: 0.42, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.392, pageY: 0.578, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.488, pageY: 0.644, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.528, pageY: 0.71, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.392, pageY: 0.776, align: "left", ...DETAIL, color: NAVY },
  },
  "colorful-outdoor": {
    studentName: { pageX: 0.5, pageY: 0.395, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.398, pageY: 0.558, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.498, pageY: 0.624, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.538, pageY: 0.69, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.398, pageY: 0.756, align: "left", ...DETAIL, color: NAVY },
  },
  "vintage-green": {
    studentName: { pageX: 0.5, pageY: 0.385, align: "center", ...NAME, color: FOREST },
    homeschoolName: { pageX: 0.318, pageY: 0.548, align: "left", ...DETAIL, color: FOREST },
    achievement: { pageX: 0.488, pageY: 0.614, align: "left", ...DETAIL, color: FOREST },
    educatorName: { pageX: 0.538, pageY: 0.68, align: "left", ...DETAIL, color: FOREST },
    dateAwarded: { pageX: 0.308, pageY: 0.746, align: "left", ...DETAIL, color: FOREST },
  },
  "nature-elegant": {
    studentName: { pageX: 0.52, pageY: 0.408, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.418, pageY: 0.572, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.508, pageY: 0.638, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.548, pageY: 0.704, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.418, pageY: 0.77, align: "left", ...DETAIL, color: NAVY },
  },
  "classic-books": {
    studentName: { pageX: 0.5, pageY: 0.375, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.318, pageY: 0.538, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.488, pageY: 0.604, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.538, pageY: 0.67, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.308, pageY: 0.736, align: "left", ...DETAIL, color: NAVY },
  },
  "rustic-wood": {
    studentName: { pageX: 0.5, pageY: 0.4, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.388, pageY: 0.566, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.484, pageY: 0.632, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.524, pageY: 0.698, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.388, pageY: 0.764, align: "left", ...DETAIL, color: NAVY },
  },
  "playful-stars": {
    studentName: { pageX: 0.5, pageY: 0.388, align: "center", ...NAME, color: NAVY },
    homeschoolName: { pageX: 0.4, pageY: 0.552, align: "left", ...DETAIL, color: NAVY },
    achievement: { pageX: 0.498, pageY: 0.618, align: "left", ...DETAIL, color: NAVY },
    educatorName: { pageX: 0.538, pageY: 0.684, align: "left", ...DETAIL, color: NAVY },
    dateAwarded: { pageX: 0.4, pageY: 0.75, align: "left", ...DETAIL, color: NAVY },
  },
};

/** Default field positions for newly uploaded certificate backgrounds. */
export const DEFAULT_CERTIFICATE_FIELD_LAYOUT: CertificateTemplateLayout =
  LAYOUTS["adventure-explorer"];

export const CERTIFICATE_TEMPLATES: CertificateTemplateDefinition[] = [
  {
    id: "adventure-explorer",
    name: "Adventure Explorer",
    description: "Topographic map with mountains and compass accents.",
    imagePath: "images/certificate-templates/adventure-explorer.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/adventure-explorer.jpg",
    layout: LAYOUTS["adventure-explorer"],
  },
  {
    id: "navy-gold-classic",
    name: "Navy & Gold Classic",
    description: "Elegant navy sidebar with gold trim.",
    imagePath: "images/certificate-templates/navy-gold-classic.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/navy-gold-classic.jpg",
    layout: LAYOUTS["navy-gold-classic"],
  },
  {
    id: "colorful-outdoor",
    name: "Colorful Outdoor",
    description: "Bright sky, hills, and playful adventure signs.",
    imagePath: "images/certificate-templates/colorful-outdoor.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/colorful-outdoor.jpg",
    layout: LAYOUTS["colorful-outdoor"],
  },
  {
    id: "vintage-green",
    name: "Vintage Green",
    description: "Classic cream paper with forest green typography.",
    imagePath: "images/certificate-templates/vintage-green.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/vintage-green.jpg",
    layout: LAYOUTS["vintage-green"],
  },
  {
    id: "nature-elegant",
    name: "Nature Elegant",
    description: "Pine forest backdrop with gold accents.",
    imagePath: "images/certificate-templates/nature-elegant.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/nature-elegant.jpg",
    layout: LAYOUTS["nature-elegant"],
  },
  {
    id: "classic-books",
    name: "Classic Books",
    description: "Formal navy border with books and globe.",
    imagePath: "images/certificate-templates/classic-books.png",
    imageType: "png",
    previewPath: "/images/certificate-templates/classic-books.png",
    layout: LAYOUTS["classic-books"],
  },
  {
    id: "rustic-wood",
    name: "Rustic Wood",
    description: "Wooden signposts and compass on parchment.",
    imagePath: "images/certificate-templates/rustic-wood.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/rustic-wood.jpg",
    layout: LAYOUTS["rustic-wood"],
  },
  {
    id: "playful-stars",
    name: "Playful Stars",
    description: "Kid-friendly design with colorful signs and stars.",
    imagePath: "images/certificate-templates/playful-stars.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/playful-stars.jpg",
    layout: LAYOUTS["playful-stars"],
  },
];

export const DEFAULT_CERTIFICATE_TEMPLATE_ID: CertificateTemplateId = "adventure-explorer";

export function getCertificateTemplate(templateId?: string): CertificateTemplateDefinition {
  const match = CERTIFICATE_TEMPLATES.find((template) => template.id === templateId);
  return match ?? CERTIFICATE_TEMPLATES[0];
}

export function getBuiltinCertificateTemplateList(): CertificateTemplateListItem[] {
  return CERTIFICATE_TEMPLATES.map(({ id, name, description, previewPath }) => ({
    id,
    name,
    description,
    previewPath,
  }));
}

export function isCertificateTemplateId(value: string): value is CertificateTemplateId {
  return CERTIFICATE_TEMPLATES.some((template) => template.id === value);
}
