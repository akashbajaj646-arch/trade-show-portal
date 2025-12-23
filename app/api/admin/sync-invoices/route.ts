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

async function fetchAllInvoices() {
  let allInvoices: any[] = [];
  let lastId: string | null = null;
  let pageCount = 0;
  const maxPages = 200;

  console.log('Fetching all invoices from ApparelMagic...');

  while (pageCount < maxPages) {
    const auth = getAuthParams();
    const params = new URLSearchParams({
      time: auth.time,
      token: auth.token,
      'pagination[page_size]': '200'
    })


    if (lastId) {
      params.append('pagination[last_id]', lastId);
    }

    const url = `${BASE_URL}/invoices?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'TradeShowPortal/1.0' }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.response && Array.isArray(data.response)) {
      allInvoices = allInvoices.concat(data.response);
      console.log(`  Page ${pageCount + 1}: Fetched ${data.response.length} invoices (Total: ${allInvoices.length})`);
    }

    if (data.meta?.pagination?.last_id) {
      lastId = String(data.meta.pagination.last_id);
      pageCount++;
    } else {
      break;
    }
  }

  return allInvoices;
}

function parseDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  }
  return dateStr;
}

function determinePaymentStatus(balance: number, amountPaid: number, total: number): string {
  if (balance <= 0 || amountPaid >= total) return 'paid';
  if (amountPaid > 0) return 'partial';
  return 'unpaid';
}

export async function POST(request: Request) {
  const startTime = Date.now();

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'invoices',
      source: 'apparel_magic',
      status: 'started'
    })
    .select()
    .single();

  try {
    console.log('🔄 Starting invoice sync...');

    const invoices = await fetchAllInvoices();
    console.log(`✅ Fetched ${invoices.length} invoices`);

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

    for (const invoice of invoices) {
      try {
        const total = parseFloat(invoice.amount) || 0;
        const amountPaid = parseFloat(invoice.amount_paid) || 0;
        const balance = parseFloat(invoice.balance) || 0;

        const invoiceData = {
          apparel_magic_id: invoice.invoice_id,
          order_id: orderMap[invoice.order_id] || null,
          customer_id: customerMap[invoice.customer_id] || null,
          apparel_magic_order_id: invoice.order_id,
          apparel_magic_customer_id: invoice.customer_id,
          invoice_number: invoice.invoice_id,
          invoice_date: parseDate(invoice.date),
          due_date: parseDate(invoice.date_due),
          subtotal: parseFloat(invoice.amount_subtotal) || 0,
          discount_amount: parseFloat(invoice.amount_discount) || 0,
          shipping_amount: parseFloat(invoice.amount_freight) || 0,
          tax_amount: parseFloat(invoice.amount_tax) || 0,
          total_amount: total,
          amount_paid: amountPaid,
          balance_due: balance,
          payment_status: determinePaymentStatus(balance, amountPaid, total),
          notes: invoice.notes || null,
          last_synced_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
          .from('invoices')
          .select('id')
          .eq('apparel_magic_id', invoice.invoice_id)
          .single();

        if (existing) {
          await supabase
            .from('invoices')
            .update(invoiceData)
            .eq('apparel_magic_id', invoice.invoice_id);
          updated++;
        } else {
          await supabase
            .from('invoices')
            .insert(invoiceData);
          created++;
        }

        if ((created + updated) % 100 === 0) {
          console.log(`Progress: ${created + updated}/${invoices.length} invoices`);
        }

      } catch (err) {
        console.error(`Error syncing invoice ${invoice.invoice_id}:`, err);
        errors++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'completed',
          records_processed: invoices.length,
          records_created: created,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Invoice sync complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: invoices.length,
        created,
        updated,
        errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Invoice sync error:', error);

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
