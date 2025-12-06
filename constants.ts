export const DEFAULT_PROMPT = `Fantasy dwarf character.
Blocky voxel style.
Wide torso, short legs, large square head.
Thick cubic beard.
Simple tunic and boots.`;

export const PAINTER_SYSTEM_PROMPT = `
You are a Minecraft-style UV texture painter.

You will receive:
- A UV template PNG where each solid color corresponds to exactly ONE cube face (e.g. "head.front", "body.back").
- A JSON "colorMap" that maps hex colors to face names (for example: "#FF0000": "head.front", "#00FF00": "body.front", etc.).
- A natural language description of the character (armor, colors, materials, etc.).

Your job:
- Use the colorMap to understand which face you are painting:
  - "head.front"  = character face and front of helmet/hood.
  - "head.back"   = back of the helmet or hair.
  - "body.front"  = chest / front armor.
  - "body.back"   = back armor or cloak.
  - "leftArm.*"   = left sleeve and hand.
  - "rightArm.*"  = right sleeve and hand.
  - "leftLeg.*" / "rightLeg.*" = pants and boots.
- Paint clean, readable pixel-art inside each colored island only.
- Keep a Minecraft-like style:
  - Blocky shapes, low detail, no tiny noisy patterns.
  - Flat or very soft shading, no realistic lighting or reflections.
  - No text, no logos, no scribbles.
- Do NOT move, resize, or distort the colored islands. They are fixed UV islands.
- Do NOT change the background (black/transparent).

Focus on:
- Placing eyes, mouth, beard, helmet details, and runes on the correct faces (e.g. only on "head.front" and "body.front").
- Keeping side and back faces visually consistent with the front, but not identical (e.g. armor wraps around).
`;

export const VIEW_PROMPT_PREFIX = "3D render of a ";

// Default Geometry (Dwarf) used for the Concept Mode downloads
export const DWARF_MODEL_JSON = JSON.stringify({
  "format_version": "1.12.0",
  "minecraft:geometry": [
    {
      "description": {
        "identifier": "geometry.dwarf",
        "texture_width": 64,
        "texture_height": 64,
        "visible_bounds_width": 3,
        "visible_bounds_height": 2.5,
        "visible_bounds_offset": [0, 1.0, 0]
      },
      "bones": [
        { "name": "root", "pivot": [0, 0, 0] },
        { 
          "name": "body", 
          "parent": "root", 
          "pivot": [0, 12, 0], 
          "cubes": [
            { "origin": [-5, 6, -3], "size": [10, 12, 6], "uv": [0, 20] } 
          ] 
        },
        { 
          "name": "head", 
          "parent": "body", 
          "pivot": [0, 18, 0], 
          "cubes": [
            { "origin": [-5, 18, -5], "size": [10, 10, 10], "uv": [0, 0] } 
          ] 
        },
        { 
          "name": "beard", 
          "parent": "head", 
          "pivot": [0, 18, -5], 
          "cubes": [
            { "origin": [-5, 18, -7], "size": [10, 8, 2], "uv": [40, 0] } 
          ] 
        },
        { 
          "name": "rightArm", 
          "parent": "body", 
          "pivot": [-5, 16, 0], 
          "cubes": [
            { "origin": [-9, 8, -3], "size": [4, 10, 6], "uv": [0, 38] } 
          ] 
        },
        { 
          "name": "leftArm", 
          "parent": "body", 
          "pivot": [5, 16, 0], 
          "cubes": [
            { "origin": [5, 8, -3], "size": [4, 10, 6], "uv": [20, 38] } 
          ] 
        },
        { 
          "name": "rightLeg", 
          "parent": "root", 
          "pivot": [-2.5, 6, 0], 
          "cubes": [
            { "origin": [-5, 0, -3], "size": [5, 6, 6], "uv": [32, 20] } 
          ] 
        },
        { 
          "name": "leftLeg", 
          "parent": "root", 
          "pivot": [2.5, 6, 0], 
          "cubes": [
            { "origin": [0, 0, -3], "size": [5, 6, 6], "uv": [32, 32] } 
          ] 
        }
      ]
    }
  ]
}, null, 2);