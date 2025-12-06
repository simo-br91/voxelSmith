import React, { useState, useEffect } from 'react';
import { Download, Wand2, Box, PaintBucket, FileJson, FileCode, Palette, Settings } from 'lucide-react';
import { generateVoxelAsset } from '../services/geminiService';
import { GeneratedAsset, GenerationMode, TextureTemplate } from '../types';
import { Button } from './Button';
import { HistoryGallery } from './HistoryGallery';
import { CubePreview } from './CubePreview';
import { DEFAULT_PROMPT, DWARF_MODEL_JSON } from '../constants';
import { convertBedrockToObj } from '../utils/objExporter';
import { generateTemplateFromGeo } from '../utils/textureUtils';

export const VoxelGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GenerationMode>('concept');
  
  // Inputs
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [textureSize, setTextureSize] = useState<number>(128);
  
  // Painter State
  const [template, setTemplate] = useState<TextureTemplate | null>(null);
  const [geoJson, setGeoJson] = useState<string>(""); 
  
  // General State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAsset, setCurrentAsset] = useState<GeneratedAsset | null>(null);
  const [history, setHistory] = useState<GeneratedAsset[]>([]);

  // Init
  useEffect(() => {
    // Load History
    const saved = localStorage.getItem('voxelsmith_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  // Update template whenever texture size changes
  useEffect(() => {
    generateTemplateFromGeo(DWARF_MODEL_JSON, textureSize)
      .then(result => {
        setTemplate(result.template);
        setGeoJson(result.updatedGeoJson);
      })
      .catch(console.error);
  }, [textureSize]);

  useEffect(() => {
    localStorage.setItem('voxelsmith_history', JSON.stringify(history));
  }, [history]);

  // Actions
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      let asset: GeneratedAsset;

      if (activeTab === 'painter') {
        if (!template) throw new Error("Template not initialized.");
        asset = await generateVoxelAsset(prompt, 'painter', {
            prompt,
            template
        });
      } else {
        asset = await generateVoxelAsset(prompt, 'concept');
      }

      setCurrentAsset(asset);
      setHistory(prev => [asset, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to generate asset.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentAsset?.id === id) {
      setCurrentAsset(null);
    }
  };

  const handleDownload = (asset: GeneratedAsset) => {
    const link = document.createElement('a');
    link.href = asset.imageUrl;
    link.download = `voxelsmith-${asset.type}-${asset.id.slice(0, 8)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Tab Switcher */}
          <div className="bg-gray-800/50 p-1 rounded-xl flex gap-1 border border-gray-700">
             <button 
              onClick={() => { setActiveTab('concept'); setPrompt(DEFAULT_PROMPT); }}
              className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'concept' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
             >
               <Box size={18} />
               Geometry Forge
             </button>
             <button 
              onClick={() => { setActiveTab('painter'); setPrompt("Dark iron armor, rune engraved beard, glowing blue eyes, battle worn."); }}
              className={`flex-1 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'painter' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
             >
               <PaintBucket size={18} />
               Texture Painter
             </button>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 backdrop-blur-sm">
            
            <div className="mb-6">
               <h3 className="text-gray-200 font-bold flex items-center gap-2 mb-2">
                 {activeTab === 'concept' ? 'Step 1: Concept' : 'Step 2: Paint'}
               </h3>
               <p className="text-sm text-gray-400">
                 {activeTab === 'concept' 
                   ? 'Generate a visual concept and download the base geometry.' 
                   : 'Generate a perfectly mapped texture for the geometry.'}
               </p>
            </div>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              Character Description
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none font-mono leading-relaxed mb-6"
              placeholder="Describe appearance, materials, colors..."
            />

            {/* PAINTER SPECIFIC UI: RESOLUTION & TEMPLATE */}
            {activeTab === 'painter' && (
              <div className="space-y-4 mb-6">
                
                {/* Resolution Selector */}
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-300 mb-2">
                    <Settings size={14} />
                    TEXTURE RESOLUTION
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[64, 128, 256, 512].map(res => (
                      <button
                        key={res}
                        onClick={() => setTextureSize(res)}
                        className={`py-2 px-3 rounded text-xs font-mono transition-all ${
                          textureSize === res
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {res}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Template Preview */}
                {template && (
                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                        <Palette size={16} className="text-blue-400" />
                        <span className="text-xs font-semibold text-gray-300">SEMANTIC UV MAP (AUTO-GENERATED)</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-24 h-24 bg-black border border-gray-700 shrink-0 relative">
                          <img src={template.dataUrl} className="w-full h-full" style={{ imageRendering: 'pixelated' }} />
                          <div className="absolute bottom-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] text-gray-400 font-mono">
                            {JSON.parse(geoJson)["minecraft:geometry"][0].description.texture_width}px
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-24 custom-scrollbar">
                          <div className="grid grid-cols-2 gap-2">
                              {Object.entries(template.colorMap).map(([color, name]) => (
                                <div key={color} className="flex items-center gap-2 text-xs text-gray-400">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="truncate max-w-[80px]">{name}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleGenerate} 
              isLoading={loading}
              className={`w-full h-12 text-lg ${activeTab === 'painter' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : ''}`}
              variant="primary"
              icon={<Wand2 size={20} />}
            >
              {loading ? 'Processing...' : (activeTab === 'concept' ? 'Forge Concept' : 'Paint Texture')}
            </Button>

            {error && (
              <p className="mt-3 text-sm text-red-400 bg-red-900/20 p-3 rounded border border-red-900/50">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Actions */}
        <div className="lg:col-span-7">
          <div className="sticky top-8">
            <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
              {activeTab === 'concept' ? <Box className="w-5 h-5 text-emerald-400" /> : <PaintBucket className="w-5 h-5 text-blue-400" />}
              {activeTab === 'concept' ? 'Concept Preview' : 'Texture Output'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 2D View */}
                <div className="relative aspect-square w-full bg-gray-900 rounded-2xl border-2 border-gray-700 border-dashed flex items-center justify-center overflow-hidden group">
                  {currentAsset ? (
                    <>
                      <img 
                        src={currentAsset.imageUrl} 
                        alt="Result" 
                        className="w-full h-full object-contain bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] bg-gray-800"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex justify-center">
                         <span className="text-white text-xs font-mono">2D TEXTURE</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8 opacity-50">
                       <p className="text-gray-400 text-sm font-medium">No active generation</p>
                    </div>
                  )}
                </div>

                {/* 3D View */}
                <div className="relative aspect-square w-full bg-gray-800 rounded-2xl border border-gray-700 flex items-center justify-center overflow-hidden">
                    <div className="absolute top-2 left-2 z-10">
                        <span className="text-xs font-mono text-gray-500 bg-black/20 px-2 py-1 rounded">3D PREVIEW</span>
                    </div>
                    {/* Concept mode doesn't produce a real texture map, so we only show 3D preview for Painter mode or if we used a placeholder */}
                    {activeTab === 'painter' && currentAsset ? (
                         <CubePreview textureUrl={currentAsset.imageUrl} size={180} />
                    ) : (
                         <div className="flex flex-col items-center justify-center text-gray-600">
                             <Box size={40} className="mb-2 opacity-50" />
                             <span className="text-xs">
                                 {activeTab === 'concept' ? '3D Preview unavailable in Concept Mode' : 'Paint to see 3D preview'}
                             </span>
                         </div>
                    )}
                </div>
            </div>

            {/* Downloads Area */}
            <div className="space-y-4">
                 <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
                      <FileJson size={20} className="text-emerald-400" /> 
                      Geometry Files
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                       <Button 
                         onClick={() => {
                           // USE THE UPDATED GEOJSON STATE
                           const finalJson = geoJson || DWARF_MODEL_JSON;
                           const blob = new Blob([finalJson], { type: 'application/json' });
                           const url = URL.createObjectURL(blob);
                           const link = document.createElement('a');
                           link.href = url;
                           link.download = 'model.geo.json';
                           link.click();
                         }}
                         variant="secondary"
                         icon={<FileJson size={16} />}
                       >
                         .geo.json (Bedrock)
                       </Button>
                       <Button 
                         onClick={() => {
                           // USE THE UPDATED GEOJSON STATE
                           const finalJson = geoJson || DWARF_MODEL_JSON;
                           const objContent = convertBedrockToObj(finalJson);
                           const blob = new Blob([objContent], { type: 'text/plain' });
                           const url = URL.createObjectURL(blob);
                           const link = document.createElement('a');
                           link.href = url;
                           link.download = 'model.obj';
                           link.click();
                         }}
                         variant="secondary"
                         icon={<FileCode size={16} />}
                       >
                         .obj (Standard)
                       </Button>
                    </div>
                 </div>

               {currentAsset && (
                 <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-2 flex items-center gap-2 text-lg">
                       {currentAsset.type === 'concept' ? 'Concept Art' : 'Texture Map'}
                    </h3>
                    <Button 
                      onClick={() => handleDownload(currentAsset)}
                      variant="primary"
                      className={`w-full ${activeTab === 'painter' ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                      icon={<Download size={20} />}
                    >
                      Download PNG
                    </Button>
                 </div>
               )}
            </div>

          </div>
        </div>
      </div>

      <HistoryGallery 
        assets={history} 
        onSelect={setCurrentAsset} 
        onDelete={handleDelete}
      />
    </div>
  );
};
