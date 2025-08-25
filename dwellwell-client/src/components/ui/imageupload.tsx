// dwellwell-client/src/components/ui/imageupload.tsx
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api } from '@/utils/api';

type Props = {
  homeId: string;
  onUploadComplete: (absoluteUrl: string) => void; // server may return relative; we normalize
  disabled?: boolean;
};

function toAbsoluteFromAPI(relativeOrAbsolute: string) {
  if (!relativeOrAbsolute) return '';
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;

  // Build absolute from API base (strip trailing /api)
  const apiBase = String(import.meta.env.VITE_API_BASE_URL || '');
  const origin = apiBase.replace(/\/api\/?$/i, '') || window.location.origin;

  // Common patterns: "/uploads/..."; "uploads/..."; "homes/<id>/main.jpg"
  const trimmed = relativeOrAbsolute.replace(/^\/?/, '');
  if (trimmed.startsWith('uploads/')) return `${origin}/${trimmed}`;
  // Fallback to serving under /uploads
  return `${origin}/uploads/${trimmed}`;
}

export function ImageUpload({ homeId, onUploadComplete, disabled = false }: Props) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0 || !homeId) return;

      const file = acceptedFiles[0];

      const tryUpload = async (endpoint: string) => {
        const formData = new FormData();
        formData.append('image', file); // field name expected by the server
        const res = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data;
      };

      try {
        // Primary endpoint (matches the server route above)
        let data: any;
        try {
          data = await tryUpload(`/homes/upload-image?homeId=${encodeURIComponent(homeId)}`);
        } catch {
          // Common alternates if you change routing later
          try {
            data = await tryUpload(`/homes/${encodeURIComponent(homeId)}/image`);
          } catch {
            data = await tryUpload(`/uploads`);
          }
        }

        // Accept various server response shapes
        const candidate: string | undefined =
          data?.url ??
          data?.imageUrl ??
          data?.location ??
          data?.path ??
          data?.filePath ??
          data?.filename ??
          data?.key;

        if (!candidate) throw new Error('Upload response missing url');

        onUploadComplete(toAbsoluteFromAPI(String(candidate)));
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
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'
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
