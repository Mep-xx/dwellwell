// src/components/ui/imageupload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/utils/api';

type Props = {
  onUploadComplete: (filename: string) => void;
};

export function ImageUpload({ onUploadComplete }: Props) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/homes/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { filename } = res.data;
      onUploadComplete(filename); // 🛠️ only the filename, no '/uploads/' prefix
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: 5 * 1024 * 1024 });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-600">Drop the image here...</p>
      ) : (
        <div>
          <p className="text-gray-600">Drag and drop an image here, or click to select</p>
          <p className="text-xs text-gray-400">Recommended size: 800x400px. Max size: 5MB.</p>
        </div>
      )}
    </div>
  );
}
