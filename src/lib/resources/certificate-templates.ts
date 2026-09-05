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
  /** Horizontal position as a fraction of the printable content width (0–1). */
  x: number;
  /** Vertical position as a fraction of the printable content height from the top (0–1). */
  y: number;
  align: CertificateTextAlign;
  maxSize?: number;
  minSize?: number;
  color?: { r: number; g: number; b: number };
};

export type CertificateTemplateDefinition = {
  id: CertificateTemplateId;
  name: string;
  description: string;
  imagePath: string;
  imageType: "jpg" | "png";
  previewPath: string;
  layout: {
    studentName: CertificateFieldLayout;
    homeschoolName: CertificateFieldLayout;
    achievement: CertificateFieldLayout;
    educatorName: CertificateFieldLayout;
    dateAwarded: CertificateFieldLayout;
  };
};

const NAVY = { r: 0.08, g: 0.16, b: 0.28 };
const FOREST = { r: 0.09, g: 0.29, b: 0.22 };

/** Calibrated to blank lines inside the printable content region (1024×790 reference). */
const STANDARD_LAYOUT: CertificateTemplateDefinition["layout"] = {
  studentName: { x: 0.5, y: 0.31, align: "center", minSize: 20, maxSize: 36, color: NAVY },
  homeschoolName: { x: 0.3, y: 0.57, align: "left", minSize: 14, maxSize: 17, color: NAVY },
  achievement: { x: 0.3, y: 0.64, align: "left", minSize: 14, maxSize: 17, color: NAVY },
  educatorName: { x: 0.3, y: 0.71, align: "left", minSize: 14, maxSize: 17, color: NAVY },
  dateAwarded: { x: 0.3, y: 0.78, align: "left", minSize: 14, maxSize: 17, color: NAVY },
};

export const CERTIFICATE_TEMPLATES: CertificateTemplateDefinition[] = [
  {
    id: "adventure-explorer",
    name: "Adventure Explorer",
    description: "Topographic map with mountains and compass accents.",
    imagePath: "images/certificate-templates/adventure-explorer.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/adventure-explorer.jpg",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "navy-gold-classic",
    name: "Navy & Gold Classic",
    description: "Elegant navy sidebar with gold trim.",
    imagePath: "images/certificate-templates/navy-gold-classic.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/navy-gold-classic.jpg",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "colorful-outdoor",
    name: "Colorful Outdoor",
    description: "Bright sky, hills, and playful adventure signs.",
    imagePath: "images/certificate-templates/colorful-outdoor.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/colorful-outdoor.jpg",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "vintage-green",
    name: "Vintage Green",
    description: "Classic cream paper with forest green typography.",
    imagePath: "images/certificate-templates/vintage-green.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/vintage-green.jpg",
    layout: {
      ...STANDARD_LAYOUT,
      studentName: { ...STANDARD_LAYOUT.studentName, color: FOREST },
    },
  },
  {
    id: "nature-elegant",
    name: "Nature Elegant",
    description: "Pine forest backdrop with gold accents.",
    imagePath: "images/certificate-templates/nature-elegant.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/nature-elegant.jpg",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "classic-books",
    name: "Classic Books",
    description: "Formal navy border with books and globe.",
    imagePath: "images/certificate-templates/classic-books.png",
    imageType: "png",
    previewPath: "/images/certificate-templates/classic-books.png",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "rustic-wood",
    name: "Rustic Wood",
    description: "Wooden signposts and compass on parchment.",
    imagePath: "images/certificate-templates/rustic-wood.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/rustic-wood.jpg",
    layout: STANDARD_LAYOUT,
  },
  {
    id: "playful-stars",
    name: "Playful Stars",
    description: "Kid-friendly design with colorful signs and stars.",
    imagePath: "images/certificate-templates/playful-stars.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/playful-stars.jpg",
    layout: STANDARD_LAYOUT,
  },
];

export const DEFAULT_CERTIFICATE_TEMPLATE_ID: CertificateTemplateId = "adventure-explorer";

export function getCertificateTemplate(templateId?: string): CertificateTemplateDefinition {
  const match = CERTIFICATE_TEMPLATES.find((template) => template.id === templateId);
  return match ?? CERTIFICATE_TEMPLATES[0];
}

export function isCertificateTemplateId(value: string): value is CertificateTemplateId {
  return CERTIFICATE_TEMPLATES.some((template) => template.id === value);
}
