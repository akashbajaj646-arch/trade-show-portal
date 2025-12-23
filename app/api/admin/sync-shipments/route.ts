import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ShipStation API credentials
const SHIPSTATION_API_KEY = process.env.SHIPSTATION_API_KEY || 'fa7d0abbdc674dc2810fae3d45cf35a5';
const SHIPSTATION_API_SECRET = process.env.SHIPSTATION_API_SECRET || 'c8f36bc56eb24954a05edf83017ac5c2';
const SHIPSTATION_BASE_URL = 'https://ssapi.shipstation.com';

function getShipStationAuth() {
  const credentials = Buffer.from(`${SHIPSTATION_API_KEY}:${SHIPSTATION_API_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

async function fetchShipments(page: number = 1, pageSize: number = 500) {
  const url = `${SHIPSTATION_BASE_URL}/shipments?page=${page}&pageSize=${pageSize}&sortBy=ShipDate&sortDir=DESC`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': getShipStationAuth(),
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipStation API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

async function fetchAllShipments() {
  let allShipments: any[] = [];
  let page = 1;
  const pageSize = 500;
  let totalPages = 1;

  console.log('Fetching shipments from ShipStation...');

  while (page <= totalPages && page <= 20) { // Max 20 pages (10,000 shipments)
    const data = await fetchShipments(page, pageSize);

    if (data.shipments && Array.isArray(data.shipments)) {
      allShipments = allShipments.concat(data.shipments);
      totalPages = data.pages || 1;
      console.log(`  Page ${page}/${totalPages}: Fetched ${data.shipments.length} shipments (Total: ${allShipments.length})`);
    }

    page++;

    // ShipStation rate limit: 40 requests per minute
    // Add a small delay to avoid hitting limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return allShipments;
}

function getCarrierName(carrierCode: string): string {
  const carriers: Record<string, string> = {
    'ups': 'UPS',
    'ups_walleted': 'UPS',
    'fedex': 'FedEx',
    'usps': 'USPS',
    'stamps_com': 'USPS',
    'dhl_express': 'DHL Express',
    'dhl_ecommerce': 'DHL eCommerce',
    'ontrac': 'OnTrac',
    'amazon_buy_shipping': 'Amazon',
  };
  return carriers[carrierCode?.toLowerCase()] || carrierCode || 'Unknown';
}

function getTrackingUrl(carrierCode: string, trackingNumber: string): string | null {
  if (!trackingNumber) return null;

  const trackingUrls: Record<string, string> = {
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'ups_walleted': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'stamps_com': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl_express': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'ontrac': `https://www.ontrac.com/tracking/?trackingnumber=${trackingNumber}`,
  };

  return trackingUrls[carrierCode?.toLowerCase()] || null;
}

export async function POST(request: Request) {
  const startTime = Date.now();

  const { data: syncLog } = await supabase
    .from('sync_log')
    .insert({
      sync_type: 'shipments',
      source: 'shipstation',
      status: 'started'
    })
    .select()
    .single();

  try {
    console.log('🔄 Starting ShipStation shipment sync...');

    const shipments = await fetchAllShipments();
    console.log(`✅ Fetched ${shipments.length} shipments`);

    // Build order mapping by order number
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, apparel_magic_id');

    const orderMap: Record<string, string> = {};
    orders?.forEach(o => {
      orderMap[o.order_number] = o.id;
      orderMap[o.apparel_magic_id] = o.id;
    });

    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const shipment of shipments) {
      try {
        const shipmentData = {
          shipstation_id: String(shipment.shipmentId),
          order_id: orderMap[shipment.orderNumber] || null,
          shipstation_order_id: String(shipment.orderId),
          order_number: shipment.orderNumber || null,
          tracking_number: shipment.trackingNumber || null,
          carrier_code: shipment.carrierCode || null,
          carrier_name: getCarrierName(shipment.carrierCode),
          service_code: shipment.serviceCode || null,
          service_name: shipment.serviceName || null,
          shipment_status: shipment.voided ? 'voided' : 'shipped',
          ship_date: shipment.shipDate ? new Date(shipment.shipDate).toISOString() : null,
          delivery_date: shipment.deliveryDate ? new Date(shipment.deliveryDate).toISOString() : null,
          weight_oz: shipment.shipmentCost?.weight?.value || null,
          shipment_cost: shipment.shipmentCost || null,
          insurance_cost: shipment.insuranceCost || null,
          ship_to_name: shipment.shipTo?.name || null,
          ship_to_city: shipment.shipTo?.city || null,
          ship_to_state: shipment.shipTo?.state || null,
          ship_to_zip: shipment.shipTo?.postalCode || null,
          ship_to_country: shipment.shipTo?.country || null,
          tracking_url: getTrackingUrl(shipment.carrierCode, shipment.trackingNumber),
          last_synced_at: new Date().toISOString()
        };

        const { data: existing } = await supabase
          .from('shipments')
          .select('id')
          .eq('shipstation_id', String(shipment.shipmentId))
          .single();

        if (existing) {
          await supabase
            .from('shipments')
            .update(shipmentData)
            .eq('shipstation_id', String(shipment.shipmentId));
          updated++;
        } else {
          await supabase
            .from('shipments')
            .insert(shipmentData);
          created++;
        }

        if ((created + updated) % 100 === 0) {
          console.log(`Progress: ${created + updated}/${shipments.length} shipments`);
        }

      } catch (err) {
        console.error(`Error syncing shipment ${shipment.shipmentId}:`, err);
        errors++;
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    if (syncLog) {
      await supabase
        .from('sync_log')
        .update({
          status: 'completed',
          records_processed: shipments.length,
          records_created: created,
          records_updated: updated,
          errors: errors,
          completed_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', syncLog.id);
    }

    console.log(`✅ Shipment sync complete! Created: ${created}, Updated: ${updated}, Errors: ${errors}`);

    return NextResponse.json({
      success: true,
      stats: {
        total: shipments.length,
        created,
        updated,
        errors,
        duration: `${duration}s`
      }
    });

  } catch (error) {
    console.error('Shipment sync error:', error);

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
