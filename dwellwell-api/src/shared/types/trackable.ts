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
  name: string;
  category: TrackableCategory;
  type: string; // e.g. 'Dishwasher', 'Microwave'
  brand?: string;
  model?: string;
  serialNumber?: string;
  image?: string;
  notes?: string;
};