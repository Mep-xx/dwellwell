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

/** Make whatever the server returns into an absolute URL on the API origin. */
function absolutizeFromApiBase(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const trimmed = String(pathOrUrl)
    .replace(/^\/?api\/?/, "")
    .replace(/^\/+/, "");

  if (import.meta.env.DEV && trimmed.startsWith("uploads/")) {
    return `/${trimmed}`; // Vite proxy in dev
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

        // Primary (matches your API route)
        try {
          data = await send(`/homes/${encodeURIComponent(homeId)}/image`);
        } catch {
          // Optional fallbacks; okay to remove if unused
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
    <div className="rounded-lg border p-3">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded border-2 border-dashed p-4 text-center ${
          isDragActive ? "bg-muted/50" : ""
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm">
          Drag &amp; drop an image here, or <span className="underline">click to select</span>.<br />
          <span className="text-xs text-muted-foreground">Recommended size 800×400px • Max 5MB</span>
        </p>
        {busy && <p className="mt-2 text-xs">Uploading…</p>}
        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      </div>

      {showPreview && preview && (
        <div className="mt-3 flex items-center gap-3">
          <img src={preview} alt="Home photo preview" className="h-20 w-32 rounded object-cover border" />
          <span className="text-sm text-green-700">✅ Photo uploaded &amp; saved</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;