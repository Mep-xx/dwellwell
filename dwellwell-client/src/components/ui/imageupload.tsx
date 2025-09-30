//dwellwell-client/src/components/ui/imageupload.tsx
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/utils/api";
import { getApiOrigin } from "@/utils/url";

type Props = {
  homeId: string;
  onUploadComplete: (absoluteUrl: string) => void;
  disabled?: boolean;
  showPreview?: boolean;
};

/** Normalize a path returned by the API into an absolute URL. */
function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const trimmed = String(pathOrUrl)
    .replace(/^\/?api\/?/, "")
    .replace(/^\/+/, "");

  // In dev, prefer relative path so Vite’s proxy can serve /uploads
  if (import.meta.env.DEV && trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }
  return `${getApiOrigin()}/${trimmed}`;
}

export function ImageUpload({
  homeId,
  onUploadComplete,
  disabled = false,
  showPreview = false,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted.length || !homeId) return;
      const file = accepted[0];

      // Guard: 0-byte or non-image file
      if (!file || !file.size) {
        setErr("Selected file is empty.");
        return;
      }
      if (file.type && !file.type.startsWith("image/")) {
        setErr("Please select an image file.");
        return;
      }

      const send = async (endpoint: string) => {
        const fd = new FormData();
        fd.append("image", file, file.name);
        const res = await api.post(endpoint, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      };

      try {
        setBusy(true);
        setErr(null);

        let data: any;

        // Primary (matches your API route)
        try {
          data = await send(`/homes/${encodeURIComponent(homeId)}/image`);
        } catch {
          // Optional fallbacks; safe to remove if unused on the server
          try {
            data = await send(`/homes/${encodeURIComponent(homeId)}/upload`);
          } catch {
            data = await send(`/homes/upload-image?homeId=${encodeURIComponent(homeId)}`);
          }
        }

        const candidate: string | undefined =
          data?.url ||
          data?.imageUrl ||
          data?.location ||
          data?.path ||
          data?.filePath ||
          data?.filename ||
          data?.key;

        if (!candidate) throw new Error("Upload response missing image url");

        const absolute = absolutizeFromApiBase(candidate);
        setPreview(absolute);
        onUploadComplete(absolute);
      } catch (e: any) {
        if (import.meta.env.DEV) console.warn("Image upload failed:", e);
        setErr(e?.response?.data?.error || "Failed to upload image. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [homeId, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    disabled: disabled || busy,
    maxSize: 5 * 1024 * 1024,
    accept: { "image/*": [] },
    multiple: false,
    onDropRejected: () => setErr("File not accepted. Ensure it's an image under 5MB."),
  });

  return (
    <div className="rounded-lg border-token border bg-surface p-3">
      <div
        {...getRootProps()}
        aria-label="Upload home image"
        className={`cursor-pointer rounded border-2 border-dashed p-4 text-center outline-none focus:ring-2 focus:ring-brand-primary ${
          isDragActive ? "bg-muted/50" : "bg-card"
        } ${isDragReject ? "ring-2 ring-brand-primary/40" : ""}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-body">
          Drag &amp; drop an image here, or <span className="underline">click to select</span>.<br />
          <span className="text-xs text-muted-foreground">Recommended size 800×400px • Max 5MB</span>
        </p>
        {busy && <p className="mt-2 text-xs text-muted-foreground">Uploading…</p>}
        {err && (
          <p className="mt-2 text-xs text-body" role="alert">
            {err}
          </p>
        )}
      </div>

      {showPreview && preview && (
        <div className="mt-3 flex items-center gap-3">
          <img
            src={preview}
            alt="Home photo preview"
            className="h-20 w-32 rounded object-cover border-token border"
            loading="lazy"
            decoding="async"
          />
          <span className="text-sm text-body">✅ Photo uploaded &amp; saved</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
