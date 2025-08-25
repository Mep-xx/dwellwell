import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/utils/api";

type Props = {
  homeId: string;
  onUploadComplete: (absoluteUrl: string) => void;
  disabled?: boolean;
};

/**
 * Build an absolute URL from whatever the server returns.
 * Works with:
 *   - "http(s)://..." (pass-through)
 *   - "/uploads/..." (prefix with API origin)
 *   - "uploads/..."  (prefix with API origin)
 *   - "api/uploads/..." (strip leading "api/")
 */
function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = api.defaults.baseURL ?? window.location.origin; // e.g. http://localhost:4000/api
  const apiOrigin = new URL("/", base).origin;                  // -> http://localhost:4000

  const trimmed = String(pathOrUrl)
    .replace(/^\/?api\/?/, "")  // drop leading api/
    .replace(/^\/+/, "");       // drop any leading /

  // Common shapes: "uploads/...", "/uploads/..."
  return `${apiOrigin}/${trimmed}`;
}

export function ImageUpload({ homeId, onUploadComplete, disabled = false }: Props) {
  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || !homeId) return;
      const file = accepted[0];

      const send = async (endpoint: string) => {
        const fd = new FormData();
        fd.append("image", file);
        const res = await api.post(endpoint, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      };

      try {
        // Prefer new RESTful route
        let data: any;
        try {
          data = await send(`/homes/${encodeURIComponent(homeId)}/image`);
        } catch {
          // Fallback to legacy route if you want to keep it around
          data = await send(`/homes/upload-image?homeId=${encodeURIComponent(homeId)}`);
        }

        // Accept a bunch of response shapes:
        const candidate: string | undefined =
          data?.url || data?.imageUrl || data?.location || data?.path || data?.filePath || data?.filename || data?.key;

        if (!candidate) throw new Error("Upload response missing image url");

        const absolute = absolutizeFromApiBase(candidate);
        onUploadComplete(absolute);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Failed to upload image. Please try again.");
      }
    },
    [homeId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxSize: 5 * 1024 * 1024,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-gray-600">Drop the image here…</p>
      ) : (
        <>
          <p className="text-gray-600">Drag & drop an image here, or click to select</p>
          <p className="text-xs text-gray-400">Recommended size: 800×400px. Max size: 5MB.</p>
        </>
      )}
    </div>
  );
}

export default ImageUpload;
