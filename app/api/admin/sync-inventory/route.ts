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

async function fetchAllInventory() {
  let allInventory: any[] = [];
  let lastId: string | null = null;
  let pageCount = 0;
  const maxPages = 100; // Inventory can be very large

  console.log('Fetching all inventory from ApparelMagic...');

  while (pageCount < maxPages) {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token,
      'pagination[page_size]': '1000'
    });

    if (lastId) {
      params.append('pagination[last_id]', lastId);
    }

    const url = `${BASE_URL}/inventory?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradeShowPortal/1.0' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      allInventory = allInventory.concat(data.response);
      console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} SKUs (Total: ${allInventory.length})`);
    }

    if (data.meta?.pagination?.last_id) {
      lastId = String(data.meta.pagination.last_id);
      pageCount++;
    } else {
      break;
    }
  }

  return allInventory;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'inventory',
      source: 'apparel_magic',
      status: 'started'
    })
    .select()
    .single();

  try {
    console.log('🔄 Starting inventory sync...');

    const inventory = await fetchAllInventory();
    console.log(`✅ Fetched ${inventory.length} inventory records`);

    let updated = 0;
    let notFound = 0;
    let errors = 0;

    for (const item of inventory) {
      try {
        // Update existing product_skus with inventory data
        const { data: existing, error: findError } = await supabase
          .from('product_skus')
          .select('sku_id')
          .eq('sku_id', item.sku_id)
          .single();

        if (existing) {
          const { error: updateError } = await supabase
            .from('product_skus')
            .update({
              qty_avail_sell: parseFloat(item.qty_avail_sell) || 0,
              qty_inventory: parseFloat(item.qty_inventory) || 0,
              qty_alloc: parseFloat(item.qty_alloc) || 0,
              qty_avail_alloc: parseFloat(item.qty_avail_alloc) || 0,
              qty_open_po: parseFloat(item.qty_open_po) || 0,
              qty_open_sales: parseFloat(item.qty_open_sales) || 0,
              qty_picked: parseFloat(item.qty_picked) || 0,
              cost: parseFloat(item.cost) || 0,
              location: item.location || null,
              upc: item.upc_display || null,
              is_active: item.active === '1',
              last_synced_at: new Date().toISOString()
            })
            .eq('sku_id', item.sku_id);

          if (updateError) {
            console.error(`Error updating SKU ${item.sku_id}:`, updateError);
            errors++;
          } else {
            updated++;
          }
        } else {
          notFound++;
        }

        if ((updated + notFound) % 500 === 0) {
          console.log(`Progress: ${updated + notFound}/${inventory.length} (Updated: ${updated}, Not found: ${notFound})`);
        }

      } catch (err) {
        console.error(`Error processing SKU ${item.sku_id}:`, err);
        errors++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'completed',
          records_processed: inventory.length,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Inventory sync complete! Updated: ${updated}, Not found: ${notFound}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: inventory.length,
        updated,
        not_found: notFound,
        errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Inventory sync error:', error);

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
