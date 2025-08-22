// dwellwell-client/src/utils/upload.ts
import { api } from '@/utils/api';

export async function uploadHomeImage(homeId: string, file: File) {
  const fd = new FormData();
  fd.append('homeId', homeId);
  fd.append('image', file);

  const { data } = await api.post('/homes/upload-image', fd, {
    // DO NOT set Content-Type manually; Axios will set the boundary.
    onUploadProgress: (e) => {
      // optional progress: e.loaded / (e.total ?? 1)
    },
  });
  // API returns: { filename: "/uploads/homes/<homeId>/main.jpg" }
  return data.filename as string;
}
