export type TrackableLookup = {
  model: string;
  brand: string;
  type: string;
  category: string;
  notes?: string;
  imageUrl?: string;
};

const ApplianceCatalog: TrackableLookup[] = [
  {
    model: 'SilencePlus 44 dBA',
    brand: 'Bosch',
    type: 'Dishwasher',
    category: 'kitchen',
    notes: 'Extremely quiet, clean filter every 2-3 months.',
  },
  {
    model: 'WF45T6000AW',
    brand: 'Samsung',
    type: 'Washing Machine',
    category: 'appliance',
    notes: 'HE detergent only. Run drum clean cycle monthly.',
  },
  {
    model: 'WT7300CW',
    brand: 'LG',
    type: 'Washing Machine',
    category: 'appliance',
    notes: 'Smart Wi-Fi enabled, auto-balancing system.',
  },
  {
    model: 'RH22H9010SR',
    brand: 'Samsung',
    type: 'Refrigerator',
    category: 'appliance',
    notes: 'French door, clean coils every 6 months.',
  },
  {
    model: 'KMHS120ESS',
    brand: 'KitchenAid',
    type: 'Microwave',
    category: 'kitchen',
    notes: 'Over-the-range, has charcoal filter to replace yearly.',
  },
  {
    model: 'WFE550S0LZ',
    brand: 'Whirlpool',
    type: 'Electric Range',
    category: 'kitchen',
    notes: 'Glass cooktop, avoid abrasive cleaners.',
  },
  {
    model: 'Park Avenue',
    brand: 'ThermoSpas',
    type: 'Hot Tub',
    category: 'outdoor',
    notes: 'Flush quarterly, maintain pH balance weekly.',
  }
];

module.exports = { ApplianceCatalog }