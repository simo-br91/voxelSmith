import React from 'react';
import { GeneratedAsset } from '../types';
import { Download, Trash2, Maximize2 } from 'lucide-react';

interface HistoryGalleryProps {
  assets: GeneratedAsset[];
  onSelect: (asset: GeneratedAsset) => void;
  onDelete: (id: string) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ assets, onSelect, onDelete }) => {
  if (assets.length === 0) return null;

  return (
    <div className="w-full mt-12 border-t border-gray-800 pt-8">
      <h3 className="text-xl font-bold text-gray-300 mb-6 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        Recent Forges
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            className="group relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition-all"
          >
            <div 
              className="aspect-square cursor-pointer overflow-hidden"
              onClick={() => onSelect(asset)}
            >
              <img 
                src={asset.imageUrl} 
                alt="Generated voxel asset" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
               <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(asset.id);
                }}
                className="p-1.5 bg-red-500/90 text-white rounded-md hover:bg-red-600 backdrop-blur-sm"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
               <span className="text-xs text-white font-medium bg-gray-900/80 px-2 py-1 rounded backdrop-blur-sm capitalize">
                {asset.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
