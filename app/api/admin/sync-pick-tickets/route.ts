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

async function fetchAllPickTickets() {
  let allPickTickets: any[] = [];
  let lastId: string | null = null;
  let pageCount = 0;
  const maxPages = 200;

  console.log('Fetching all pick tickets from ApparelMagic...');

  while (pageCount < maxPages) {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token,
      'pagination[page_size]': '200'
    });

    if (lastId) {
      params.append('pagination[last_id]', lastId);
    }

    const url = `${BASE_URL}/pick_tickets?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradeShowPortal/1.0' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      allPickTickets = allPickTickets.concat(data.response);
      console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} pick tickets (Total: ${allPickTickets.length})`);
    }

    if (data.meta?.pagination?.last_id) {
      lastId = String(data.meta.pagination.last_id);
      pageCount++;
    } else {
      break;
    }
  }

  return allPickTickets;
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return dateStr;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'pick_tickets',
      source: 'apparel_magic',
      status: 'started'
    })
    .select()
    .single();

  try {
    console.log('🔄 Starting pick ticket sync...');

    const pickTickets = await fetchAllPickTickets();
    console.log(`✅ Fetched ${pickTickets.length} pick tickets`);

    // Build mappings
    const { data: customers } = await supabase
      .from('customers')
      .select('id, am_customer_id');
    
    const { data: orders } = await supabase
      .from('orders')
      .select('id, apparel_magic_id');

    const customerMap: Record<string, string> = {};
    customers?.forEach(c => { customerMap[c.am_customer_id] = c.id; });

    const orderMap: Record<string, string> = {};
    orders?.forEach(o => { orderMap[o.apparel_magic_id] = o.id; });

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const pt of pickTickets) {
      try {
        const pickTicketData = {
          pick_ticket_id: pt.pick_ticket_id,
          order_id: orderMap[pt.order_id] || null,
          apparel_magic_order_id: pt.order_id,
          customer_id: customerMap[pt.customer_id] || null,
          apparel_magic_customer_id: pt.customer_id,
          invoice_id: pt.invoice_id || null,
          pick_ticket_date: parseDate(pt.date),
          date_due: parseDate(pt.date_due),
          tracking_number: pt.tracking_number || null,
          ship_via: pt.ship_via || null,
          ship_to_name: pt.ship_to_name || null,
          ship_to_address_1: pt.address_1 || null,
          ship_to_address_2: pt.address_2 || null,
          ship_to_city: pt.city || null,
          ship_to_state: pt.state || null,
          ship_to_zip: pt.postal_code || null,
          ship_to_country: pt.country || null,
          qty: parseFloat(pt.qty) || 0,
          subtotal: parseFloat(pt.amount_subtotal) || 0,
          discount_amount: parseFloat(pt.amount_discount) || 0,
          tax_amount: parseFloat(pt.amount_tax) || 0,
          freight_amount: parseFloat(pt.amount_freight) || 0,
          total_amount: parseFloat(pt.amount) || 0,
          is_void: pt.void === '1',
          has_error: pt.error === '1',
          notes: pt.notes || null,
          last_synced_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
          .from('pick_tickets')
          .select('id')
          .eq('pick_ticket_id', pt.pick_ticket_id)
          .single();

        if (existing) {
          await supabase
            .from('pick_tickets')
            .update(pickTicketData)
            .eq('pick_ticket_id', pt.pick_ticket_id);
          updated++;
        } else {
          await supabase
            .from('pick_tickets')
            .insert(pickTicketData);
          created++;
        }

        if ((created + updated) % 100 === 0) {
          console.log(`Progress: ${created + updated}/${pickTickets.length} pick tickets`);
        }

      } catch (err) {
        console.error(`Error syncing pick ticket ${pt.pick_ticket_id}:`, err);
        errors++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'completed',
          records_processed: pickTickets.length,
          records_created: created,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Pick ticket sync complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: pickTickets.length,
        created,
        updated,
        errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Pick ticket sync error:', error);

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
