import { GoogleGenAI } from "@google/genai";
import { GeneratedAsset, GenerationMode, PaintInput } from "../types";
import { PAINTER_SYSTEM_PROMPT, VIEW_PROMPT_PREFIX } from "../constants";
import { applyTextureMask } from "../utils/textureUtils";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Unified Generation Function
export const generateVoxelAsset = async (
  prompt: string,
  mode: GenerationMode,
  paintData?: PaintInput
): Promise<GeneratedAsset> => {
  try {
    let contents;
    let config = {};
    // Default model for image generation tasks
    let model = 'gemini-2.5-flash-image';

    if (mode === 'painter' && paintData) {
      // 1. Prepare Painter Prompt with Semantic Face Mapping
      const colorMapJson = JSON.stringify(paintData.template.colorMap, null, 2);

      const fullPrompt = `
You are given:
1) A UV template image where each solid color corresponds to one cube face.
2) A JSON colorMap that tells you which face each color represents.
3) A description of the character.

Use the colorMap to decide what to paint on each face.

Character Description:
${prompt}

Color-to-face map (JSON):
${colorMapJson}

Instructions:
- For faces like "head.front", paint the character's face (eyes, nose, mouth) and the front of the helmet or hood.
- For "head.back", paint the back of the helmet or hair.
- For "body.front", paint the chest armor or clothing details.
- For "body.back", paint the back side of the armor or a cloak.
- For arms and legs, paint sleeves, gloves, pants, and boots according to the description.
- Keep the style blocky and pixelated, Minecraft-like.
- Do not add text or random scribbles.
- Do not try to change the UV layout; only paint inside each colored island.

Return only the final painted texture image.
`;
      
      const base64Data = paintData.template.dataUrl.split(',')[1];

      // Structure content to send text instructions FIRST, then the image.
      // This helps the model process the instructions before seeing the visual context.
      contents = [
        {
          role: "user",
          parts: [
            { text: fullPrompt },
            {
              inlineData: {
                mimeType: 'image/png',
                data: base64Data
              }
            }
          ]
        }
      ];

      config = {
        systemInstruction: PAINTER_SYSTEM_PROMPT
      };

    } else {
      // Concept Mode
      contents = {
        parts: [
          { text: `${VIEW_PROMPT_PREFIX} ${prompt}` }
        ]
      };
      config = {
        imageConfig: {
          aspectRatio: '1:1',
        }
      };
    }

    // 2. Call Gemini
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: config
    });

    // 3. Extract Image
    let rawBase64 = '';
    let mimeType = 'image/png';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           rawBase64 = part.inlineData.data;
           mimeType = part.inlineData.mimeType || 'image/png';
           break;
        }
      }
    }

    if (!rawBase64) {
      throw new Error("No image generated.");
    }

    let finalImageUrl = `data:${mimeType};base64,${rawBase64}`;

    // 4. POST-PROCESSING: Apply strict masking for textures
    if (mode === 'painter' && paintData) {
      finalImageUrl = await applyTextureMask(rawBase64, paintData.template.dataUrl);
    }

    return {
      id: crypto.randomUUID(),
      type: mode === 'painter' ? 'texture' : 'concept',
      imageUrl: finalImageUrl,
      prompt: prompt,
      timestamp: Date.now(),
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
