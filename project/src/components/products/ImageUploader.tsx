import { useState, useCallback } from 'react';
import { X, Upload, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface UploadedImage {
  id: string;
  file?: File;
  url?: string;
  sort_order: number;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 6 * 1024 * 1024;

export const ImageUploader = ({
  images,
  onImagesChange,
  maxImages = 9,
  disabled = false,
}: ImageUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const reindex = (list: UploadedImage[]): UploadedImage[] =>
    list.map((img, idx) => ({ ...img, sort_order: idx }));

  const addFiles = useCallback(
    (files: File[]) => {
      setValidationError(null);

      if (images.length >= maxImages) {
        setValidationError(`Maksimal ${maxImages} gambar`);
        return;
      }

      const remaining = maxImages - images.length;
      const toAdd = files.slice(0, remaining);

      const valid: UploadedImage[] = [];
      const rejected: string[] = [];

      for (const file of toAdd) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          rejected.push(`${file.name}: format tidak didukung`);
          continue;
        }
        if (file.size > MAX_SIZE) {
          rejected.push(`${file.name}: ukuran melebihi 6MB`);
          continue;
        }
        valid.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          sort_order: 0,
        });
      }

      if (rejected.length > 0) {
        setValidationError(rejected.join('; '));
      }

      if (valid.length > 0) {
        onImagesChange(reindex([...images, ...valid]));
      }
    },
    [images, maxImages, onImagesChange]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) addFiles(Array.from(files));
    e.currentTarget.value = '';
  };

  const removeImage = (id: string) => {
    setValidationError(null);
    onImagesChange(reindex(images.filter((img) => img.id !== id)));
  };

  const isFull = images.length >= maxImages;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl transition-colors ${
          disabled || isFull
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
            : dragActive
              ? 'border-[#1B4332] bg-[#1B4332]/5'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="image-upload-input"
          disabled={disabled || isFull}
        />
        <label
          htmlFor="image-upload-input"
          className={`flex flex-col items-center justify-center py-10 px-4 ${
            disabled || isFull ? 'pointer-events-none' : 'cursor-pointer'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
              dragActive ? 'bg-[#1B4332]/10' : 'bg-slate-100'
            }`}
          >
            <Upload
              className={`w-5 h-5 ${dragActive ? 'text-[#1B4332]' : 'text-slate-400'}`}
            />
          </div>
          <p className="text-sm font-medium text-slate-900">
            {isFull ? 'Batas gambar tercapai' : 'Drag gambar atau klik untuk pilih'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            JPEG, PNG, WebP &bull; Maks 6MB per file
          </p>
          <p className="text-sm font-semibold text-[#1B4332] mt-3">
            {images.length} / {maxImages} gambar
          </p>
        </label>
      </div>

      {/* Validation Error */}
      {validationError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {validationError}
        </p>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <div key={image.id} className="relative group">
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                {image.file ? (
                  <img
                    src={URL.createObjectURL(image.file)}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : image.url ? (
                  <img
                    src={image.url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  </div>
                )}
              </div>

              {/* Utama badge on first image */}
              {idx === 0 && (
                <Badge className="absolute top-2 left-2 bg-[#1B4332] text-white text-[10px] px-1.5 py-0.5">
                  Utama
                </Badge>
              )}

              {/* Delete button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Minimum image warning */}
      {images.length === 0 && (
        <p className="text-sm text-red-600 font-medium">
          Minimal 1 gambar wajib diupload
        </p>
      )}
    </div>
  );
};
