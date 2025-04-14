import { Trackable } from '../../../dwellwell-api/src/shared/types/trackable';

export const mockTrackables: Trackable[] = [
  {
    id: '1',
    name: 'Bosch 300 Dishwasher',
    category: 'kitchen',
    type: 'Dishwasher',
    brand: 'Bosch',
    model: '300 Series',
    serialNumber: 'BOSCH123456',
    image: '/images/dishwasher.png',
    notes: 'Runs nightly with eco mode.',
  },
  {
    id: '2',
    name: 'ThermoSpas Hot Tub',
    category: 'outdoor',
    type: 'Hot Tub',
    brand: 'ThermoSpas',
    model: 'Park Avenue',
    serialNumber: 'SPA7890',
    image: '/images/hottub.png',
    notes: 'Drained every 4 months. Use SpaGuard chemicals.',
  },
  {
    id: '3',
    name: 'Samsung Smart Washer',
    category: 'appliance',
    type: 'Washing Machine',
    brand: 'Samsung',
    model: 'WF45T6000AW',
    serialNumber: 'SAMSWASH2022',
    image: '/images/washer.png',
    notes: 'HE detergent only. Clean lint trap monthly.',
  },
  {
    id: '4',
    name: 'Living Room Space Heater',
    category: 'heating',
    type: 'Electric Heater',
    brand: 'Vornado',
    model: 'VH202',
    serialNumber: 'VORN-2001',
    image: '/images/heater.png',
    notes: 'Inspect intake for dust before winter.',
  }
];