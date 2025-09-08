// shared/constants/houseRoomTemplates.ts
export const HOUSE_ROOM_TEMPLATES: Record<string, { name: string; type: string; floor?: number }[]> = {

  Colonial: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Playroom', type: 'Playroom', floor: 1 }, // common on main level
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Nursery', type: 'Nursery', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
    { name: 'Library / Study', type: 'Library / Study', floor: 2 },
  ],

  Ranch: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Guest Room', type: 'Guest Room', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Laundry Room', type: 'Laundry Room', floor: 1 },
    { name: 'Sunroom', type: 'Sunroom', floor: 1 },
  ],

  Cape: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Bedroom 1', type: 'Bedroom', floor: 2 },
    { name: 'Bedroom 2', type: 'Bedroom', floor: 2 },
    { name: 'Nursery', type: 'Nursery', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
  ],

  Victorian: [
    { name: 'Parlor', type: 'Living Room', floor: 1 },
    { name: 'Formal Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Library', type: 'Library / Study', floor: 2 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
  ],

  Craftsman: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Study', type: 'Library / Study', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Workshop', type: 'Workshop', floor: -1 }, // basements are common
  ],

  Modern: [
    { name: 'Great Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Home Office', type: 'Office', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Home Gym', type: 'Home Gym', floor: 1 },
    { name: 'Theater', type: 'Theater / Media Room', floor: -1 },
  ],

  Farmhouse: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Mudroom', type: 'Mudroom', floor: 1 },
    { name: 'Sunroom', type: 'Sunroom', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Guest Bedroom', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
  ],

  Tudor: [
    { name: 'Great Hall', type: 'Living Room', floor: 1 },
    { name: 'Formal Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Library', type: 'Library / Study', floor: 2 },
    { name: 'Master Suite', type: 'Bedroom', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
  ],

  Mediterranean: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Formal Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Courtyard Entry', type: 'Entryway', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Sunroom', type: 'Sunroom', floor: 1 },
  ],

  SplitLevel: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Family Room', type: 'Living Room', floor: 2 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
    { name: 'Home Gym', type: 'Home Gym', floor: -1 },
  ],

  Contemporary: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Home Office', type: 'Office', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
    { name: 'Media Room', type: 'Theater / Media Room', floor: -1 },
  ],

  Cottage: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Sunroom', type: 'Sunroom', floor: 1 },
  ],

  LogCabin: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Loft', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Workshop', type: 'Workshop', floor: -1 },
  ],

  Townhouse: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Dining Room', type: 'Dining Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Guest Room', type: 'Guest Room', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
    { name: 'Laundry Room', type: 'Laundry Room', floor: 2 },
  ],

  Bungalow: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Guest Room', type: 'Guest Room', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Sunroom', type: 'Sunroom', floor: 1 },
  ],

  // ➕ New Additions Below

  RaisedRanch: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Family Room', type: 'Living Room', floor: -1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Home Gym', type: 'Home Gym', floor: -1 },
  ],

  AFrame: [
    { name: 'Open Living Area', type: 'Living Room', floor: 1 },
    { name: 'Kitchenette', type: 'Kitchen', floor: 1 },
    { name: 'Loft Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Sun Nook', type: 'Sunroom', floor: 1 },
  ],

  Chalet: [
    { name: 'Great Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Master Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Loft Guest Room', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Media Loft', type: 'Theater / Media Room', floor: 2 },
  ],

  Duplex: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Bedroom 1', type: 'Bedroom', floor: 1 },
    { name: 'Bedroom 2', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
    { name: 'Laundry Room', type: 'Laundry Room', floor: 1 },
  ],

  Manufactured: [
    { name: 'Living Room', type: 'Living Room', floor: 1 },
    { name: 'Kitchen', type: 'Kitchen', floor: 1 },
    { name: 'Primary Bedroom', type: 'Bedroom', floor: 1 },
    { name: 'Guest Room', type: 'Guest Room', floor: 1 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
    { name: 'Laundry Area', type: 'Laundry Room', floor: 1 },
  ],

  TinyHome: [
    { name: 'Living Area', type: 'Living Room', floor: 1 },
    { name: 'Kitchenette', type: 'Kitchen', floor: 1 },
    { name: 'Loft Sleeping Area', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 1 },
  ],

  CarriageHouse: [
    { name: 'Garage', type: 'Garage', floor: 1 }, // fixed type
    { name: 'Living Area', type: 'Living Room', floor: 2 },
    { name: 'Kitchenette', type: 'Kitchen', floor: 2 },
    { name: 'Bedroom', type: 'Bedroom', floor: 2 },
    { name: 'Bathroom', type: 'Bathroom', floor: 2 },
  ],
};
