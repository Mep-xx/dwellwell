export type TrackableCategory =
  | 'appliance'
  | 'kitchen'
  | 'bathroom'
  | 'outdoor'
  | 'safety'
  | 'heating'
  | 'cooling'
  | 'electrical'
  | 'plumbing'
  | 'general';

export type Trackable = {
  id: string;
  userDefinedName: string;
  brand: string;
  model: string;
  type: string;
  category: string;
  serialNumber?: string;
  imageUrl?: string;
  notes?: string;
  applianceCatalogId?: string;
  homeId: string;
  roomId?: string | null;
  createdAt: string;
};
