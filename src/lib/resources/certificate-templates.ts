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

export type CertificateContentRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CertificateFieldLayout = {
  /** Horizontal position as a fraction of the printable content width (0–1). */
  x: number;
  /** Vertical position as a fraction of the printable content height (baseline on the rule line). */
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
  contentRegion: CertificateContentRegion;
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

/** Sidebar templates — printable area to the right of the left panel. */
export const SIDEBAR_CONTENT_REGION: CertificateContentRegion = {
  left: 0.215,
  top: 0.11,
  width: 0.785,
  height: 0.84,
};

/** Classic books template — full-width center panel, no sidebar. */
export const CLASSIC_CONTENT_REGION: CertificateContentRegion = {
  left: 0.09,
  top: 0.1,
  width: 0.82,
  height: 0.82,
};

/** Nature elegant — wider left green panel. */
export const WIDE_SIDEBAR_CONTENT_REGION: CertificateContentRegion = {
  left: 0.26,
  top: 0.11,
  width: 0.72,
  height: 0.84,
};

type LayoutFields = CertificateTemplateDefinition["layout"];
type LayoutPatch = {
  studentName?: Partial<CertificateFieldLayout>;
  homeschoolName?: Partial<CertificateFieldLayout>;
  achievement?: Partial<CertificateFieldLayout>;
  educatorName?: Partial<CertificateFieldLayout>;
  dateAwarded?: Partial<CertificateFieldLayout>;
};

function sidebarLayout(color: typeof NAVY, patch?: LayoutPatch): LayoutFields {
  const base: LayoutFields = {
    studentName: { x: 0.5, y: 0.369, align: "center", minSize: 22, maxSize: 38, color },
    homeschoolName: { x: 0.28, y: 0.554, align: "left", minSize: 16, maxSize: 19, color },
    achievement: { x: 0.43, y: 0.631, align: "left", minSize: 16, maxSize: 19, color },
    educatorName: { x: 0.47, y: 0.708, align: "left", minSize: 16, maxSize: 19, color },
    dateAwarded: { x: 0.27, y: 0.786, align: "left", minSize: 16, maxSize: 19, color },
  };

  if (!patch) return base;

  return {
    studentName: { ...base.studentName, ...patch.studentName },
    homeschoolName: { ...base.homeschoolName, ...patch.homeschoolName },
    achievement: { ...base.achievement, ...patch.achievement },
    educatorName: { ...base.educatorName, ...patch.educatorName },
    dateAwarded: { ...base.dateAwarded, ...patch.dateAwarded },
  };
}

function classicLayout(color: typeof NAVY): LayoutFields {
  return {
    studentName: { x: 0.5, y: 0.341, align: "center", minSize: 22, maxSize: 38, color },
    homeschoolName: { x: 0.28, y: 0.537, align: "left", minSize: 16, maxSize: 19, color },
    achievement: { x: 0.48, y: 0.622, align: "left", minSize: 16, maxSize: 19, color },
    educatorName: { x: 0.52, y: 0.707, align: "left", minSize: 16, maxSize: 19, color },
    dateAwarded: { x: 0.26, y: 0.793, align: "left", minSize: 16, maxSize: 19, color },
  };
}

export const CERTIFICATE_TEMPLATES: CertificateTemplateDefinition[] = [
  {
    id: "adventure-explorer",
    name: "Adventure Explorer",
    description: "Topographic map with mountains and compass accents.",
    imagePath: "images/certificate-templates/adventure-explorer.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/adventure-explorer.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY),
  },
  {
    id: "navy-gold-classic",
    name: "Navy & Gold Classic",
    description: "Elegant navy sidebar with gold trim.",
    imagePath: "images/certificate-templates/navy-gold-classic.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/navy-gold-classic.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY, {
      studentName: { y: 0.375 },
      homeschoolName: { y: 0.558 },
      achievement: { y: 0.635 },
      educatorName: { y: 0.712 },
      dateAwarded: { y: 0.79 },
    }),
  },
  {
    id: "colorful-outdoor",
    name: "Colorful Outdoor",
    description: "Bright sky, hills, and playful adventure signs.",
    imagePath: "images/certificate-templates/colorful-outdoor.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/colorful-outdoor.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY, {
      studentName: { y: 0.358 },
      homeschoolName: { y: 0.548, x: 0.3 },
      achievement: { y: 0.625, x: 0.45 },
      educatorName: { y: 0.702, x: 0.5 },
      dateAwarded: { y: 0.78, x: 0.29 },
    }),
  },
  {
    id: "vintage-green",
    name: "Vintage Green",
    description: "Classic cream paper with forest green typography.",
    imagePath: "images/certificate-templates/vintage-green.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/vintage-green.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(FOREST, {
      studentName: { y: 0.382 },
      homeschoolName: { y: 0.56 },
      achievement: { y: 0.637 },
      educatorName: { y: 0.714 },
      dateAwarded: { y: 0.792 },
    }),
  },
  {
    id: "nature-elegant",
    name: "Nature Elegant",
    description: "Pine forest backdrop with gold accents.",
    imagePath: "images/certificate-templates/nature-elegant.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/nature-elegant.jpg",
    contentRegion: WIDE_SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY, {
      studentName: { y: 0.372 },
      homeschoolName: { x: 0.24, y: 0.556 },
      achievement: { x: 0.4, y: 0.633 },
      educatorName: { x: 0.44, y: 0.71 },
      dateAwarded: { x: 0.22, y: 0.788 },
    }),
  },
  {
    id: "classic-books",
    name: "Classic Books",
    description: "Formal navy border with books and globe.",
    imagePath: "images/certificate-templates/classic-books.png",
    imageType: "png",
    previewPath: "/images/certificate-templates/classic-books.png",
    contentRegion: CLASSIC_CONTENT_REGION,
    layout: classicLayout(NAVY),
  },
  {
    id: "rustic-wood",
    name: "Rustic Wood",
    description: "Wooden signposts and compass on parchment.",
    imagePath: "images/certificate-templates/rustic-wood.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/rustic-wood.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY, {
      studentName: { y: 0.364 },
      homeschoolName: { y: 0.55 },
      achievement: { y: 0.627 },
      educatorName: { y: 0.704 },
      dateAwarded: { y: 0.782 },
    }),
  },
  {
    id: "playful-stars",
    name: "Playful Stars",
    description: "Kid-friendly design with colorful signs and stars.",
    imagePath: "images/certificate-templates/playful-stars.jpg",
    imageType: "jpg",
    previewPath: "/images/certificate-templates/playful-stars.jpg",
    contentRegion: SIDEBAR_CONTENT_REGION,
    layout: sidebarLayout(NAVY, {
      studentName: { y: 0.355 },
      homeschoolName: { y: 0.542, x: 0.3 },
      achievement: { y: 0.619, x: 0.45 },
      educatorName: { y: 0.696, x: 0.5 },
      dateAwarded: { y: 0.774, x: 0.29 },
    }),
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
