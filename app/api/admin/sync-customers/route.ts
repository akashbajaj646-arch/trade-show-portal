import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const APPARELMAGIC_API_TOKEN = process.env.APPARELMAGIC_API_KEY || '';
const BASE_URL = 'https://advanceapparels.app.apparelmagic.com/api/json';

function getAuthParams() {
  const time = Math.floor(Date.now() / 1000).toString();
  return { time, token: APPARELMAGIC_API_TOKEN };
}

async function fetchAllCustomers() {
  let allCustomers: any[] = [];
  let lastId: string | null = null;
  let pageCount = 0;
  const maxPages = 20;

  console.log('Fetching all customers from ApparelMagic...');

  while (pageCount < maxPages) {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token,
      'pagination[page_size]': '500'
    });

    if (lastId) {
      params.append('pagination[last_id]', lastId);
    }

    const url = `${BASE_URL}/customers?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradeShowPortal/1.0' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      allCustomers = allCustomers.concat(data.response);
      console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} customers (Total: ${allCustomers.length})`);
    }

    if (data.meta?.pagination?.last_id) {
      lastId = String(data.meta.pagination.last_id);
      pageCount++;
    } else {
      break;
    }
  }

  return allCustomers;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  // Log sync start
  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'customers',
      source: 'apparel_magic',
      status: 'started'
    })
    .select()
    .single();

  try {
    console.log('🔄 Starting customer sync...');

    const customers = await fetchAllCustomers();
    console.log(`✅ Fetched ${customers.length} customers`);

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const customer of customers) {
      try {
        // Map to your existing customers table structure
        const customerData = {
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
          country: customer.country || null,
          credit_limit: parseFloat(customer.credit_limit) || null,
          status: customer.status || null,
          category: customer.category || null,
          terms_id: customer.terms_id || null,
          division_id: customer.division_id || null,
          price_group: customer.price_group || null,
          notes: customer.notes || null,
          is_active: customer.is_active === '1',
          updated_at: new Date().toISOString()
        };

        // Check if customer exists
        const { data: existing } = await supabase
          .from('customers')
          .select('id')
          .eq('am_customer_id', customer.customer_id)
          .single();

        if (existing) {
          await supabase
            .from('customers')
            .update(customerData)
            .eq('am_customer_id', customer.customer_id);
          updated++;
        } else {
          await supabase
            .from('customers')
            .insert(customerData);
          created++;
        }

        // Log progress every 100 customers
        if ((created + updated) % 100 === 0) {
          console.log(`Progress: ${created + updated}/${customers.length} customers`);
        }

      } catch (err) {
        console.error(`Error syncing customer ${customer.customer_id}:`, err);
        errors++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update sync log
    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'completed',
          records_processed: customers.length,
          records_created: created,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Customer sync complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: customers.length,
        created,
        updated,
        errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Customer sync error:', error);

    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'failed',
          error_details: { message: error instanceof Error ? error.message : 'Unknown error' },
          completed_at: new Date().toISOString()
        })
        .eq('id', syncLog.id);
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
