// floorHelpers.ts (create this file and import it)
export const floorToLabel = (floor?: string | number) => {
    if (typeof floor === 'string') return floor;
    switch (floor) {
      case -1: return 'Basement';
      case 1: return '1st Floor';
      case 2: return '2nd Floor';
      case 3: return '3rd Floor';
      case 99: return 'Attic';
      case 0: return 'Other';
      default: return 'Other';
    }
  };
  
  export const labelToFloor = (label: string): number | null => {
    switch (label) {
      case 'Basement': return -1;
      case '1st Floor': return 1;
      case '2nd Floor': return 2;
      case '3rd Floor': return 3;
      case 'Attic': return 99;
      case 'Other': return 0;
      default: return null;
    }
  };
  