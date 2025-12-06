export const convertBedrockToObj = (jsonString: string): string => {
  try {
    const data = JSON.parse(jsonString);
    const geometry = data["minecraft:geometry"]?.[0];
    if (!geometry) return "# No geometry found";

    const bones = geometry.bones;
    let objOutput = `# Exported from VoxelSmith\n# Geometry: ${geometry.description.identifier}\n\n`;
    
    let vertexCount = 1;
    let uvCount = 1;
    let normalCount = 1;

    // Helper to add a cube
    const addCube = (origin: number[], size: number[]) => {
      const [x, y, z] = origin;
      const [w, h, d] = size;
      const x2 = x + w;
      const y2 = y + h;
      const z2 = z + d;

      // Vertices
      // 0: x, y, z
      // 1: x2, y, z
      // 2: x2, y2, z
      // 3: x, y2, z
      // 4: x, y, z2
      // 5: x2, y, z2
      // 6: x2, y2, z2
      // 7: x, y2, z2
      
      const vertices = [
        [x, y, z], [x2, y, z], [x2, y2, z], [x, y2, z],     // Front (z)
        [x, y, z2], [x2, y, z2], [x2, y2, z2], [x, y2, z2]  // Back (z2)
      ];

      vertices.forEach(v => {
        // Simple scaling to match visually roughly 1 unit = 16 pixels
        objOutput += `v ${v[0] * 0.0625} ${v[1] * 0.0625} ${v[2] * 0.0625}\n`;
      });

      // Define faces (quads) - standard box mapping logic
      // Front, Back, Top, Bottom, Right, Left
      // Note: OBJ indices are 1-based
      // We are just outputting geometry faces here, UVs are complex to map perfectly without a full atlas calculator
      // So we output basic faces.
      
      const faces = [
        [4, 3, 2, 1], // Front (Note: winding order might need adjustment based on coordinate system)
        [2, 6, 5, 1], // Right
        [6, 7, 8, 5], // Back
        [8, 4, 1, 5], // Left
        [8, 7, 3, 4], // Top
        [1, 2, 6, 5], // Bottom (Incorrect indices logic here, simplifying for basic box)
      ];
      
      // Correct standard indices for a cube formed by 8 verts
      // v1(000) v2(100) v3(110) v4(010)
      // v5(001) v6(101) v7(111) v8(011)
      
      // Front: 4 3 2 1
      // Back: 5 6 7 8
      // Top: 4 8 7 3
      // Bottom: 1 2 6 5
      // Right: 2 3 7 6
      // Left: 5 8 4 1
      
      const start = vertexCount;
      objOutput += `f ${start+3} ${start+2} ${start+1} ${start}\n`; // Front
      objOutput += `f ${start+4} ${start+5} ${start+6} ${start+7}\n`; // Back
      objOutput += `f ${start+3} ${start+7} ${start+6} ${start+2}\n`; // Top
      objOutput += `f ${start} ${start+1} ${start+5} ${start+4}\n`; // Bottom
      objOutput += `f ${start+1} ${start+2} ${start+6} ${start+5}\n`; // Right
      objOutput += `f ${start+4} ${start+7} ${start+3} ${start}\n`; // Left

      vertexCount += 8;
    };

    bones.forEach((bone: any) => {
      if (bone.cubes) {
        objOutput += `o ${bone.name}\n`;
        bone.cubes.forEach((cube: any) => {
          addCube(cube.origin, cube.size);
        });
      }
    });

    return objOutput;
  } catch (e) {
    console.error("OBJ Export Error", e);
    return "# Error exporting OBJ";
  }
};
