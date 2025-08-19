// dwellwell-client/src/components/ui/imageupload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/utils/api';

type Props = {
  homeId: string;
  onUploadComplete: (absoluteUrl: string) => void; // server returns absolute URL now
  disabled?: boolean;
};

export function ImageUpload({ homeId, onUploadComplete, disabled = false }: Props) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || !homeId) return;

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        // NOTE: api baseURL already includes /api – so do NOT prefix '/api' here
        const res = await api.post(
          `/homes/upload-image?homeId=${encodeURIComponent(homeId)}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        // Server responds with { url, path, fileName }
        const url: string | undefined = res.data?.url;
        if (!url) throw new Error('Upload response missing url');

        onUploadComplete(url); // pass absolute URL back to the parent
      } catch (err) {
        console.error('Image upload failed:', err);
        alert('Failed to upload image. Please try again.');
      }
    },
    [homeId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize: 5 * 1024 * 1024,
    accept: { 'image/*': [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'
        }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-600">Drop the image here…</p>
      ) : (
        <div>
          <p className="text-gray-600">Drag & drop an image here, or click to select</p>
          <p className="text-xs text-gray-400">Recommended size: 800×400px. Max size: 5MB.</p>
        </div>
      )}
    </div>
  );
}
