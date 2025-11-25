import { NextResponse } from 'next/server';
import { getCustomers, getLocations } from '@/lib/apparelmagic';
import { getServiceSupabase } from '@/lib/supabase';

export async function POST() {
  const startTime = Date.now();
  
  try {
    console.log('🔄 Starting customer sync...');
    const supabase = getServiceSupabase();
    
    // ========================================
    // STEP 1: Sync Customers
    // ========================================
    console.log('📥 Fetching customers from ApparelMagic...');
    const customers = await getCustomers();
    console.log(`✅ Fetched ${customers.length} customers from ApparelMagic`);
    
    // Prepare customers for upsert
    const customersToUpsert = customers.map(customer => ({
      am_customer_id: customer.customer_id,
      customer_name: customer.customer_name || 'Unknown',
      account_number: customer.account_number || null,
      email: customer.email || null,
      phone: customer.phone || null,
      address_1: customer.address_1 || null,
      address_2: customer.address_2 || null,
      city: customer.city || null,
      state: customer.state || null,
      postal_code: customer.postal_code || null,
      country: customer.country || 'USA',
      credit_limit: customer.credit_limit || null,
      status: customer.status || null,
      category: customer.category || null,
      terms_id: customer.terms_id || null,
      division_id: customer.division_id || null,
      price_group: customer.price_group || null,
      notes: customer.notes || null,
      is_active: customer.is_active || '1',
      is_local_only: false,
      updated_at: new Date().toISOString()
    }));
    
    console.log(`📤 Upserting ${customersToUpsert.length} customers to Supabase...`);
    
    // Upsert customers in batches of 100
    const batchSize = 100;
    let customersUpserted = 0;
    let customerErrors = 0;
    
    for (let i = 0; i < customersToUpsert.length; i += batchSize) {
      const batch = customersToUpsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('customers')
        .upsert(batch, { 
          onConflict: 'am_customer_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`Error upserting customer batch ${Math.floor(i / batchSize) + 1}:`, error);
        customerErrors += batch.length;
      } else {
        customersUpserted += batch.length;
        console.log(`  Customer batch ${Math.floor(i / batchSize) + 1}: Upserted ${batch.length}`);
      }
    }
    
    // ========================================
    // STEP 2: Sync Locations
    // ========================================
    console.log('📥 Fetching locations from ApparelMagic...');
    const locations = await getLocations();
    console.log(`✅ Fetched ${locations.length} locations from ApparelMagic`);
    
    // Build a map of am_customer_id to Supabase customer id
    const { data: customerMap } = await supabase
      .from('customers')
      .select('id, am_customer_id');
    
    const customerIdMap = new Map<string, string>();
    if (customerMap) {
      customerMap.forEach(c => {
        if (c.am_customer_id) {
          customerIdMap.set(c.am_customer_id, c.id);
        }
      });
    }
    
    // Prepare locations for upsert
    const locationsToUpsert = locations
      .filter(loc => loc.customer_id) // Only locations with a customer
      .map(location => ({
        am_location_id: location.ship_to_id,
        am_customer_id: location.customer_id,
        customer_id: customerIdMap.get(location.customer_id) || null,
        location_name: location.name || 'Unnamed Location',
        address_1: location.address_1 || null,
        address_2: location.address_2 || null,
        city: location.city || null,
        state: location.state || null,
        postal_code: location.postal_code || null,
        country: location.country || 'USA',
        phone: location.phone || null,
        email: location.email || null,
        store_number: location.store_number || null,
        dc_reference: location.dc_reference || null,
        department_number: location.department_number || null,
        is_main_location: location.is_main_location === '1',
        updated_at: new Date().toISOString()
      }));
    
    console.log(`📤 Upserting ${locationsToUpsert.length} locations to Supabase...`);
    
    let locationsUpserted = 0;
    let locationErrors = 0;
    
    for (let i = 0; i < locationsToUpsert.length; i += batchSize) {
      const batch = locationsToUpsert.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('customer_locations')
        .upsert(batch, { 
          onConflict: 'am_location_id',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.error(`Error upserting location batch ${Math.floor(i / batchSize) + 1}:`, error);
        locationErrors += batch.length;
      } else {
        locationsUpserted += batch.length;
        console.log(`  Location batch ${Math.floor(i / batchSize) + 1}: Upserted ${batch.length}`);
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`✅ Sync complete!`);
    console.log(`   Customers: ${customersUpserted} upserted, ${customerErrors} errors`);
    console.log(`   Locations: ${locationsUpserted} upserted, ${locationErrors} errors`);
    console.log(`   Duration: ${duration}s`);
    
    return NextResponse.json({
      success: true,
      stats: {
        customers: {
          total: customers.length,
          upserted: customersUpserted,
          errors: customerErrors
        },
        locations: {
          total: locations.length,
          upserted: locationsUpserted,
          errors: locationErrors
        },
        duration: `${duration}s`
      }
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
