
// ⚠️ DEPRECATED: This file is no longer used for live data
// The app now uses Firebase Firestore for real-time data
// See src/contexts/FirestoreContext.tsx for current implementation
// This file is kept for reference and backwards compatibility only

export type Chemical = {
  id: string;
  name: string;
  formula: string;
  quantity: number;
  unit: 'g' | 'mL';
  lastUpdated: string;
  casNumber: string;
};

export type Equipment = {
  id: string;
  name: string;
  totalQuantity: number;
  lastUsed: string;
  category: string;
};

export type Faculty = {
    id: string;
    name: string;
}

export type UsageLog = {
    id: string;
    facultyId: string;
    itemId: string;
    itemType: 'chemical' | 'equipment';
    quantity: number;
    unit?: 'g' | 'kg' | 'mL' | 'L' | 'units';
    action: 'Used' | 'Checked Out' | 'Returned' | 'Reported Damaged' | 'Inventory Update';
    timestamp: string;
    notes?: string;
}

// Legacy data - kept for reference
export const chemicals: Chemical[] = [
  { id: '1', name: 'Sodium Chloride', formula: 'NaCl', quantity: 500, unit: 'g', lastUpdated: '2023-10-26', casNumber: '7647-14-5' },
  { id: '2', name: 'Ethanol', formula: 'C2H5OH', quantity: 1000, unit: 'mL', lastUpdated: '2023-10-25', casNumber: '64-17-5' },
  { id: '3', name: 'Hydrochloric Acid', formula: 'HCl', quantity: 250, unit: 'mL', lastUpdated: '2023-10-26', casNumber: '7647-01-0' },
  { id: '4', name: 'Acetic Acid', formula: 'CH3COOH', quantity: 300, unit: 'mL', lastUpdated: '2023-10-24', casNumber: '64-19-7' },
  { id: '5', name: 'Sodium Hydroxide', formula: 'NaOH', quantity: 450, unit: 'g', lastUpdated: '2023-10-26', casNumber: '1310-73-2' },
  { id: '6', name: 'Sulfuric Acid', formula: 'H2SO4', quantity: 40, unit: 'mL', lastUpdated: '2023-10-23', casNumber: '7664-93-9' },
  { id: '7', name: 'Acetone', formula: 'C3H6O', quantity: 0, unit: 'mL', lastUpdated: '2023-10-25', casNumber: '67-64-1' },
  { id: '8', name: 'Potassium Permanganate', formula: 'KMnO4', quantity: 100, unit: 'g', lastUpdated: '2023-10-22', casNumber: '7722-64-7' },
];

export let equipment: Equipment[] = [
  { id: 'E1', name: 'Beaker - 250mL', totalQuantity: 20, lastUsed: '2023-10-26', category: 'Glassware' },
  { id: 'E2', name: 'Digital Scale', totalQuantity: 2, lastUsed: '2023-10-25', category: 'Instrumentation' },
  { id: 'E3', name: 'Bunsen Burner', totalQuantity: 5, lastUsed: '2023-10-24', category: 'Heating' },
  { id: 'E4', name: 'Microscope', totalQuantity: 3, lastUsed: '2023-10-26', category: 'Instrumentation' },
  { id: 'E5', name: 'Graduated Cylinder - 100mL', totalQuantity: 15, lastUsed: '2023-10-25', category: 'Glassware' },
  { id: 'E6', name: 'Centrifuge', totalQuantity: 1, lastUsed: '2023-10-22', category: 'Instrumentation' },
  { id: 'E7', name: 'Hot Plate', totalQuantity: 4, lastUsed: '2023-10-26', category: 'Heating' },
  { id: 'E8', name: 'Test Tubes', totalQuantity: 150, lastUsed: '2023-10-26', category: 'Glassware' },
];


export const faculty: Faculty[] = [
    { id: 'F1', name: 'Dr. Evelyn Reed' },
    { id: 'F2', name: 'Dr. Benjamin Carter' },
    { id: 'F3', name: 'Dr. Olivia Hayes' },
]

// Simulating a real-time log. In a real app this would be a database.
export let usageLogs: UsageLog[] = [
    { id: 'L1', facultyId: 'F1', itemId: '2', itemType: 'chemical', quantity: 50, action: 'Used', timestamp: '2023-10-26T10:00:00Z', unit: 'mL' },
    { id: 'L2', facultyId: 'F2', itemId: 'E2', itemType: 'equipment', quantity: 1, action: 'Checked Out', timestamp: '2023-10-26T10:05:00Z', unit: 'units' },
    { id: 'L3', facultyId: 'F1', itemId: '1', itemType: 'chemical', quantity: 10, action: 'Used', timestamp: '2023-10-26T11:20:00Z', unit: 'g' },
    { id: 'L4', facultyId: 'F3', itemId: 'E4', itemType: 'equipment', quantity: 1, action: 'Checked Out', timestamp: '2023-10-26T13:00:00Z', unit: 'units' },
    { id: 'L5', facultyId: 'F2', itemId: 'E2', itemType: 'equipment', quantity: 1, action: 'Returned', timestamp: '2023-10-26T14:30:00Z', unit: 'units' },
    { id: 'L6', facultyId: 'F3', itemId: '6', itemType: 'chemical', quantity: 5, action: 'Used', timestamp: '2023-10-26T15:00:00Z', unit: 'mL' },
    { id: 'L7', facultyId: 'F1', itemId: 'E1', itemType: 'equipment', quantity: 5, action: 'Checked Out', timestamp: '2024-01-01T09:00:00Z', unit: 'units' },
    { id: 'L8', facultyId: 'F1', itemId: 'E8', itemType: 'equipment', quantity: 20, action: 'Checked Out', timestamp: '2024-01-02T11:00:00Z', unit: 'units' },
    { id: 'L9', facultyId: 'F2', itemId: 'E1', itemType: 'equipment', quantity: 2, action: 'Checked Out', timestamp: '2024-01-03T14:00:00Z', unit: 'units' },
];

// Helper to update data in memory
// In a real app, these would be API calls to a backend.
export const addUsageLog = (log: Omit<UsageLog, 'id' | 'timestamp'>) => {
    const newLog: UsageLog = {
        ...log,
        id: `L${usageLogs.length + 1}`,
        timestamp: new Date().toISOString()
    };
    usageLogs.unshift(newLog);

    if (log.action === 'Reported Damaged' && log.itemType === 'equipment') {
        const itemIndex = equipment.findIndex(e => e.id === log.itemId);
        if (itemIndex > -1) {
            equipment[itemIndex].totalQuantity -= log.quantity;
        }
    }
    
    return newLog;
}

    