// services/geminiService.ts
import { GeneratedAsset, GenerationMode, PaintInput } from "../types";

// 👉 Version Plan B :
// - PLUS AUCUNE IMPORTATION de @google/genai
// - le front appelle uniquement ton backend local sur /paintTexture

export const generateVoxelAsset = async (
  prompt: string,
  mode: GenerationMode,
  paintData?: PaintInput
): Promise<GeneratedAsset> => {
  // --- MODE TEXTURE PAINTER : on passe par le backend ---
  if (mode === "painter" && paintData) {
    const { template } = paintData;

    // PNG template en base64 (on enlève "data:image/png;base64,")
    const templateBase64 = template.dataUrl.split(",")[1];

    // Appel à ton serveur local (Plan B)
    const resp = await fetch("http://localhost:4000/paintTexture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        templatePngBase64: templateBase64,
        colorMap: template.colorMap,
      }),
    });

    if (!resp.ok) {
      console.error("Backend paintTexture error", await resp.text());
      throw new Error("Backend paintTexture failed");
    }

    const data = await resp.json();
    const rawBase64: string = data.imageBase64 || templateBase64;
    const mimeType = "image/png";

    const finalImageUrl = `data:${mimeType};base64,${rawBase64}`;

    return {
      id: crypto.randomUUID(),
      type: "texture",
      imageUrl: finalImageUrl,
      prompt,
      timestamp: Date.now(),
    };
  }

  // --- MODE GEOMETRY / CONCEPT : pour l’instant, on renvoie juste un stub ---
  return {
    id: crypto.randomUUID(),
    type: "concept",
    imageUrl: "", // pas d'image générée pour le moment
    prompt,
    timestamp: Date.now(),
  };
};
