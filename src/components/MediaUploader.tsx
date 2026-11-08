import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, FileText, Image as ImageIcon, Video, Music, X, Check, Eye, Trash2, ArrowUpRight } from 'lucide-react';

export interface UploadedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'audio' | 'video';
  size: string;
  dataUrl: string;
  uploadedAt: string;
}

interface MediaUploaderProps {
  onMediaSelect?: (media: UploadedMediaItem) => void;
  onSendToChat?: (media: UploadedMediaItem) => void;
}

export default function MediaUploader({ onMediaSelect, onSendToChat }: MediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadedMediaItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<UploadedMediaItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    Array.from(fileList).forEach((file) => {
      // Determine file category
      let category: 'image' | 'pdf' | 'audio' | 'video' = 'image';
      if (file.type.includes('pdf')) category = 'pdf';
      else if (file.type.includes('audio')) category = 'audio';
      else if (file.type.includes('video')) category = 'video';
      else if (file.type.includes('image')) category = 'image';

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = (e.target?.result as string) || '';
        const newItem: UploadedMediaItem = {
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: category,
          size: formatFileSize(file.size),
          dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setUploads((prev) => [newItem, ...prev]);
        if (onMediaSelect) onMediaSelect(newItem);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUpload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setUploads((prev) => prev.filter((item) => item.id !== id));
    if (previewItem?.id === id) setPreviewItem(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <UploadCloud size={16} className="text-red-600" />
            Multimodal Academic Media Hub
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Upload marksheets, project videos, voice statements & transcripts</p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {uploads.length} Files Ready
        </span>
      </div>

      {/* Drag & Drop Surface */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging 
            ? 'border-red-500 bg-red-50/40 scale-[0.99]' 
            : 'border-slate-300 hover:border-red-400 hover:bg-slate-50/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,audio/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex justify-center gap-3 text-slate-400 mb-2">
          <ImageIcon size={20} className="hover:text-red-500 transition-colors" />
          <FileText size={20} className="hover:text-red-500 transition-colors" />
          <Music size={20} className="hover:text-red-500 transition-colors" />
          <Video size={20} className="hover:text-red-500 transition-colors" />
        </div>
        <p className="text-xs font-bold text-slate-800">
          Drop transcripts, images, audio notes or MP4 videos here
        </p>
        <p className="text-[11px] text-slate-400 mt-1">or click to browse from local drive</p>
      </div>

      {/* Uploaded Items Grid */}
      {uploads.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
            <span>Uploaded Assets ({uploads.length})</span>
            <button onClick={() => setUploads([])} className="text-rose-500 hover:underline cursor-pointer">Clear All</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {uploads.map((item) => (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-slate-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    {item.type === 'image' && <ImageIcon size={14} className="text-sky-600" />}
                    {item.type === 'pdf' && <FileText size={14} className="text-red-600" />}
                    {item.type === 'audio' && <Music size={14} className="text-emerald-600" />}
                    {item.type === 'video' && <Video size={14} className="text-purple-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400">{item.size} · {item.type.toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onSendToChat && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSendToChat(item); }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Send to AI Assistant"
                    >
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => removeUpload(item.id, e)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-800 truncate">{previewItem.name}</h4>
                  <p className="text-[10px] text-slate-400">{previewItem.type.toUpperCase()} · {previewItem.size}</p>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center bg-slate-900 rounded-xl overflow-hidden max-h-96 min-h-48 p-2">
                {previewItem.type === 'image' && (
                  <img src={previewItem.dataUrl} alt={previewItem.name} className="max-h-80 object-contain rounded" />
                )}
                {previewItem.type === 'video' && (
                  <video src={previewItem.dataUrl} controls className="max-h-80 w-full rounded" />
                )}
                {previewItem.type === 'audio' && (
                  <div className="p-6 text-center w-full">
                    <Music className="mx-auto text-emerald-400 mb-3" size={40} />
                    <audio src={previewItem.dataUrl} controls className="w-full" />
                  </div>
                )}
                {previewItem.type === 'pdf' && (
                  <div className="p-6 text-center text-white">
                    <FileText className="mx-auto text-red-400 mb-3" size={48} />
                    <p className="text-xs font-bold">PDF Document Ready</p>
                    <p className="text-[11px] text-slate-400 mt-1">Ready for automated OCR and Marksheet extraction</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {onSendToChat && (
                  <button
                    onClick={() => { onSendToChat(previewItem); setPreviewItem(null); }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Attach to Multi-AI Chat</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
