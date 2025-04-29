// /dwellwell-client/src/components/ui/ImageUpload.tsx
import { useState, ChangeEvent } from 'react';
import { api } from '@/utils/api';

type Props = {
  onUploadComplete: (url: string) => void;
};

export function ImageUpload({ onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Max 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/api/upload-home-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onUploadComplete(res.data.url);
    } catch (err) {
      console.error(err);
      setError('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-all">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        id="home-image-upload"
        onChange={handleFileChange}
      />
      <label htmlFor="home-image-upload" className="cursor-pointer block space-y-2">
        <div className="text-gray-500 text-sm">
          Drag and drop an image here, or <span className="underline">browse</span>
        </div>
        <div className="text-xs text-gray-400">
          Recommended size: 500px wide x 160px high<br />
          Max 5MB
        </div>
      </label>
      {uploading && <div className="mt-2 text-blue-600 text-sm">Uploading...</div>}
      {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
    </div>
  );
}
