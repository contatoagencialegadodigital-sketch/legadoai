import { useRef, useState } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, Music, Video, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  id: string;
  file: File;
  type: 'image' | 'document' | 'audio' | 'video' | 'other';
  preview?: string;
}

interface FileUploadButtonProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  selectedFiles: UploadedFile[];
  onRemoveFile: (id: string) => void;
  disabled?: boolean;
}

const ALLOWED_TYPES = {
  // Imagens
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  // Documentos
  'application/pdf': 'document',
  'application/msword': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'application/vnd.ms-excel': 'document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document',
  'text/plain': 'document',
  'text/csv': 'document',
  // Áudio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'audio/mp4': 'audio',
  'audio/x-m4a': 'audio',
  // Vídeo
  'video/mp4': 'video',
  'video/webm': 'video',
  'video/ogg': 'video',
  'video/quicktime': 'video',
};

export function useFileUpload() {
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);

  const addFiles = (newFiles: UploadedFile[]) => {
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearFiles = () => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
  };

  return { selectedFiles, addFiles, removeFile, clearFiles };
}

export function FileUploadButton({ 
  onFilesSelected, 
  selectedFiles, 
  onRemoveFile,
  disabled 
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const uploadedFiles: UploadedFile[] = files.map(file => {
      const type = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES] || 'other';
      
      let preview: string | undefined;
      if (type === 'image') {
        preview = URL.createObjectURL(file);
      }

      return {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        type,
        preview,
      };
    });

    onFilesSelected(uploadedFiles);
    
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'document': return FileText;
      case 'audio': return Music;
      case 'video': return Video;
      default: return File;
    }
  };

  return (
    <div className="flex items-center">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,audio/*,video/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="Anexar arquivo"
      >
        <Paperclip className="w-4 h-4" />
      </button>
    </div>
  );
}

export function SelectedFilesList({ 
  files, 
  onRemove 
}: { 
  files: { id: string; file: File; type: string; preview?: string }[]; 
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-t border-border/50">
      {files.map((file) => {
        const Icon = file.type === 'image' ? ImageIcon :
                     file.type === 'document' ? FileText :
                     file.type === 'audio' ? Music :
                     file.type === 'video' ? Video : File;

        return (
          <div 
            key={file.id}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm group"
          >
            {file.preview ? (
              <img 
                src={file.preview} 
                alt={file.file.name}
                className="w-6 h-6 rounded object-cover"
              />
            ) : (
              <Icon className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="max-w-[150px] truncate text-foreground">
              {file.file.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export { ALLOWED_TYPES };
export type { UploadedFile };
