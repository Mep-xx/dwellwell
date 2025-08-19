// src/components/ui/imageupload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/utils/api';

type Props = {
  homeId: string;
  onUploadComplete: (filename: string) => void;
  disabled?: boolean;
};

export function ImageUpload({ homeId, onUploadComplete, disabled = false }: Props) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !homeId) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('image', file); // 🛠️ only the image, not the homeId

    try {
      const res = await api.post(`/homes/upload-image?homeId=${homeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { filename } = res.data;
      onUploadComplete(filename); // this should be 'homes/{homeId}/main.jpg'
    } catch (err) {
      console.error('Image upload failed:', err);
    }
  }, [onUploadComplete, homeId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize: 5 * 1024 * 1024,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'
      }`}
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
