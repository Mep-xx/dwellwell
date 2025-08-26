// src/components/ui/imageupload.tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/utils/api";

type Props = {
  homeId: string;
  onUploadComplete: (absoluteUrl: string) => void;
  disabled?: boolean;
};

/** Make whatever the server returns into an absolute URL on the API origin. */
function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = api.defaults.baseURL ?? window.location.origin; // e.g. http://localhost:4000/api
  const apiOrigin = new URL("/", base).origin;                  // -> http://localhost:4000
  const trimmed = String(pathOrUrl).replace(/^\/?api\/?/, "").replace(/^\/+/, "");
  return `${apiOrigin}/${trimmed}`;
}

export function ImageUpload({ homeId, onUploadComplete, disabled = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

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
        setBusy(true);
        setErr(null);

        let data: any;
        try {
          // Preferred new route
          data = await send(`/homes/${encodeURIComponent(homeId)}/image`);
        } catch {
          // Optional legacy fallback
          data = await send(`/homes/upload-image?homeId=${encodeURIComponent(homeId)}`);
        }

        const candidate: string | undefined =
          data?.url || data?.imageUrl || data?.location || data?.path || data?.filePath || data?.filename || data?.key;

        if (!candidate) throw new Error("Upload response missing image url");

        const absolute = absolutizeFromApiBase(candidate);
        setPreview(absolute);          // 👈 show thumbnail right away
        onUploadComplete(absolute);    // 👈 notify parent (wizard)
      } catch (e: any) {
        console.error("Image upload failed:", e);
        setErr(e?.response?.data?.error || "Failed to upload image. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [homeId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || busy,
    maxSize: 5 * 1024 * 1024,
    accept: { "image/*": [] },
    multiple: false,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          disabled || busy ? "opacity-50 cursor-not-allowed" : "border-gray-300 hover:bg-gray-50"
        }`}
        aria-busy={busy || undefined}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-gray-600">Drop the image here…</p>
        ) : (
          <>
            <p className="text-gray-600">
              {busy ? "Uploading…" : "Drag & drop an image here, or click to select"}
            </p>
            <p className="text-xs text-gray-400">Recommended size: 800×400px. Max size: 5MB.</p>
          </>
        )}
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      {preview && (
        <div className="flex items-center gap-3">
          <img
            src={preview}
            alt="Home photo preview"
            className="h-20 w-32 rounded object-cover border"
          />
          <span className="text-sm text-green-700">✅ Photo uploaded & saved</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
