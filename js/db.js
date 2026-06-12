// ============================================
// DATABASE — Dexie.js IndexedDB Wrapper
// ============================================

const db = new Dexie('NiranjanPlasticDB');

db.version(1).stores({
  transactions: '++id, billNo, date, customerId, paymentStatus, syncStatus, updatedAt',
  customers: '++id, name, phone, panNo, isFrequent, syncStatus, updatedAt',
  products: '++id, name, category, status, syncStatus, updatedAt',
  syncQueue: '++id, operation, table, recordId, timestamp'
});

// ============================================
// HELPERS
// ============================================

async function generateBillNo() {
  const count = await db.transactions.count();
  const num = count + 1;
  return String(num).padStart(3, '0');
}

async function addToSyncQueue(operation, table, recordId) {
  await db.syncQueue.add({
    operation,
    table,
    recordId,
    timestamp: new Date().toISOString()
  });
}

function getProductStatus(quantity) {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 10) return 'low_stock';
  return 'in_stock';
}

// ============================================
// SEED DEMO DATA
// ============================================

async function seedDemoData() {
  const productCount = await db.products.count();
  if (productCount > 0) return; // Already seeded

  // Seed Products
  const products = [
    { name: 'HDPE Pipe 1"', category: 'pipes', price: 450, quantity: 120, unit: 'meter', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'PVC Pipe 2"', category: 'pipes', price: 680, quantity: 85, unit: 'meter', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Plastic Container 5L', category: 'containers', price: 180, quantity: 8, unit: 'pcs', status: 'low_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'PE Sheet Roll', category: 'sheets', price: 2200, quantity: 45, unit: 'roll', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Polythene Bags (Bundle)', category: 'bags', price: 350, quantity: 0, unit: 'bundle', status: 'out_of_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Water Bottle 1L', category: 'bottles', price: 25, quantity: 500, unit: 'pcs', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'PP Granules', category: 'other', price: 120, quantity: 200, unit: 'kg', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Plastic Drum 50L', category: 'containers', price: 1500, quantity: 15, unit: 'pcs', status: 'in_stock', syncStatus: 'synced', updatedAt: new Date().toISOString() }
  ];

  const productIds = await db.products.bulkAdd(products, { allKeys: true });

  // Seed Customers
  const customers = [
    { name: 'राम बहादुर श्रेष्ठ', phone: '9841234567', panNo: '301234567', isFrequent: true, syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'सिता देवी पौडेल', phone: '9851234567', panNo: '302345678', isFrequent: true, syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Krishna Hardware Store', phone: '9861234567', panNo: '303456789', isFrequent: false, syncStatus: 'synced', updatedAt: new Date().toISOString() },
    { name: 'Kathmandu Plastics Retail', phone: '9801234567', panNo: '304567890', isFrequent: true, syncStatus: 'synced', updatedAt: new Date().toISOString() }
  ];

  const customerIds = await db.customers.bulkAdd(customers, { allKeys: true });

  // Seed Transactions
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const transactions = [
    {
      billNo: '001',
      date: yesterday,
      customerId: customerIds[0],
      items: [
        { productId: productIds[0], name: 'HDPE Pipe 1"', qty: 20, rate: 450, total: 9000 },
        { productId: productIds[3], name: 'PE Sheet Roll', qty: 2, rate: 2200, total: 4400 }
      ],
      totalAmount: 13400,
      paidAmount: 13400,
      dueAmount: 0,
      paymentStatus: 'paid',
      syncStatus: 'synced',
      updatedAt: new Date().toISOString()
    },
    {
      billNo: '002',
      date: today,
      customerId: customerIds[1],
      items: [
        { productId: productIds[2], name: 'Plastic Container 5L', qty: 10, rate: 180, total: 1800 },
        { productId: productIds[5], name: 'Water Bottle 1L', qty: 100, rate: 25, total: 2500 }
      ],
      totalAmount: 4300,
      paidAmount: 2000,
      dueAmount: 2300,
      paymentStatus: 'partial',
      syncStatus: 'synced',
      updatedAt: new Date().toISOString()
    },
    {
      billNo: '003',
      date: today,
      customerId: customerIds[2],
      items: [
        { productId: productIds[1], name: 'PVC Pipe 2"', qty: 50, rate: 680, total: 34000 }
      ],
      totalAmount: 34000,
      paidAmount: 0,
      dueAmount: 34000,
      paymentStatus: 'due',
      syncStatus: 'synced',
      updatedAt: new Date().toISOString()
    }
  ];

  await db.transactions.bulkAdd(transactions);
}

// Export for use
window.appDb = db;
window.dbHelpers = { generateBillNo, addToSyncQueue, getProductStatus, seedDemoData };
