import React, { useRef } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

interface FileUploaderProps {
  accept: string;
  label: string;
  onFileSelect: (file: File) => void;
  selectedFileName?: string;
  onClear: () => void;
  icon?: 'image' | 'json';
}

export const FileUploader: React.FC<FileUploaderProps> = ({ 
  accept, 
  label, 
  onFileSelect, 
  selectedFileName, 
  onClear,
  icon = 'image'
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={inputRef}
        onChange={handleChange}
        accept={accept}
        className="hidden"
      />
      
      {!selectedFileName ? (
        <button
          onClick={handleClick}
          className="w-full h-24 border-2 border-dashed border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-gray-800/50 transition-all flex flex-col items-center justify-center gap-2 group"
        >
          {icon === 'image' ? (
            <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-emerald-400" />
          ) : (
            <FileText className="w-6 h-6 text-gray-500 group-hover:text-emerald-400" />
          )}
          <span className="text-sm text-gray-400 group-hover:text-gray-300 font-medium">
            {label}
          </span>
        </button>
      ) : (
        <div className="w-full h-16 bg-gray-800 border border-emerald-500/30 rounded-lg flex items-center justify-between px-4">
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="w-8 h-8 bg-emerald-900/40 rounded flex items-center justify-center flex-shrink-0">
                {icon === 'image' ? (
                  <ImageIcon size={16} className="text-emerald-400" />
                ) : (
                  <FileText size={16} className="text-emerald-400" />
                )}
             </div>
             <span className="text-sm text-gray-200 truncate">{selectedFileName}</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              if (inputRef.current) inputRef.current.value = '';
            }}
            className="p-1 hover:bg-gray-700 rounded-full text-gray-500 hover:text-red-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};