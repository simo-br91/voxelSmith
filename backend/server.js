// backend/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 4000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("VoxelSmith backend is running");
});

// Route principale
app.post("/paintTexture", async (req, res) => {
  try {
    const { prompt, templatePngBase64, resolution } = req.body;

    console.log("=== paintTexture called ===");
    console.log("Prompt:", prompt);
    console.log("Resolution:", resolution);
    console.log("Template size:", templatePngBase64?.length || 0, "chars");

    // Prompt pour Stable Diffusion
    const sdPrompt = `
Minecraft voxel texture, pixel art style.
${prompt}
Keep the UV layout intact, paint details inside each face.
Sharp pixels, no blur, blocky style.
`;

    const negativePrompt = `
photorealistic, smooth, blurry, gradient, realistic lighting, soft shading, 
text, watermark, signature, deformed, distorted
`;

    // Appel à Stable Diffusion WebUI (img2img)
    const sdUrl = "http://127.0.0.1:7860/sdapi/v1/img2img";

    const payload = {
      init_images: [templatePngBase64],
      prompt: sdPrompt,
      negative_prompt: negativePrompt,
      
      // Paramètres
      width: resolution,
      height: resolution,
      denoising_strength: 0.6, // Plus élevé pour vraiment colorier
      steps: 30,
      cfg_scale: 8,
      sampler_name: "Euler a",
      
      resize_mode: 0, // Just resize
    };

    console.log("Calling Stable Diffusion...");
    const sdResponse = await fetch(sdUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!sdResponse.ok) {
      const errorText = await sdResponse.text();
      console.error("SD API error:", errorText);
      return res.status(500).json({ error: "Stable Diffusion error", details: errorText });
    }

    const sdData = await sdResponse.json();

    if (!sdData.images || !sdData.images[0]) {
      console.error("No image in SD response");
      return res.status(500).json({ error: "No image generated" });
    }

    const paintedBase64 = sdData.images[0];
    console.log("Success! Painted texture size:", paintedBase64.length, "chars");

    return res.json({ imageBase64: paintedBase64 });
    
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});