import { NextResponse } from 'next/server';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  const startTime = Date.now();
  const results: Record<string, any> = {};

  console.log('🚀 Starting full data sync...\n');

  // 1. Sync Customers first (orders/invoices depend on them)
  console.log('1️⃣ Syncing customers...');
  try {
    const customerRes = await fetch(`${BASE_URL}/api/admin/sync-customers`, { method: 'POST' });
    results.customers = await customerRes.json();
    console.log('   ✅ Customers done\n');
  } catch (err) {
    results.customers = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Customers failed\n');
  }

  // 2. Sync Products (if not already synced recently)
  console.log('2️⃣ Syncing products...');
  try {
    const productRes = await fetch(`${BASE_URL}/api/admin/sync-products`, { method: 'POST' });
    results.products = await productRes.json();
    console.log('   ✅ Products done\n');
  } catch (err) {
    results.products = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Products failed\n');
  }

  // 3. Sync Inventory (updates product_skus with qty data)
  console.log('3️⃣ Syncing inventory...');
  try {
    const inventoryRes = await fetch(`${BASE_URL}/api/admin/sync-inventory`, { method: 'POST' });
    results.inventory = await inventoryRes.json();
    console.log('   ✅ Inventory done\n');
  } catch (err) {
    results.inventory = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Inventory failed\n');
  }

  // 4. Sync Orders (depends on customers)
  console.log('4️⃣ Syncing orders...');
  try {
    const orderRes = await fetch(`${BASE_URL}/api/admin/sync-orders`, { method: 'POST' });
    results.orders = await orderRes.json();
    console.log('   ✅ Orders done\n');
  } catch (err) {
    results.orders = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Orders failed\n');
  }

  // 5. Sync Invoices (depends on customers and orders)
  console.log('5️⃣ Syncing invoices...');
  try {
    const invoiceRes = await fetch(`${BASE_URL}/api/admin/sync-invoices`, { method: 'POST' });
    results.invoices = await invoiceRes.json();
    console.log('   ✅ Invoices done\n');
  } catch (err) {
    results.invoices = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Invoices failed\n');
  }

  // 6. Sync Shipments from ShipStation (depends on orders)
  console.log('6️⃣ Syncing shipments from ShipStation...');
  try {
    const shipmentRes = await fetch(`${BASE_URL}/api/admin/sync-shipments`, { method: 'POST' });
    results.shipments = await shipmentRes.json();
    console.log('   ✅ Shipments done\n');
  } catch (err) {
    results.shipments = { error: err instanceof Error ? err.message : 'Failed' };
    console.log('   ❌ Shipments failed\n');
  }

  const totalDuration = Math.round((Date.now() - startTime) / 1000);

  console.log('═══════════════════════════════════════');
  console.log(`✅ Full sync complete in ${totalDuration} seconds`);
  console.log('═══════════════════════════════════════\n');

  return NextResponse.json({
    success: true,
    total_duration: `${totalDuration}s`,
    results
  });
}
