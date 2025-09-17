export type TrackableCategory =
| 'appliance'
  | 'kitchen'
  | 'bathroom'
  | 'heating'
  | 'cooling'
  | 'plumbing'
  | 'electrical'
  | 'outdoor'
  | 'safety'
  | 'general'
  | 'electronics'
  | 'computing'
  | 'entertainment'
  | 'lighting'
  | 'cleaning'
  | 'tools'
  | 'furniture';

export type Trackable = {
  id: string;
  userDefinedName: string;
  brand: string;
  model: string;
  type: string;
  category: string;
  serialNumber?: string | null;
  imageUrl?: string;
  notes?: string | null;
  applianceCatalogId?: string;
  homeId: string;
  roomId?: string | null;
  createdAt: string;
};
