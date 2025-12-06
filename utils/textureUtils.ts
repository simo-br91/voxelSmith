import { TextureTemplate, TextureTemplateResult } from "../types";

// Helper to generate distinct deterministic colors
// We use a step-based RGB generation to ensure colors are visually distinct and machine-readable
const generateColor = (index: number): string => {
  // Steps of 32 ensures distinct colors (256/32 = 8 steps per channel)
  // 8 * 8 * 8 = 512 possible unique colors, plenty for a character model
  const r = (index % 8) * 32 + 16;
  const g = (Math.floor(index / 8) % 8) * 32 + 16;
  const b = (Math.floor(index / 64) % 8) * 32 + 16;
  
  const toHex = (c: number) => {
    const hex = c.toString(16).toUpperCase();
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const generateTemplateFromGeo = async (
  geoJsonString: string, 
  targetResolution: number = 128
): Promise<TextureTemplateResult> => {
  const data = JSON.parse(geoJsonString);
  const geometry = data["minecraft:geometry"]?.[0];
  
  if (!geometry) throw new Error("Invalid geometry JSON");

  const baseWidth = geometry.description.texture_width || 64;
  let scaleFactor = targetResolution / baseWidth;
  if (scaleFactor < 1) scaleFactor = 1;

  // Collect all cubes for packing
  interface CubeItem {
    boneName: string;
    cubeIndex: number; // To handle multiple cubes per bone
    cube: any; 
    w: number; // UV footprint width (scaled)
    h: number; // UV footprint height (scaled)
    origD: number;
    origW: number;
    origH: number;
  }

  const items: CubeItem[] = [];

  const bones = geometry.bones || [];
  bones.forEach((bone: any) => {
    if (!bone.cubes) return;
    bone.cubes.forEach((cube: any, idx: number) => {
      const [w, h, d] = cube.size;
      
      // Standard Box UV Layout Dimensions
      const uvW = Math.ceil((2 * d + 2 * w) * scaleFactor);
      const uvH = Math.ceil((d + h) * scaleFactor);
      
      items.push({ 
        boneName: bone.name, 
        cubeIndex: idx,
        cube, 
        w: uvW, 
        h: uvH,
        origD: d,
        origW: w,
        origH: h 
      });
    });
  });

  // Sort by height for packing
  items.sort((a, b) => b.h - a.h);

  // Packing Logic
  const pack = (maxWidth: number, maxHeight: number) => {
    let x = 0;
    let y = 0;
    let rowH = 0;
    const placements: { x: number; y: number }[] = [];

    for (const item of items) {
      if (x + item.w > maxWidth) {
        x = 0;
        y += rowH;
        rowH = 0;
      }
      if (y + item.h > maxHeight) return null;

      placements.push({ x, y });
      x += item.w;
      rowH = Math.max(rowH, item.h);
    }
    return placements;
  };

  // Find best fit resolution
  let currentRes = targetResolution;
  let placements = pack(currentRes, currentRes);

  while (!placements && currentRes <= 4096) {
    currentRes *= 2;
    scaleFactor = currentRes / baseWidth;
    
    // Recalculate scaled sizes
    items.forEach(item => {
      item.w = Math.ceil((2 * item.origD + 2 * item.origW) * scaleFactor);
      item.h = Math.ceil((item.origD + item.origH) * scaleFactor);
    });
    
    placements = pack(currentRes, currentRes);
  }

  if (!placements) throw new Error("Model is too complex to pack automatically.");

  // Update Geometry
  geometry.description.texture_width = currentRes;
  geometry.description.texture_height = currentRes;

  // Draw Template
  const canvas = document.createElement('canvas');
  canvas.width = currentRes;
  canvas.height = currentRes;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not create canvas context");
  
  ctx.clearRect(0, 0, currentRes, currentRes);

  const colorMap: Record<string, string> = {};
  let globalFaceIndex = 0;

  items.forEach((item, index) => {
    const pos = placements![index];
    const { cube, boneName, cubeIndex, origD: d, origW: w, origH: h } = item;
    
    // Update JSON UVs
    cube.uv = [pos.x, pos.y];

    // Helper to draw scaled rects
    // We floor/ceil to ensure we cover pixels completely without gaps
    const drawRect = (
      name: string,
      ox: number, 
      oy: number, 
      rw: number, 
      rh: number
    ) => {
       const color = generateColor(globalFaceIndex++);
       
       // Construct semantic name: "head.front" or "body_1.top"
       const label = items.filter(i => i.boneName === boneName).length > 1 
         ? `${boneName}_${cubeIndex}.${name}`
         : `${boneName}.${name}`;
       
       colorMap[color] = label;
       ctx.fillStyle = color;
       ctx.fillRect(Math.floor(ox), Math.floor(oy), Math.ceil(rw), Math.ceil(rh));
    };

    const u = pos.x;
    const v = pos.y;
    
    const sd = d * scaleFactor;
    const sw = w * scaleFactor;
    const sh = h * scaleFactor;

    // Draw 6 Semantic Faces per Cube
    // Layout logic:
    
    // 1. Top (Up)
    drawRect('top', u + sd, v, sw, sd);
    
    // 2. Bottom (Down)
    drawRect('bottom', u + sd + sw, v, sw, sd);
    
    // 3. Front (North)
    drawRect('front', u + sd, v + sd, sw, sh);
    
    // 4. Right (East)
    drawRect('right', u, v + sd, sd, sh);
    
    // 5. Left (West)
    drawRect('left', u + sd + sw, v + sd, sd, sh);
    
    // 6. Back (South)
    drawRect('back', u + 2 * sd + sw, v + sd, sw, sh);
  });

  return {
    template: {
      dataUrl: canvas.toDataURL('image/png'),
      colorMap
    },
    updatedGeoJson: JSON.stringify(data, null, 2)
  };
};

// 2. Apply the Template Mask to the AI Output
export const applyTextureMask = async (
  rawAiImageBase64: string, 
  templateDataUrl: string
): Promise<string> => {
  // Load images
  const [imgAi, imgTemplate] = await Promise.all([
    loadImage(`data:image/png;base64,${rawAiImageBase64}`), 
    loadImage(templateDataUrl)
  ]);

  const width = imgTemplate.width;
  const height = imgTemplate.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas failed");

  // 1. Draw Template to get the Alpha/Mask channel
  ctx.drawImage(imgTemplate, 0, 0);
  const templateData = ctx.getImageData(0, 0, width, height);

  // 2. Draw AI Image
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(imgAi, 0, 0, width, height); 
  const aiData = ctx.getImageData(0, 0, width, height);

  // 3. Masking Loop
  const resultData = ctx.createImageData(width, height);
  
  for (let i = 0; i < templateData.data.length; i += 4) {
    const alpha = templateData.data[i + 3]; 
    
    // Strict Masking: Only keep AI pixel if Template has opacity
    if (alpha === 0) {
      resultData.data[i] = 0; 
      resultData.data[i + 1] = 0; 
      resultData.data[i + 2] = 0; 
      resultData.data[i + 3] = 0; 
    } else {
      resultData.data[i] = aiData.data[i];
      resultData.data[i + 1] = aiData.data[i + 1];
      resultData.data[i + 2] = aiData.data[i + 2];
      resultData.data[i + 3] = 255; 
    }
  }

  ctx.putImageData(resultData, 0, 0);
  return canvas.toDataURL('image/png');
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
