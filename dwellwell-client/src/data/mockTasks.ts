import { Task } from '../../../dwellwell-api/src/shared/types/task';

export const categoryGradients: Record<string, string> = {
  appliance: 'from-gray-50 to-gray-100',
  bathroom: 'from-sky-50 to-sky-100',
  cooling: 'from-blue-50 to-blue-100',
  electrical: 'from-yellow-50 to-yellow-100',
  flooring: 'from-orange-50 to-orange-100',
  garage: 'from-zinc-50 to-zinc-100',
  general: 'from-white to-gray-50',
  heating: 'from-rose-50 to-rose-100',
  kitchen: 'from-lime-50 to-lime-100',
  outdoor: 'from-green-50 to-green-100',
  plumbing: 'from-cyan-50 to-cyan-100',
  safety: 'from-red-50 to-red-100',
  windows: 'from-indigo-50 to-indigo-100',
};

export const initialTasks: Task[] = [
  {
    "id": "6a8c43ae-ceaa-410c-a4ec-c480bcc24430",
    "title": "Clean dishwasher filter",
    "description": "Remove and clean the filter to maintain performance.",
    "dueDate": "2025-05-27T06:18:19.379462",
    "status": "COMPLETED",
    "completedDate": "2025-06-01T06:18:19.379462",
    "itemName": "Appliance Item",
    "category": "appliance",
    "estimatedTimeMinutes": 45,
    "estimatedCost": 0.07,
    "criticality": "high",
    "deferLimitDays": 9,
    "canBeOutsourced": false,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=appliance",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "278be563-4059-4651-af06-eb96ab4eb1f7",
    "title": "Inspect bathroom caulking",
    "description": "Check and reapply caulking around tub and sink.",
    "dueDate": "2025-06-10T06:18:19.379692",
    "status": "PENDING",
    "itemName": "Bathroom Item",
    "category": "bathroom",
    "estimatedTimeMinutes": 45,
    "estimatedCost": 49.87,
    "criticality": "medium",
    "deferLimitDays": 6,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "monthly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "515aad17-cbfd-48c3-9878-f950fd71615d",
    "title": "Replace HVAC filter",
    "description": "Install a new air filter to ensure clean airflow.",
    "dueDate": "2025-05-22T06:18:19.379772",
    "status": "PENDING",
    "itemName": "Cooling Item",
    "category": "cooling",
    "estimatedTimeMinutes": 45,
    "estimatedCost": 55.59,
    "criticality": "high",
    "deferLimitDays": 14,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "6cabaeb2-4f62-4a33-91eb-28863a814040",
    "title": "Test GFCI outlets",
    "description": "Use a GFCI tester to ensure outlets work properly.",
    "dueDate": "2025-05-30T06:18:19.379962",
    "status": "COMPLETED",
    "completedDate": "2025-06-04T06:18:19.379962",
    "itemName": "Electrical Item",
    "category": "electrical",
    "estimatedTimeMinutes": 96,
    "estimatedCost": 39.96,
    "criticality": "medium",
    "deferLimitDays": 11,
    "canBeOutsourced": false,
    "canDefer": false,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "42bb203f-543a-4f59-8969-20ec679cd429",
    "title": "Check hardwood floor for damage",
    "description": "Inspect for scratches or warping.",
    "dueDate": "2025-04-26T06:18:19.380099",
    "status": "COMPLETED",
    "completedDate": "2025-05-01T06:18:19.380099",
    "itemName": "Flooring Item",
    "category": "flooring",
    "estimatedTimeMinutes": 46,
    "estimatedCost": 87.14,
    "criticality": "medium",
    "deferLimitDays": 11,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "monthly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "f004f5f3-f5d3-482c-b53a-55cb8caba2e5",
    "title": "Lubricate garage door rollers",
    "description": "Apply lubricant to rollers and hinges.",
    "dueDate": "2025-06-13T06:18:19.380499",
    "status": "COMPLETED",
    "completedDate": "2025-06-16T06:18:19.380499",
    "itemName": "Garage Item",
    "category": "garage",
    "estimatedTimeMinutes": 116,
    "estimatedCost": 3.07,
    "criticality": "high",
    "deferLimitDays": 2,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "a24cc098-90fe-43b6-9308-0595fa47d077",
    "title": "Test smoke detectors",
    "description": "Press test button on all smoke detectors.",
    "dueDate": "2025-07-04T06:18:19.380827",
    "status": "COMPLETED",
    "completedDate": "2025-07-10T06:18:19.380827",
    "itemName": "Safety Item",
    "category": "safety",
    "estimatedTimeMinutes": 78,
    "estimatedCost": 52.96,
    "criticality": "low",
    "deferLimitDays": 6,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "weekly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "49ac9600-4aa4-4b19-94fe-0837a2f7a8b3",
    "title": "Flush hot water heater",
    "description": "Drain and flush to remove sediment.",
    "dueDate": "2025-06-25T06:18:19.381003",
    "status": "PENDING",
    "itemName": "Plumbing Item",
    "category": "plumbing",
    "estimatedTimeMinutes": 85,
    "estimatedCost": 53.71,
    "criticality": "medium",
    "deferLimitDays": 8,
    "canBeOutsourced": false,
    "canDefer": true,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=plumbing",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "31524966-f495-4088-976a-4bb56a3e325b",
    "title": "Clean refrigerator coils",
    "description": "Vacuum or brush coils to maintain efficiency.",
    "dueDate": "2025-07-12T06:18:19.381118",
    "status": "COMPLETED",
    "completedDate": "2025-07-20T06:18:19.381118",
    "itemName": "Appliance Item",
    "category": "appliance",
    "estimatedTimeMinutes": 112,
    "estimatedCost": 11.63,
    "criticality": "high",
    "deferLimitDays": 9,
    "canBeOutsourced": false,
    "canDefer": true,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=appliance",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "f96e19b5-b939-42ff-b35f-a3d2ec0ed05a",
    "title": "Test thermostat batteries",
    "description": "Replace if needed to maintain settings.",
    "dueDate": "2025-06-30T06:18:19.381357",
    "status": "PENDING",
    "itemName": "Heating Item",
    "category": "heating",
    "estimatedTimeMinutes": 12,
    "estimatedCost": 7.76,
    "criticality": "high",
    "deferLimitDays": 5,
    "canBeOutsourced": false,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "b71deb58-b9d9-4722-a3a2-9377acc9e822",
    "title": "Clean kitchen range hood filter",
    "description": "Wash the filter to improve air quality.",
    "dueDate": "2025-06-19T06:18:19.381467",
    "status": "PENDING",
    "itemName": "Kitchen Item",
    "category": "kitchen",
    "estimatedTimeMinutes": 109,
    "estimatedCost": 46.22,
    "criticality": "high",
    "deferLimitDays": 8,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "weekly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "63466cad-62a4-4cc2-afe0-4f81a724d277",
    "title": "Inspect roof for damage",
    "description": "Look for missing shingles or leaks.",
    "dueDate": "2025-05-02T06:18:19.381542",
    "status": "COMPLETED",
    "completedDate": "2025-05-09T06:18:19.381542",
    "itemName": "Outdoor Item",
    "category": "outdoor",
    "estimatedTimeMinutes": 64,
    "estimatedCost": 47.33,
    "criticality": "low",
    "deferLimitDays": 10,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "weekly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=outdoor",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "730f475e-a6d6-4fde-b53e-3280cb612a39",
    "title": "Wash windows",
    "description": "Clean glass inside and out.",
    "dueDate": "2025-06-30T06:18:19.381606",
    "status": "COMPLETED",
    "completedDate": "2025-07-09T06:18:19.381606",
    "itemName": "Windows Item",
    "category": "windows",
    "estimatedTimeMinutes": 30,
    "estimatedCost": 55.81,
    "criticality": "high",
    "deferLimitDays": 8,
    "canBeOutsourced": false,
    "canDefer": true,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=windows",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "9c42cf03-f321-4218-8c2c-755995bd11bf",
    "title": "Clean dryer vent",
    "description": "Clear lint from vent pipe.",
    "dueDate": "2025-06-21T06:18:19.381671",
    "status": "COMPLETED",
    "completedDate": "2025-06-30T06:18:19.381671",
    "itemName": "Appliance Item",
    "category": "appliance",
    "estimatedTimeMinutes": 68,
    "estimatedCost": 52.54,
    "criticality": "medium",
    "deferLimitDays": 3,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "monthly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "2beab466-e7af-49c1-ac68-3e3cdeeb09bc",
    "title": "Check toilet for leaks",
    "description": "Drop dye in tank and wait.",
    "dueDate": "2025-06-16T06:18:19.381698",
    "status": "COMPLETED",
    "completedDate": "2025-06-21T06:18:19.381698",
    "itemName": "Bathroom Item",
    "category": "bathroom",
    "estimatedTimeMinutes": 111,
    "estimatedCost": 90.32,
    "criticality": "medium",
    "deferLimitDays": 10,
    "canBeOutsourced": false,
    "canDefer": true,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "d1895bef-089f-40fa-a1af-3813c37eed02",
    "title": "Service air conditioning unit",
    "description": "Schedule professional tune-up.",
    "dueDate": "2025-06-08T06:18:19.381720",
    "status": "COMPLETED",
    "completedDate": "2025-06-12T06:18:19.381720",
    "itemName": "Cooling Item",
    "category": "cooling",
    "estimatedTimeMinutes": 11,
    "estimatedCost": 72.51,
    "criticality": "high",
    "deferLimitDays": 2,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=cooling",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "aa27d080-0a70-409f-a192-23d51668ff1a",
    "title": "Inspect breaker panel",
    "description": "Ensure all circuits are labeled and secure.",
    "dueDate": "2025-06-17T06:18:19.381842",
    "status": "COMPLETED",
    "completedDate": "2025-06-23T06:18:19.381842",
    "itemName": "Electrical Item",
    "category": "electrical",
    "estimatedTimeMinutes": 112,
    "estimatedCost": 72.06,
    "criticality": "medium",
    "deferLimitDays": 8,
    "canBeOutsourced": false,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=electrical",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "6c512364-0cdf-494e-8c2a-04c08d541396",
    "title": "Seal grout lines",
    "description": "Apply grout sealer in tile areas.",
    "dueDate": "2025-04-28T06:18:19.381880",
    "status": "PENDING",
    "itemName": "Flooring Item",
    "category": "flooring",
    "estimatedTimeMinutes": 94,
    "estimatedCost": 20.03,
    "criticality": "high",
    "deferLimitDays": 11,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "every 6 months",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "fb3e497b-b2f3-4573-ba13-42cfa50c5002",
    "title": "Check for pests",
    "description": "Inspect attic and basement for signs of pests.",
    "dueDate": "2025-05-20T06:18:19.381925",
    "status": "PENDING",
    "itemName": "Garage Item",
    "category": "garage",
    "estimatedTimeMinutes": 10,
    "estimatedCost": 36.86,
    "criticality": "high",
    "deferLimitDays": 8,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "2aefa4bb-55ea-423b-bd0b-33b523151760",
    "title": "Replace fire extinguisher",
    "description": "Ensure extinguisher is not expired.",
    "dueDate": "2025-07-07T06:18:19.381960",
    "status": "PENDING",
    "itemName": "Safety Item",
    "category": "safety",
    "estimatedTimeMinutes": 117,
    "estimatedCost": 2.04,
    "criticality": "low",
    "deferLimitDays": 1,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "every 6 months",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=safety",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "866bb0ec-4463-460f-a17a-908b8cc92b74",
    "title": "Clean showerhead",
    "description": "Soak in vinegar to remove buildup.",
    "dueDate": "2025-06-14T06:18:19.381980",
    "status": "COMPLETED",
    "completedDate": "2025-06-16T06:18:19.381980",
    "itemName": "Bathroom Item",
    "category": "bathroom",
    "estimatedTimeMinutes": 40,
    "estimatedCost": 37.7,
    "criticality": "high",
    "deferLimitDays": 6,
    "canBeOutsourced": false,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=bathroom",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "6bc83d5f-e2d8-4e5f-842a-a470f3351ca7",
    "title": "Winterize outdoor faucets",
    "description": "Shut off water and insulate spigots.",
    "dueDate": "2025-06-07T06:18:19.382004",
    "status": "PENDING",
    "itemName": "Outdoor Item",
    "category": "outdoor",
    "estimatedTimeMinutes": 69,
    "estimatedCost": 87.07,
    "criticality": "low",
    "deferLimitDays": 8,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "quarterly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "b8b8afa6-71bb-4b69-b709-fc78a0d7dd6c",
    "title": "Clean kitchen garbage disposal",
    "description": "Grind ice and citrus peels to freshen.",
    "dueDate": "2025-07-04T06:18:19.382028",
    "status": "COMPLETED",
    "completedDate": "2025-07-11T06:18:19.382028",
    "itemName": "Kitchen Item",
    "category": "kitchen",
    "estimatedTimeMinutes": 120,
    "estimatedCost": 58.6,
    "criticality": "medium",
    "deferLimitDays": 10,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "every 6 months",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "ac577392-47f1-471a-96b5-03e6a50a58d7",
    "title": "Inspect insulation",
    "description": "Look for damage or settling in attic.",
    "dueDate": "2025-05-03T06:18:19.382077",
    "status": "PENDING",
    "itemName": "General Item",
    "category": "general",
    "estimatedTimeMinutes": 13,
    "estimatedCost": 9.44,
    "criticality": "medium",
    "deferLimitDays": 12,
    "canBeOutsourced": true,
    "canDefer": false,
    "recurrenceInterval": "yearly",
    "taskType": "GENERAL",
    "imageUrl": "https://placehold.co/400x200?text=general",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  },
  {
    "id": "b54bccec-88ab-4dfb-99c3-0b36a7ee294f",
    "title": "Check window seals",
    "description": "Ensure tight fit and no drafts.",
    "dueDate": "2025-05-09T06:18:19.382103",
    "status": "COMPLETED",
    "completedDate": "2025-05-17T06:18:19.382103",
    "itemName": "Windows Item",
    "category": "windows",
    "estimatedTimeMinutes": 31,
    "estimatedCost": 92.26,
    "criticality": "low",
    "deferLimitDays": 3,
    "canBeOutsourced": true,
    "canDefer": true,
    "recurrenceInterval": "monthly",
    "taskType": "GENERAL",
    "icon": "\ud83d\udee0\ufe0f",
    "steps": [
      "Step 1",
      "Step 2"
    ],
    "equipmentNeeded": [
      "Tool A",
      "Tool B"
    ],
    "resources": [
      {
        "label": "Helpful Guide",
        "url": "https://example.com/guide"
      }
    ]
  }
];
