//dwellwell-client/src/components/ui/HomePhotoDropzone.tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/utils/api";
import { getApiOrigin } from "@/utils/url";

type Props = {
  homeId: string;
  imageUrl?: string | null;
  onUploaded: (absoluteUrl: string) => void;
  className?: string;
};

function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  // Normalize “/api/…”, “api/…”, “/uploads/…”, etc.
  const trimmed = String(pathOrUrl)
    .replace(/^\/?api\/?/, "")
    .replace(/^\/+/, "");

  // In dev, prefer relative path so Vite’s proxy serves /uploads
  if (import.meta.env.DEV && trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }

  return `${getApiOrigin()}/${trimmed}`;
}

export default function HomePhotoDropzone({
  homeId,
  imageUrl,
  onUploaded,
  className = "",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || !homeId) return;
      const file = accepted[0];

      const fd = new FormData();
      fd.append("image", file);

      try {
        setBusy(true);
        setError(null);

        const { data } = await api.post(
          `/homes/${encodeURIComponent(homeId)}/image`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        const candidate: string | undefined =
          data?.url || data?.imageUrl || data?.location || data?.path || data?.filePath;

        if (!candidate) throw new Error("Upload response missing image url");

        const absolute = absolutizeFromApiBase(candidate);
        onUploaded(absolute);
      } catch (e: any) {
        setError(e?.response?.data?.error || "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [homeId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 5 * 1024 * 1024,
    accept: { "image/*": [] },
    multiple: false,
    disabled: busy,
  });

  return (
    <div
      {...getRootProps()}
      className={`group relative ${className} cursor-pointer`}
      aria-label="Home photo — click or drop to replace"
      role="button"
      tabIndex={0}
    >
      <input {...getInputProps()} />

      {/* Image / placeholder */}
      {imageUrl ? (
        <img src={imageUrl} alt="Home" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center text-sm text-muted-foreground">
          No photo yet — click or drop to upload
        </div>
      )}

      {/* Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 grid place-items-center bg-black/0 transition
                    group-hover:bg-black/20 ${isDragActive ? "bg-black/30" : ""}`}
      >
        <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium opacity-0 transition group-hover:opacity-100">
          {busy ? "Uploading…" : isDragActive ? "Drop to upload" : "Click or drop to replace"}
        </div>
      </div>

      {/* Inline error badge (bottom-left) */}
      {error && (
        <div className="absolute left-2 bottom-2 rounded bg-red-600 text-white text-xs px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}
