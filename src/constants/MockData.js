/**
 * Mock data for development phase
 * Will be replaced by Firebase/backend calls in later phases
 */

export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Basmati Rice',
    category: 'Grains',
    quantity: 50,
    unit: 'kg',
    expiryDate: '2026-08-15',
    batchNo: 'BT-2024-001',
    daysLeft: 117,
    status: 'fresh',
  },
  {
    id: '2',
    name: 'Whole Milk',
    category: 'Dairy',
    quantity: 30,
    unit: 'liters',
    expiryDate: '2026-04-28',
    batchNo: 'BT-2025-011',
    daysLeft: 8,
    status: 'expiring',
  },
  {
    id: '3',
    name: 'Sunflower Oil',
    category: 'Oils',
    quantity: 20,
    unit: 'liters',
    expiryDate: '2026-04-18',
    batchNo: 'BT-2025-009',
    daysLeft: -2,
    status: 'expired',
  },
  {
    id: '4',
    name: 'Wheat Flour',
    category: 'Grains',
    quantity: 80,
    unit: 'kg',
    expiryDate: '2026-11-30',
    batchNo: 'BT-2024-022',
    daysLeft: 224,
    status: 'fresh',
  },
  {
    id: '5',
    name: 'Tomato Sauce',
    category: 'Condiments',
    quantity: 15,
    unit: 'bottles',
    expiryDate: '2026-05-03',
    batchNo: 'BT-2025-015',
    daysLeft: 13,
    status: 'expiring',
  },
];

export const MOCK_SHOPS = [
  {
    id: 'S001',
    name: 'Fresh Mart',
    owner: 'Rajesh Kumar',
    location: 'Mumbai, MH',
    totalProducts: 124,
    expiredItems: 3,
    expiringItems: 12,
  },
  {
    id: 'S002',
    name: 'Daily Needs Store',
    owner: 'Priya Sharma',
    location: 'Pune, MH',
    totalProducts: 87,
    expiredItems: 0,
    expiringItems: 5,
  },
  {
    id: 'S003',
    name: 'Corner Grocery',
    owner: 'Amit Patel',
    location: 'Ahmedabad, GJ',
    totalProducts: 210,
    expiredItems: 7,
    expiringItems: 18,
  },
];

export const MOCK_CREDENTIALS = [
  { email: 'admin@shelfsafe.com', password: 'admin123', role: 'admin', name: 'Admin User' },
  { email: 'shop@shelfsafe.com', password: 'shop123', role: 'shopkeeper', name: 'Rajesh Kumar' },
];
