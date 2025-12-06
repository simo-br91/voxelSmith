export interface GeneratedAsset {
  id: string;
  type: 'concept' | 'texture';
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export type GenerationMode = 'concept' | 'painter';

export interface TextureTemplate {
  dataUrl: string; // The base64 PNG of the colored template
  colorMap: Record<string, string>; // Hex Color -> "Bone.Face" (e.g. #FF0000 -> "head.front")
}

export interface TextureTemplateResult {
  template: TextureTemplate;
  updatedGeoJson: string;
}

export interface PaintInput {
  prompt: string;
  template: TextureTemplate;
}
