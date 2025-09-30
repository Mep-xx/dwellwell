//dwellwell-client/src/utils/apiQuick.ts
import http from 'axios';

export const apiQuick = {
  trackables: {
    quickCreate: (payload: {
      roomId: string;
      homeId?: string;
      kind: string;
      category?: string | null;
      userDefinedName?: string | null;
    }) => http.post("/api/trackables/quick-create", payload),
  },
  prompts: {
    dismiss: (payload: { homeId: string; promptId: string }) =>
      http.post("/api/prompts/dismiss", payload), // optional — you can stub this 200 OK
  },
};
